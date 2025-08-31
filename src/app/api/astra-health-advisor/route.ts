import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { input_value } = await request.json();

    if (!input_value) {
      return NextResponse.json(
        { error: 'Input value is required' },
        { status: 400 }
      );
    }

    // Get API key and URL from environment variables
    const apiToken = process.env.LANGFLOW_API_TOKEN;
    const apiUrl = process.env.LANGFLOW_API_URL;

    if (!apiToken || !apiUrl) {
      console.error('API token or URL not configured');
      return NextResponse.json(
        { error: 'API token or URL not configured' },
        { status: 500 }
      );
    }

    console.log('Calling Langflow API with input:', input_value);

    // Call Langflow API
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          input_value: input_value,
          output_type: "chat",
          input_type: "chat",
          tweaks: {}
        }),
      });

      // Check content type to handle HTML responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error('Received HTML response instead of JSON');
        return NextResponse.json(
          { error: 'API returned HTML instead of JSON. Authentication may have failed.' },
          { status: 500 }
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Langflow API error:', errorText);
        return NextResponse.json(
          { error: `Failed to get response from Langflow API: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('Langflow API response:', data);
      return NextResponse.json({ response: data });
    } catch (fetchError: unknown) {
      console.error('Fetch error:', fetchError);
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
      return NextResponse.json(
        { error: `Error calling Langflow API: ${errorMessage}` },
        { status: 500 }
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
