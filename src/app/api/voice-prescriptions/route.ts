import { NextResponse } from 'next/server';

// Define the VoicePrescription type
interface VoicePrescription {
  id: string;
  patientId: string | null;
  patientName: string;
  patientAadhar: string;
  doctorName: string;
  department: string;
  date: string;
  transcription: string;
  audioData: string | null; // Base64 encoded audio data
  status: 'new' | 'viewed' | 'completed';
}

// Declare the global variable with proper typing
declare global {
  var voicePrescriptions: VoicePrescription[];
}

// Use a global variable to store prescriptions for the duration of the server session
// This will persist between API calls but will reset when the server restarts
global.voicePrescriptions = global.voicePrescriptions || [];

// Add some initial prescriptions if none exist
if (global.voicePrescriptions.length === 0) {
  global.voicePrescriptions = [
    {
      id: 'VP1001',
      patientId: 'P001',
      patientName: 'Pranay Nair',
      patientAadhar: '463326556422',
      doctorName: 'Dr. John Doe',
      department: 'General Medicine',
      date: new Date().toISOString(),
      transcription: "I'm prescribing Metformin 500mg to be taken twice daily with meals",
      audioData: null,
      status: 'new'
    }
  ];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientAadhar = searchParams.get('patientAadhar');
    
    const prescriptions = global.voicePrescriptions;
    
    if (patientAadhar) {
      // Filter prescriptions for a specific patient by Aadhar number
      const patientPrescriptions = prescriptions.filter(
        (prescription: VoicePrescription) => prescription.patientAadhar === patientAadhar
      );
      return NextResponse.json({ prescriptions: patientPrescriptions });
    }
    
    // Return all prescriptions if no Aadhar number is provided
    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.patientAadhar || !data.doctorName || !data.transcription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create a new prescription with a unique ID
    const newPrescription: VoicePrescription = {
      id: `VP${Date.now()}`,
      patientId: data.patientId || null,
      patientName: data.patientName,
      patientAadhar: data.patientAadhar,
      doctorName: data.doctorName,
      department: data.department || 'General Medicine',
      date: data.date || new Date().toISOString(),
      transcription: data.transcription,
      audioData: data.audioData || null,
      status: 'new'
    };
    
    // Add to the prescriptions array
    global.voicePrescriptions.unshift(newPrescription);
    
    // Log the prescription for debugging
    console.log('New prescription created:', {
      ...newPrescription,
      audioData: newPrescription.audioData ? '[BASE64_AUDIO_DATA]' : null
    });
    console.log('Total prescriptions:', global.voicePrescriptions.length);
    
    return NextResponse.json({ 
      success: true, 
      prescription: newPrescription 
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    return NextResponse.json(
      { error: 'Failed to create prescription' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.id || !data.status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const prescriptions = global.voicePrescriptions;
    
    // Find and update the prescription
    const prescriptionIndex = prescriptions.findIndex((p: VoicePrescription) => p.id === data.id);
    
    if (prescriptionIndex === -1) {
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      );
    }
    
    // Update the prescription
    prescriptions[prescriptionIndex] = {
      ...prescriptions[prescriptionIndex],
      status: data.status
    };
    
    return NextResponse.json({ 
      success: true, 
      prescription: prescriptions[prescriptionIndex] 
    });
  } catch (error) {
    console.error('Error updating prescription:', error);
    return NextResponse.json(
      { error: 'Failed to update prescription' },
      { status: 500 }
    );
  }
}
