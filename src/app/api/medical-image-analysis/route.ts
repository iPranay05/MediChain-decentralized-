import { NextResponse } from 'next/server';

// Function to generate a sample analysis (used as fallback)
function getSampleAnalysis(description: string) {
  const descriptionText = description 
    ? `\nBased on your description: "${description}", ` 
    : '';
    
  return `Based on the image provided, this appears to be a skin rash with the following characteristics:
- Reddened, slightly raised patches on the skin
- Some areas show small bumps or papules
- The distribution pattern is somewhat irregular${descriptionText}

Possible conditions (in order of likelihood):
1. Contact Dermatitis - This is an inflammatory skin condition caused by contact with an irritant or allergen. The appearance and distribution are consistent with this diagnosis.
2. Eczema (Atopic Dermatitis) - A chronic inflammatory skin condition that can present with similar redness and irritation.
3. Allergic Reaction - The rash could be a reaction to medication, food, or environmental factors.

Severity Assessment: Mild to Moderate
The rash appears to be localized and doesn't show signs of severe infection or systemic involvement.

Recommendations:
1. Avoid scratching the affected area to prevent further irritation or infection
2. Apply a cool compress to reduce inflammation and itching
3. Consider using an over-the-counter hydrocortisone cream (1%) for temporary relief
4. Identify and avoid potential triggers or allergens
5. Keep the area clean and dry

When to seek medical attention:
- If the rash spreads or worsens significantly
- If you develop fever, severe pain, or other systemic symptoms
- If the rash persists for more than 1-2 weeks despite home treatment

DISCLAIMER: This analysis is not a medical diagnosis. It is based on visual assessment only and should not replace consultation with a qualified healthcare professional. Please consult with a dermatologist or primary care physician for proper diagnosis and treatment.`;
}

export async function POST(request: Request) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const description = formData.get('description') as string | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    // Get Google API key from environment variables
    const apiKey = process.env.GOOGLE_API_KEY;

    // Log the API key status (but not the actual key for security)
    console.log('API key available:', !!apiKey);

    if (!apiKey) {
      console.error('Google API key not configured');
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    console.log('Analyzing medical image...');
    console.log('Image type:', imageFile.type);
    console.log('Image size:', imageFile.size);
    console.log('Description provided:', !!description);

    try {
      // Convert the image to base64
      const imageBytes = await imageFile.arrayBuffer();
      const base64Image = Buffer.from(imageBytes).toString('base64');
      
      // Prepare the prompt based on whether description is provided
      let promptText = "You are a medical image analysis assistant. Analyze this medical image and provide a detailed assessment. ";
      promptText += "Include possible conditions, severity assessment, and recommendations. ";
      promptText += "Always include a disclaimer that this is not a diagnosis and the patient should consult a healthcare professional.";
      
      if (description) {
        promptText += `\n\nPatient's description of the condition: ${description}`;
      }

      console.log('Sending request to Gemini API...');
      
      // Make a direct fetch call to the Gemini API with multimodal input
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
                  { text: promptText },
                  { 
                    inline_data: { 
                      mime_type: imageFile.type, 
                      data: base64Image 
                    } 
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
        console.error('Response status:', response.status);
        console.error('Response status text:', response.statusText);
        
        // If API call fails, use the fallback response
        console.warn('API error encountered. Using fallback sample response.');
        return NextResponse.json({
          result: {
            analysis: getSampleAnalysis(description || ''),
            imageProcessed: false,
            disclaimer: "This is a fallback response due to API issues. Please consult with a healthcare professional for proper evaluation.",
            error: `API Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`
          }
        });
      }

      const data = await response.json();
      console.log('Gemini API raw response:', JSON.stringify(data).substring(0, 200) + '...');

      // Extract the text from the response
      let analysisText = "";
      
      if (data.candidates && 
          data.candidates[0] && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts[0] && 
          data.candidates[0].content.parts[0].text) {
        analysisText = data.candidates[0].content.parts[0].text;
        console.log('Successfully extracted analysis text from Gemini response');
      } else {
        console.error('Failed to extract text from Gemini response. Response structure:', JSON.stringify(data));
      }
      
      // Structure the response
      const structuredAnalysis = {
        analysis: analysisText || "Unable to analyze the image with the current models.",
        imageProcessed: !!analysisText,
        disclaimer: "This analysis is not a medical diagnosis. Please consult with a healthcare professional for proper evaluation and treatment."
      };
      
      return NextResponse.json({ result: structuredAnalysis });
      
    } catch (error: any) {
      console.error('Error with image processing:', error);
      console.error('Error stack:', error.stack);
      
      // Return a fallback response if the API call fails
      return NextResponse.json(
        { 
          result: {
            analysis: getSampleAnalysis(description || ''),
            imageProcessed: false,
            disclaimer: "This is a fallback response due to API issues. Please consult with a healthcare professional for proper evaluation.",
            error: error.message || 'Unknown error during image processing'
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
