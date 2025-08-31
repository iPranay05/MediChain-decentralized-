import { NextResponse } from 'next/server';

const DIGILOCKER_CLIENT_ID = process.env.DIGILOCKER_CLIENT_ID;
const DIGILOCKER_CLIENT_SECRET = process.env.DIGILOCKER_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/digilocker/callback`;

export async function GET() {
  try {
    // Generate a random state for security
    const state = Math.random().toString(36).substring(7);
    
    // Create DigiLocker authorization URL
    const authUrl = `https://api.digitallocker.gov.in/public/oauth2/1/authorize?response_type=code&client_id=${DIGILOCKER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${state}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('DigiLocker init error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize DigiLocker authentication' },
      { status: 500 }
    );
  }
}
