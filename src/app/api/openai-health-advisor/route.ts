import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get OpenAI API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    console.log('Calling OpenAI API with message:', message);

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    try {
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful health advisor. Provide general health information and advice. Always remind users to consult with healthcare professionals for personalized medical advice. Do not diagnose conditions or prescribe treatments."
          },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0].message.content;
      console.log('OpenAI response:', response);

      return NextResponse.json({ 
        response: { 
          output: response 
        } 
      });
    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError);
      return NextResponse.json(
        { error: `Error calling OpenAI API: ${openaiError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
