import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { symptoms } = await request.json();

    if (!symptoms || !symptoms.trim()) {
      return NextResponse.json(
        { error: 'Symptoms description is required' },
        { status: 400 }
      );
    }

    // Get Google API key from environment variables
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.error('Google API key not configured');
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    console.log('Analyzing symptoms:', symptoms);

    try {
      // Make a direct fetch call to the Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `As a medical assistant, analyze these symptoms and provide:
                    1. Possible conditions (list 3-5 most likely)
                    2. Severity assessment (mild, moderate, severe)
                    3. Recommended actions (home care, consult doctor, emergency)
                    4. When to seek immediate medical attention
                    
                    Format the response as JSON with the following structure:
                    {
                      "possibleConditions": [{"name": "condition name", "probability": "high/medium/low", "description": "brief description"}],
                      "severity": "mild/moderate/severe",
                      "recommendedActions": ["action 1", "action 2"],
                      "seekMedicalAttention": "when to seek medical attention",
                      "disclaimer": "medical disclaimer"
                    }
                    
                    Patient symptoms: ${symptoms}
                    
                    IMPORTANT: Include a clear disclaimer that this is not a diagnosis and the patient should consult a healthcare professional.`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 800,
              topP: 0.8,
              topK: 40
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response:', errorText);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Gemini API raw response:', data);

      // Extract the text from the response
      let outputText = "";
      
      if (data.candidates && 
          data.candidates[0] && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts[0] && 
          data.candidates[0].content.parts[0].text) {
        outputText = data.candidates[0].content.parts[0].text;
      }
      
      // Try to parse the JSON response
      try {
        // Find JSON in the response (it might be surrounded by markdown or other text)
        const jsonMatch = outputText.match(/\{[\s\S]*\}/);
        let parsedResponse;
        
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON found, create a structured response
          parsedResponse = {
            possibleConditions: [],
            severity: "unknown",
            recommendedActions: ["Consult with a healthcare professional"],
            seekMedicalAttention: "If symptoms persist or worsen",
            disclaimer: "This information is not a diagnosis. Always consult with a healthcare professional."
          };
        }
        
        return NextResponse.json({ analysis: parsedResponse });
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        // Return the raw text if JSON parsing fails
        return NextResponse.json({ 
          analysis: {
            rawText: outputText,
            disclaimer: "This information is not a diagnosis. Always consult with a healthcare professional."
          }
        });
      }
    } catch (error) {
      console.error('Error with Gemini API:', error);
      
      // Return a fallback response if the API call fails
      return NextResponse.json(
        { 
          analysis: {
            possibleConditions: [],
            severity: "unknown",
            recommendedActions: ["Consult with a healthcare professional"],
            seekMedicalAttention: "If you're experiencing severe symptoms, please seek immediate medical attention",
            disclaimer: "This system is currently unavailable. The information provided is not a diagnosis. Always consult with a healthcare professional."
          }
        },
        { status: 200 }
      );
    }
  } catch (error: unknown) {
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
