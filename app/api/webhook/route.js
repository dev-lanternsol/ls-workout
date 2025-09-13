// app/api/webhook/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { analyzeWorkoutImage } from '@/lib/gemini';
import { getClickUpUser, downloadImage } from '@/lib/clickup';
import crypto from 'crypto';

function verifyWebhookSignature(body, signature, secret) {
  const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return hash === signature;
}

export async function POST(request) {
  try {
    const body = await request.text();

    const secret = process.env.CLICKUP_WEBHOOK_SECRET;
    const signature = request.headers.get('x-signature');

    // inside POST() at the top, right after reading body/signature
    const headersObj = Object.fromEntries([...request.headers.entries()]);
    const supa = getSupabaseAdmin();
    await supa.from('webhook_logs').insert({
      headers: headersObj,
      body,
      valid_signature: !!(process.env.CLICKUP_WEBHOOK_SECRET && request.headers.get('x-signature')),
    });


    // Verify ONLY if both secret and signature are present
    if (secret && signature) {
      const isValid = verifyWebhookSignature(body, signature, secret);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const data = JSON.parse(body);
    if (data.event !== 'chatMessagePosted') {
      return NextResponse.json({ message: 'Event type not handled' });
    }

    const supabaseAdmin = getSupabaseAdmin();   // <-- create after envs exist

    const { message_id, user_id, message, attachments } = data;

    const { data: existing } = await supabaseAdmin
      .from('workouts')
      .select('id')
      .eq('clickup_message_id', message_id)
      .single();

    if (existing) return NextResponse.json({ message: 'Already processed' });

    const user = await getClickUpUser(user_id);
    const userName = user ? user.username : 'Unknown User';

    if (attachments?.length) {
      const imageUrl = attachments[0].url;
      const imageBase64 = await downloadImage(imageUrl);
      const workoutData = await analyzeWorkoutImage(imageBase64, message);

      const { error } = await supabaseAdmin.from('workouts').insert({
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

      return NextResponse.json({ success: true, message: 'Workout processed successfully' });
    }

    return NextResponse.json({ message: 'No image attachment found' });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
