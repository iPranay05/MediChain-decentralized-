import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
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

    console.log('Calling Gemini API with message:', message);

    try {
      // Make a direct fetch call to the Gemini API with the correct model and version
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
                    text: `You are a helpful health advisor. Provide general health information and advice. 
                    Always remind users to consult with healthcare professionals for personalized medical advice. 
                    Do not diagnose conditions or prescribe treatments.
                    
                    User query: ${message}`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
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
      let outputText = "I'm sorry, I couldn't process your request at this time.";
      
      if (data.candidates && 
          data.candidates[0] && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts[0] && 
          data.candidates[0].content.parts[0].text) {
        outputText = data.candidates[0].content.parts[0].text;
      }
      
      console.log('Gemini response:', outputText);

      return NextResponse.json({ 
        response: { 
          output: outputText 
        } 
      });
    } catch (error: unknown) {
      console.error('Error with Gemini API:', error);
      
      // Return a hardcoded response if the API call fails
      return NextResponse.json(
        { 
          response: { 
            output: "I'm sorry, I'm having trouble connecting to my knowledge base right now. As a health advisor, I'd recommend consulting with a healthcare professional for any specific health concerns. They can provide personalized advice based on your individual situation." 
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
