import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { analyzeWorkoutImage } from '@/lib/gemini';
import { getClickUpUser, downloadImage } from '@/lib/clickup';
import crypto from 'crypto';

// Verify webhook signature
function verifyWebhookSignature(body, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return hash === signature;
}

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-signature');
    
    // Verify webhook authenticity
    if (process.env.CLICKUP_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(
        body,
        signature,
        process.env.CLICKUP_WEBHOOK_SECRET
      );
      
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    const data = JSON.parse(body);
    
    // Check if this is a chat message event
    if (data.event !== 'chatMessagePosted') {
      return NextResponse.json({ message: 'Event type not handled' });
    }
    
    const { message_id, user_id, message, attachments } = data;
    
    // Check if message has already been processed
    const { data: existing } = await supabaseAdmin
      .from('workouts')
      .select('id')
      .eq('clickup_message_id', message_id)
      .single();
    
    if (existing) {
      return NextResponse.json({ message: 'Already processed' });
    }
    
    // Get user information
    const user = await getClickUpUser(user_id);
    const userName = user ? user.username : 'Unknown User';
    
    // Process if there's an image attachment
    if (attachments && attachments.length > 0) {
      const imageUrl = attachments[0].url;
      
      // Download and convert image to base64
      const imageBase64 = await downloadImage(imageUrl);
      
      // Analyze with Gemini
      const workoutData = await analyzeWorkoutImage(imageBase64, message);
      
      // Save to Supabase
      const { error } = await supabaseAdmin
        .from('workouts')
        .insert({
          user_name: userName,
          activity_type: workoutData.activity_type,
          date: workoutData.date || new Date().toISOString().split('T')[0],
          duration_minutes: workoutData.duration_minutes,
          calories_burned: workoutData.calories_burned,
          heart_rate_avg: workoutData.heart_rate_avg,
          distance_km: workoutData.distance_km,
          raw_message: message,
          image_url: imageUrl,
          clickup_message_id: message_id
        });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Workout processed successfully' 
      });
    }
    
    return NextResponse.json({ 
      message: 'No image attachment found' 
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}