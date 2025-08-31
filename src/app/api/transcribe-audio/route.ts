import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(request: Request) {
  try {
    // Parse the form data from the request
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }
    
    // In a production environment, we would use Google's Speech-to-Text API
    // or a similar service to transcribe the audio
    // For this demo, we'll simulate a transcription with a delay
    
    // Convert the audio file to a buffer
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demonstration purposes, we'll return a sample transcription
    // In a real implementation, you would send the audio to a transcription service
    
    // Sample medical prescriptions for demonstration
    const samplePrescriptions = [
      "Patient is prescribed Amoxicillin 500mg, to be taken three times daily for 7 days. Take with food to avoid stomach upset. Follow up in two weeks if symptoms persist.",
      "I'm prescribing Metformin 500mg to be taken twice daily with meals. Monitor blood sugar levels regularly and report any unusual symptoms. Schedule a follow-up appointment in one month.",
      "For the patient's hypertension, I recommend Lisinopril 10mg once daily. Take in the morning with or without food. Avoid salt substitutes containing potassium. Return for blood pressure check in three weeks.",
      "The patient should take Atorvastatin 20mg once daily at bedtime for cholesterol management. Maintain a low-fat diet and exercise regularly. Schedule lipid panel in 3 months."
    ];
    
    // Randomly select one of the sample prescriptions
    const randomIndex = Math.floor(Math.random() * samplePrescriptions.length);
    const transcription = samplePrescriptions[randomIndex];
    
    return NextResponse.json({ text: transcription });
    
  } catch (error) {
    console.error('Error processing audio:', error);
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
}
