// /lib/webhook-processor.js
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { analyzeWorkoutImage, analyzeWorkoutText } from '@/lib/gemini';
import { downloadImage } from '@/lib/clickup';

// -------------------- helpers --------------------

// Replace your current extractMessage with this:
function extractMessage(textContent = '') {
  return textContent
    // 1) Remove Markdown images and keep alt text out
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    // 2) Replace Markdown links [text](url) with just "text"
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ')
    // 3) Remove HTML <img ...> entirely
    .replace(/<img[^>]*>/gi, ' ')
    // 4) Replace HTML links <a href="...">text</a> with just "text"
    .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1 ')
    // 5) Remove any bare media filenames that might appear in text
    .replace(/\b\S+\.(png|jpe?g|gif|webp|svg|bmp|tiff?|mp4|mov|avi|mkv|webm|m4v)\b/gi, ' ')
    // 6) Remove any http/https URLs (including query params like ?view=open)
    .replace(/https?:\/\/\S+/gi, ' ')
    // 7) Normalize all whitespace/newlines to a single space
    .replace(/\s+/g, ' ')
    // 8) Trim ends
    .trim();
}


function isValidHttpUrl(u) {
  try {
    const x = new URL(u);
    return x.protocol === 'http:' || x.protocol === 'https:';
  } catch {
    return false;
  }
}

// crude extension test (ClickUp gives typed blocks; this is extra safety)
const IMG_EXT = /\.(png|jpe?g|gif|webp|bmp|svg|tiff?)$/i;
const VID_EXT = /\.(mp4|mov|avi|mkv|webm|m4v)$/i;

const isLikelyVideo = (url = '') => VID_EXT.test(url);
const isLikelyImage = (url = '') => IMG_EXT.test(url);

/**
 * Build ordered lists of attachment URLs from ClickUp payload.
 */
function extractAttachmentUrls(msg) {
  const images = [];
  const videos = [];
  const invalid = [];

  const blocks = Array.isArray(msg?.comment) ? msg.comment : [];

  for (const c of blocks) {
    // Common shapes:
    const rawUrl =
      c?.image?.url ||
      c?.attachment?.url ||
      c?.url ||
      c?.value?.url ||
      c?.file?.url ||
      null;

    if (!rawUrl) continue;

    if (!isValidHttpUrl(rawUrl)) { invalid.push(rawUrl); continue; }
    if (c?.type === 'video' || isLikelyVideo(rawUrl)) { videos.push(rawUrl); continue; }
    if (c?.type === 'image' || isLikelyImage(rawUrl)) { images.push(rawUrl); continue; }

    // Unknown type → infer; default to image candidate
    if (isLikelyVideo(rawUrl)) videos.push(rawUrl);
    else images.push(rawUrl);
  }

  return { images, videos, invalid };
}

// round + clamp utility
function roundInt(n, { min = 0, max = Infinity } = {}) {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  const r = Math.round(v);
  if (r < min) return min;
  if (r > max) return max === Infinity ? r : max;
  return r;
}

/**
 * Normalize Gemini output to DB-friendly integers.
 * (Change distance_km if your column is numeric/float.)
 */
function normalizeWorkout(workout) {
  return {
    activity_type: workout?.activity_type ?? null,
    duration_minutes: roundInt(workout?.duration_minutes, { min: 0, max: 24 * 60 }) ?? 0,
    calories_burned: roundInt(workout?.calories_burned, { min: 0, max: 100000 }) ?? 0,
    heart_rate_avg: Number.isFinite(workout?.heart_rate_avg) ? roundInt(workout?.heart_rate_avg, { min: 20, max: 250 }) : null,
    // Distance: NULL if not provided (only clamp if a number exists)
    distance_km: Number.isFinite(workout?.distance_km) ? parseFloat(workout?.distance_km.toFixed(2)) : null,
  };
}

// Always insert something, even if parsing fails
function minimalFallbackWorkout() {
  return {
    activity_type: 'unknown',
    duration_minutes: 0,
    calories_burned: 0,
    heart_rate_avg: null,
    distance_km: 0,
  };
}

// -------------------- processor --------------------

/**
 * Core processing for live and reprocess flows.
 * - tries multiple images
 * - skips videos/invalid URLs
 * - text-only fallback
 * - minimal fallback insert
 * - idempotent insert on clickup_message_id
 */
