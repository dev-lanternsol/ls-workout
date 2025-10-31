import fetch from 'node-fetch';

export async function analyzeWorkoutWithCurl(imageBase64, textMessage) {
  try {
    const prompt = `
      Analyze this workout image ${textMessage?.trim() ? 'and the optional text below' : '(no additional text provided)'}.
      Extract:
      - Activity type (e.g., running, basketball, cycling, gym, Always capitalize)
      - Duration in minutes
      - Calories burned, estimate if not visible based on activity and duration
      - Average heart rate
      - Distance in km (if applicable)
      
      ${textMessage?.trim() ? `\nMessage from user: "${textMessage}"\n` : ''}
      
      Return the data in this exact JSON format:
      {
        "activity_type": "string",
        "duration_minutes": number,
        "calories_burned": number,
        "heart_rate_avg": number or null,
        "distance_km": number or null
      }
    `;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64
              }
            }
          ]
        }
      ]
    };

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
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

export async function analyzeWorkoutTextWithCurl(textMessage) {
  console.log('Analyzing workout text with Gemini...', textMessage);
  try {
    const prompt = `
    From ONLY the text below, infer a workout summary.
    If a value isn't stated, make it 0, null or UNKNOWN accordingly.

    Text: "${textMessage}"

    Return STRICT JSON:
    {"activity_type":string, "duration_minutes":number or null, "calories_burned":number or null, "heart_rate_avg":number or null, "distance_km":number or null}
    `;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return {
        activity_type: 'UNKNOWN',
        duration_minutes: null,
        calories_burned: null,
        heart_rate_avg: null,
        distance_km: null,
      };
    }
    return JSON.parse(match[0]);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}