import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function analyzeWorkoutImage(imageBase64, textMessage) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      Analyze this workout image and message. Extract the following information:
      - Activity type (e.g., running, basketball, cycling, gym, Always capitalize)
      - Duration in minutes
      - Calories burned, estimate if not visible based on activity and duration
      - Average heart rate
      - Distance in km (if applicable)
      
      Message from user: "${textMessage}"
      
      Return the data in this exact JSON format:
      {
        "activity_type": "string",
        "duration_minutes": number,
        "calories_burned": number,
        "heart_rate_avg": number or null,
        "distance_km": number or null
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Could not parse workout data');
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// NEW: text-only analysis used when there’s no usable image
export async function analyzeWorkoutText(textMessage) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
  From ONLY the text below, infer a workout summary.
  If a value isn't stated, make it 0, null or UNKNOWN accordingly.

  Text: "${textMessage}"

  Return STRICT JSON:
  {"activity_type":string, "duration_minutes":number or null, "calories_burned":number or null, "heart_rate_avg":number or null, "distance_km":number or null}
  `;

  const result = await model.generateContent([prompt]);
  const text = (await result.response).text();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    // fall back to zeros if model returns non-JSON
    return {
      activity_type: 'UNKNOWN',
      duration_minutes: null,
      calories_burned: null,
      heart_rate_avg: null,
      distance_km: null,
    };
  }
  return JSON.parse(match[0]);
}