// app/api/webhook/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { analyzeWorkoutImage } from '@/lib/gemini';
import { getClickUpUser, downloadImage } from '@/lib/clickup';
import { storeLogs } from '@/lib/utils';
import crypto from 'crypto';

// Ensure Node runtime (Buffer/crypto) and no caching for webhooks
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// HMAC check (only if both secret & header present so ClickUp "Test" can pass)
function verifyWebhookSignature(body, signature, secret) {
  const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return hash === signature;
}

// Helper: remove all image markdown/HTML and newlines from text_content
function extractMessage(textContent = '') {
  return textContent
    // Remove Markdown images: ![alt](url)
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Remove HTML <img ...> tags
    .replace(/<img[^>]*>/gi, '')
    // Remove any standalone image file names (e.g., .png, .jpg, .jpeg, .gif, .webp, .svg)
    .replace(/\b\S+\.(png|jpe?g|gif|webp|svg)\b/gi, '')
    // Remove newlines
    .replace(/\n/g, '')
    .trim();
}

export async function POST(request) {
  try {
    const raw = await request.text();
    const secret = process.env.CLICKUP_WEBHOOK_SECRET;
    const sig = request.headers.get('x-signature');

    storeLogs(request, raw).catch(console.error); // log but don't block

    if (secret && sig && !verifyWebhookSignature(raw, sig, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(raw);
    const msg = data?.payload?.data;
    if (!msg) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  // Pull what we need from the real ClickUp payload
  const message_id = String(msg.id);
  const user_id = String(msg.userid);
  const text_content = msg.text_content || '';
  const message = extractMessage(text_content);

  // First image in the comment blocks, if any
  const imageUrl = msg.comment?.find(c => c.type === 'image')?.image?.url;

    // Upsert a raw log row (optional but super useful)
    const supa = getSupabaseAdmin();
    await supa.from('webhook_logs').insert({
      headers: Object.fromEntries(request.headers.entries()),
      body: raw,
      valid_signature: !!(secret && sig),
    });

    if (!imageUrl) {
      return NextResponse.json({ message: 'No image attachment found' });
    }

    // Download image and convert to base64 (server-side)
    const imageBase64 = await downloadImage(imageUrl);

    // try to read mapping
    let userName = null;
    const { data: mapRow } = await supa
      .from('team_users')
      .select('user_name')
      .eq('user_id', user_id)
      .maybeSingle();

    if (mapRow?.user_name) {
      userName = mapRow.user_name;
    } else {
      // create placeholder "user-<id>" so views show something
      userName = `user-${user_id}`;
      await supa
        .from('team_users')
        .upsert({ user_id: user_id, user_name: userName }, { onConflict: 'user_id' });
    }

    // Analyze with Gemini
    const workoutData = await analyzeWorkoutImage(imageBase64, message);

    // Save to Supabase (store both user_id and user_name)
    const { error } = await supa.from('workouts').insert({
      user_id,
      activity_type: workoutData.activity_type,
      date: new Date().toISOString().split('T')[0],
      duration_minutes: workoutData.duration_minutes,
      calories_burned: workoutData.calories_burned,
      heart_rate_avg: workoutData.heart_rate_avg,
      distance_km: workoutData.distance_km,
      raw_message: message,
      image_url: imageUrl,
      clickup_message_id: message_id,
    });
    if (error) throw error;

    // Mark last log as processed (optional)
    await supa.rpc('mark_last_webhook_processed'); // or do an update by id if you stored it

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  // Simple health check for ClickUp test
  return NextResponse.json({ ok: true, ts: Date.now() });
}
