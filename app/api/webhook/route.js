import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { text, user, timestamp, imageUrl, channelId } = await request.json();

    // Validate required fields
    if (!text || !user) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Process the message with Gemini AI
    const workoutData = await processWorkoutMessage(text, user, imageUrl);

    // Store in Supabase
    const { data, error } = await supabase
      .from('workouts')
      .insert([{
        ...workoutData,
        raw_message: text,
        channel_id: channelId,
        created_at: timestamp || new Date().toISOString()
      }]);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ message: 'Database error', error }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Workout processed successfully', 
      data: workoutData 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

async function processWorkoutMessage(text, user, imageUrl) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let prompt = `
    Analyze this workout message and extract structured information:
    Message: "${text}"
    User: "${user}"
    
    Please extract and return ONLY a JSON object with these fields:
    - individual: The person's name
    - workout_type: Type of exercise (e.g., "Running", "Basketball", "Cycling")
    - date: Today's date in YYYY-MM-DD format
    - duration: Estimated workout duration in minutes (number)
    - calories: Estimated calories burned (number)
    - notes: Any additional notes or details
    
    If specific data isn't available, make reasonable estimates based on the workout type.
    Return only valid JSON, no additional text.
    `;

    let result;

    if (imageUrl) {
      // Process image with text
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');

      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: imageResponse.headers.get('content-type') || 'image/jpeg'
          }
        }
      ]);
    } else {
      result = await model.generateContent(prompt);
    }

    const response = await result.response;
    const text_response = response.text();
    
    const cleanedResponse = text_response.replace(/```json|```/g, '').trim();
    const workoutData = JSON.parse(cleanedResponse);

    return {
      individual: workoutData.individual || user,
      workout_type: workoutData.workout_type || 'General Fitness',
      date: workoutData.date || new Date().toISOString().split('T')[0],
      duration: workoutData.duration || 30,
      calories: workoutData.calories || 200,
      heart_rate: workoutData.heart_rate || null,
      steps: workoutData.steps || null,
      distance: workoutData.distance || null,
      notes: workoutData.notes || null
    };

  } catch (error) {
    console.error('AI processing error:', error);
    
    return {
      individual: user,
      workout_type: 'General Fitness',
      date: new Date().toISOString().split('T')[0],
      duration: 30,
      calories: 200,
      heart_rate: null,
      steps: null,
      distance: null,
      notes: text
    };
  }
}