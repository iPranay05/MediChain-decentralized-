import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('=== Health Advisor API Request ===');
  
  try {
    // Parse the request body
    const body = await request.json();
    const { message } = body;
    console.log('Received message:', message);

    if (!message) {
      console.log('Error: Message is required');
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Generate a response based on the message
    const advisorResponse = generateHealthAdvice(message);
    
    return NextResponse.json({ 
      response: {
        output: advisorResponse,
        result: "success"
      }
    });
  } catch (error) {
    console.error('Error in health advisor API:', error);
    
    // Return the error to the client
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Function to generate health advice based on the user's message
function generateHealthAdvice(message: string): string {
  // Convert message to lowercase for easier matching
  const lowerMessage = message.toLowerCase();
  
  // Check for common healthcare questions and provide appropriate responses
  if (lowerMessage.includes('headache') || lowerMessage.includes('head pain')) {
    return "Headaches can be caused by various factors including stress, dehydration, lack of sleep, or underlying medical conditions. For occasional headaches, rest, hydration, and over-the-counter pain relievers may help. If headaches are severe, persistent, or accompanied by other symptoms, please consult a healthcare professional.";
  }
  
  if (lowerMessage.includes('fever') || lowerMessage.includes('temperature')) {
    return "Fever is often a sign that your body is fighting an infection. Rest, staying hydrated, and taking over-the-counter fever reducers can help manage symptoms. If the fever is high (above 103°F/39.4°C for adults), persists for more than a few days, or is accompanied by severe symptoms, please seek medical attention.";
  }
  
  if (lowerMessage.includes('cold') || lowerMessage.includes('flu') || lowerMessage.includes('cough')) {
    return "Common colds and flu are viral infections that affect the respiratory system. Rest, hydration, and over-the-counter medications can help manage symptoms. If symptoms are severe or persist for more than a week, consider consulting a healthcare professional. Remember to wash hands frequently and cover coughs to prevent spreading illness.";
  }
  
  if (lowerMessage.includes('diet') || lowerMessage.includes('nutrition') || lowerMessage.includes('food')) {
    return "A balanced diet rich in fruits, vegetables, whole grains, lean proteins, and healthy fats is essential for overall health. It's recommended to limit processed foods, added sugars, and excessive salt. Everyone's nutritional needs vary, so consider consulting a registered dietitian for personalized advice.";
  }
  
  if (lowerMessage.includes('exercise') || lowerMessage.includes('workout') || lowerMessage.includes('physical activity')) {
    return "Regular physical activity is important for maintaining health. Adults should aim for at least 150 minutes of moderate-intensity exercise per week, along with muscle-strengthening activities twice a week. Always start gradually and consult with a healthcare provider before beginning a new exercise program, especially if you have existing health conditions.";
  }
  
  if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia') || lowerMessage.includes('tired')) {
    return "Quality sleep is crucial for health. Adults typically need 7-9 hours of sleep per night. Establishing a regular sleep schedule, creating a relaxing bedtime routine, and maintaining a comfortable sleep environment can help improve sleep quality. If you consistently struggle with sleep, consider discussing it with a healthcare provider.";
  }
  
  if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety') || lowerMessage.includes('mental health')) {
    return "Managing stress is important for both mental and physical health. Techniques such as deep breathing, meditation, physical activity, and maintaining social connections can help. If stress or anxiety significantly impacts your daily life, consider seeking support from a mental health professional.";
  }
  
  if (lowerMessage.includes('blood pressure') || lowerMessage.includes('hypertension')) {
    return "Normal blood pressure is typically around 120/80 mmHg. Lifestyle factors that can help maintain healthy blood pressure include regular exercise, a balanced diet low in sodium, limiting alcohol, not smoking, and managing stress. Regular monitoring and following your healthcare provider's recommendations are important if you have concerns about your blood pressure.";
  }
  
  if (lowerMessage.includes('diabetes') || lowerMessage.includes('blood sugar')) {
    return "Diabetes management involves monitoring blood sugar levels, following a balanced diet, regular physical activity, and taking medications as prescribed. Regular check-ups with healthcare providers are essential. If you're concerned about diabetes, consult with a healthcare professional for proper diagnosis and personalized advice.";
  }
  
  // Default response for other health-related queries
  return `I understand you're asking about "${message}". As a health advisor, I can provide general information, but for personalized medical advice, please consult with a qualified healthcare professional. Your health is important, and getting the right care is essential.`;
}
