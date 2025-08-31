import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { kv } from '@vercel/kv';

const DIGILOCKER_CLIENT_ID = process.env.DIGILOCKER_CLIENT_ID;
const DIGILOCKER_CLIENT_SECRET = process.env.DIGILOCKER_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/digilocker/callback`;

export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      throw new Error('No authorization code received');
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.digitallocker.gov.in/public/oauth2/1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: DIGILOCKER_CLIENT_ID!,
        client_secret: DIGILOCKER_CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    // Get user's Aadhaar details
    const userResponse = await fetch('https://api.digitallocker.gov.in/public/oauth2/1/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    // Store user data in KV store
    await kv.set(`user:${userId}:digilocker`, {
      aadhaar: userData.aadhaar,
      name: userData.name,
      dob: userData.dob,
      gender: userData.gender,
      verified: true,
      updatedAt: new Date().toISOString(),
    });

    // Redirect to profile page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/profile?verified=true`);
  } catch (error) {
    console.error('DigiLocker callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/profile?error=verification-failed`);
  }
}
