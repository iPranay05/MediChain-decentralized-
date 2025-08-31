import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import HealthcareSystem from '@/artifacts/contracts/HealthcareSystem.sol/HealthcareSystem.json';

// Sample file data (in production, this would come from IPFS or a secure storage)
const sampleFiles = {
  'REC001': {
    content: 'Lab Report for Pranay Nair\nDate: 2025-03-20\nDepartment: Pathology\nDoctor: Dr. Rajesh Kumar\n\nTest Results:\n- Blood Sugar: Normal\n- Blood Pressure: 120/80\n- Cholesterol: Normal',
    type: 'text/plain',
    name: 'lab_report_pranay.txt'
  },
  'REC002': {
    content: 'Prescription for Aditya Dubey\nDate: 2025-03-20\nDepartment: Cardiology\nDoctor: Dr. Priya Sharma\n\nMedications:\n1. Aspirin 75mg - Once daily\n2. Metoprolol 25mg - Twice daily',
    type: 'text/plain',
    name: 'prescription_aditya.txt'
  },
  'REC003': {
    content: 'Imaging Report for Nidhi Tripathi\nDate: 2025-03-19\nDepartment: Radiology\nDoctor: Dr. Suresh Reddy\n\nFindings:\nX-ray shows normal bone structure\nNo fractures or abnormalities detected',
    type: 'text/plain',
    name: 'imaging_nidhi.txt'
  },
  'REC004': {
    content: 'Discharge Summary for Bhoomi Pandey\nDate: 2025-03-18\nDepartment: General Medicine\nDoctor: Dr. Priya Sharma\n\nTreatment Summary:\nAdmitted for fever and weakness\nTreated with antibiotics\nCondition improved, safe for discharge',
    type: 'text/plain',
    name: 'discharge_bhoomi.txt'
  },
  'REC005': {
    content: 'Prescription for Pranay Nair\nDate: 2025-03-17\nDepartment: Orthopedics\nDoctor: Dr. Suresh Reddy\n\nMedications:\n1. Ibuprofen 400mg - As needed for pain\n2. Calcium supplements - Once daily',
    type: 'text/plain',
    name: 'prescription_pranay.txt'
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get('id');
  
  if (!recordId || !sampleFiles[recordId as keyof typeof sampleFiles]) {
    return new NextResponse('Record not found', { status: 404 });
  }

  const file = sampleFiles[recordId as keyof typeof sampleFiles];
  
  // Convert string content to Uint8Array
  const encoder = new TextEncoder();
  const fileContent = encoder.encode(file.content);

  return new NextResponse(fileContent, {
    headers: {
      'Content-Type': file.type,
      'Content-Disposition': `attachment; filename="${file.name}"`,
    },
  });
}
