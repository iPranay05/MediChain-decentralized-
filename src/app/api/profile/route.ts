import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's DigiLocker data from KV store
    const profile = await kv.get(`user:${userId}:digilocker`);

    if (!profile) {
      return NextResponse.json({ verified: false });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Store DigiLocker data in KV store
    await kv.set(`user:${userId}:digilocker`, {
      ...data,
      verified: true,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
