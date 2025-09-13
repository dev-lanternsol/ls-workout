// app/api/webhook/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { analyzeWorkoutImage } from '@/lib/gemini';
import { getClickUpUser, downloadImage } from '@/lib/clickup';
import crypto from 'crypto';

// Ensure Node runtime (Buffer/crypto) and no caching for webhooks
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// HMAC check (only if both secret & header present so ClickUp "Test" can pass)
function verifyWebhookSignature(body, signature, secret) {
  const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return hash === signature;
}

// Helper: remove all "image.png" and newlines from text_content
function extractMessage(textContent = '') {
  return textContent
    .replace(/image\.png/gi, '')
    .replace(/\n/g, '')
    .trim();
}

async function storeLogs(request, body) {
  // inside POST() at the top, right after reading body/signature
  const headersObj = Object.fromEntries([...request.headers.entries()]);
  const supa = getSupabaseAdmin();
  await supa.from('webhook_logs').insert({
    headers: headersObj,
    body,
    valid_signature: !!(process.env.CLICKUP_WEBHOOK_SECRET && request.headers.get('x-signature')),
  });
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

    // (Optional) if you want to resolve the user’s name
    let userName = `user-${user_id}`;
    try {
      const user = await getClickUpUser(user_id);
      if (user?.username) userName = user.username;
    } catch (_) {}

    // Analyze with Gemini
    const workoutData = await analyzeWorkoutImage(imageBase64, message);

    // Save to Supabase
    const { error } = await supa.from('workouts').insert({
      user_name: userName,
      activity_type: workoutData.activity_type,
      date: workoutData.date || new Date().toISOString().split('T')[0],
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
