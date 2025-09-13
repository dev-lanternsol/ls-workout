import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function analyzeWorkoutImage(imageBase64, textMessage) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      Analyze this workout image and message. Extract the following information:
      - Activity type (e.g., running, basketball, cycling, gym)
      - Duration in minutes
      - Calories burned (Estimate if not visible)
      - Average heart rate
      - Distance in km (if applicable)
      - Date of workout
      
      Message from user: "${textMessage}"
      
      Return the data in this exact JSON format:
      {
        "activity_type": "string",
        "duration_minutes": number,
        "calories_burned": number,
        "heart_rate_avg": number,
        "distance_km": number or null,
        "date": "YYYY-MM-DD"
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