export async function processClickUpRaw(raw, opts = {}) {
  const supa = getSupabaseAdmin();

  // 1) Parse and preflight
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { success: false, info: { reason: 'Invalid JSON in raw body' } };
  }

  const msg = data?.payload?.data;
  if (!msg) return { success: false, info: { reason: 'Invalid payload structure' } };

  const message_id = String(msg.id);
  const user_id = String(msg.userid);
  const text_content = msg.text_content || '';
  const message = extractMessage(text_content);
  const hasText = message.length > 0;

  const { images, videos, invalid } = extractAttachmentUrls(msg);

  // 2) Ensure user mapping (idempotent)
  let userName = null;
  const { data: mapRow, error: mapErr } = await supa
    .from('team_users')
    .select('user_name')
    .eq('user_id', user_id)
    .maybeSingle();
  if (mapErr) return { success: false, info: { reason: 'team_users lookup failed', error: mapErr } };

  if (mapRow?.user_name) userName = mapRow.user_name;
  else {
    userName = `user-${user_id}`;
    const { error: upErr } = await supa
      .from('team_users')
      .upsert({ user_id, user_name: userName }, { onConflict: 'user_id' });
    if (upErr) return { success: false, info: { reason: 'team_users upsert failed', error: upErr } };
  }

  // Helper: insert + idempotency handling
  const insertWorkout = async (normalized, imageUrl = null, note = undefined) => {
    const payload = {
      user_id,
      activity_type: normalized.activity_type,
      date: new Date().toISOString().split('T')[0],
      duration_minutes: normalized.duration_minutes,
      calories_burned: normalized.calories_burned,
      heart_rate_avg: normalized.heart_rate_avg,
      distance_km: normalized.distance_km,
      raw_message: message,
      image_url: imageUrl, // can be null (text-only / fallback)
      clickup_message_id: message_id,
    };

    const { error: insertErr } = await supa.from('workouts').insert(payload);
    if (insertErr) {
      const msg = (insertErr?.message || '').toLowerCase();
      const isDup =
        msg.includes('duplicate key') ||
        msg.includes('unique constraint') ||
        msg.includes('already exists');

      if (isDup) {
        return { success: true, info: { message_id, user_id, imageUrl, note: note ?? 'Duplicate, treated as success' } };
      }
      return { success: false, info: { reason: 'Insert failed', error: insertErr } };
    }
    return { success: true, info: { message_id, user_id, imageUrl, note } };
  };

  // 3) Try each image candidate
  const perImageErrors = [];
  for (const imageUrl of images) {
    if (!isValidHttpUrl(imageUrl)) { perImageErrors.push({ imageUrl, step: 'validate', error: 'Invalid URL' }); continue; }
    if (isLikelyVideo(imageUrl)) { perImageErrors.push({ imageUrl, step: 'validate', error: 'Video URL (unsupported)' }); continue; }

    let imageBase64;
    try {
      imageBase64 = await downloadImage(imageUrl);
    } catch (e) {
      perImageErrors.push({ imageUrl, step: 'download', error: String(e) });
      continue;
    }

    let workoutData;
    try {
      workoutData = await analyzeWorkoutImage(imageBase64, message);
    } catch (e) {
      perImageErrors.push({ imageUrl, step: 'gemini', error: String(e) });
      continue;
    }

    const normalized = normalizeWorkout(workoutData);
    const res = await insertWorkout(normalized, imageUrl);
    if (res.success) return res;

    // Non-dup insert error → record and try next image
    perImageErrors.push({ imageUrl, step: 'insert', error: res.info?.error });
  }

  // 4) No usable image or all images failed → TEXT-ONLY fallback
  if (hasText) {
    try {
      const textOnly = await analyzeWorkoutText(message); // implement/export in '@/lib/gemini'
      const normalized = normalizeWorkout(textOnly);
      const res = await insertWorkout(normalized, null, 'Text-only analysis');
      if (res.success) return res;
      // else fall through to minimal
    } catch (_) {
      // ignore and fall through
    }
  }

  // 5) Minimal fallback insert (guarantee persistence)
  const fallback = minimalFallbackWorkout();
  const res = await insertWorkout(
    fallback,
    null,
    images.length === 0 ? 'Fallback: no usable image' : 'Fallback: all images failed'
  );

  if (res.success) {
    return {
      success: true,
      info: {
        ...res.info,
        diagnostics: {
          reason:
            images.length === 0
              ? (videos.length > 0 || invalid.length > 0
                  ? 'No usable image (videos/invalid only)'
                  : 'No attachments')
              : 'All image candidates failed',
          errors: perImageErrors,
          videosCount: videos.length,
          invalidCount: invalid.length,
        },
      },
    };
  }

  // If even fallback insert failed (e.g., DB outage)
  return {
    success: false,
    info: {
      reason: 'Failed to insert even minimal fallback',
      message_id,
      errors: perImageErrors,
      videosCount: videos.length,
      invalidCount: invalid.length,
      insertError: res.info?.error,
    },
  };
}
