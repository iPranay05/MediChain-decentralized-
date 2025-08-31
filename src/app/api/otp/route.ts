import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Type definitions
type OTPStore = {
  [key: string]: {
    otp: string;
    timestamp: number;
    attempts: number;
  };
};

// Mock database of Aadhar-Mobile mappings (registered users)
const aadharMobileMap: { [key: string]: string } = {
  '463326556422': '7718960126',
  '569963877196': '9867339772',
  '342184819839': '8850212646',
  '617388697137': '8169426114'
};

// Store OTPs (in production, use Redis or similar)
const otpStore: OTPStore = {};

// Generate secure random OTP
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Rate limiting and security checks
function isRateLimited(aadharNumber: string): boolean {
  const record = otpStore[aadharNumber];
  if (!record) return false;

  const now = Date.now();
  const timeSinceLastAttempt = now - record.timestamp;

  // Rate limit: 3 attempts within 5 minutes
  return record.attempts >= 3 && timeSinceLastAttempt < 5 * 60 * 1000;
}

export async function POST(request: Request) {
  try {
    const { aadharNumber, otp, action } = await request.json();

    // Validate Aadhar number format
    if (!/^\d{12}$/.test(aadharNumber)) {
      return NextResponse.json(
        { error: 'Invalid Aadhar number format' },
        { status: 400 }
      );
    }

    // Check if this is a registered user (needs OTP) or unregistered (direct access)
    const isRegisteredUser = aadharNumber in aadharMobileMap;

    if (action === 'send') {
      // For unregistered users, return success without generating OTP
      if (!isRegisteredUser) {
        return NextResponse.json({
          success: true,
          message: 'Direct access granted for unregistered user',
          debug: { directAccess: true }
        });
      }

      // For registered users, proceed with OTP generation and validation
      if (isRateLimited(aadharNumber)) {
        return NextResponse.json(
          { error: 'Too many attempts. Please try again later.' },
          { status: 429 }
        );
      }

      const newOTP = generateOTP();
      const now = Date.now();

      otpStore[aadharNumber] = {
        otp: newOTP,
        timestamp: now,
        attempts: 0
      };

      // In production, send OTP via SMS
      console.log(`OTP for ${aadharNumber}: ${newOTP}`);

      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
        debug: { otp: newOTP } // Remove in production
      });

    } else if (action === 'verify') {
      // For unregistered users, always return success
      if (!isRegisteredUser) {
        return NextResponse.json({
          success: true,
          message: 'Access granted for unregistered user'
        });
      }

      // For registered users, verify OTP
      const record = otpStore[aadharNumber];
      if (!record) {
        return NextResponse.json(
          { error: 'No OTP found. Please request a new one.' },
          { status: 400 }
        );
      }

      record.attempts++;

      if (isRateLimited(aadharNumber)) {
        return NextResponse.json(
          { error: 'Too many attempts. Please try again later.' },
          { status: 429 }
        );
      }

      if (otp !== record.otp) {
        return NextResponse.json(
          { error: 'Invalid OTP' },
          { status: 400 }
        );
      }

      // Check if OTP is expired (5 minutes)
      const now = Date.now();
      if (now - record.timestamp > 5 * 60 * 1000) {
        return NextResponse.json(
          { error: 'OTP expired. Please request a new one.' },
          { status: 400 }
        );
      }

      // Clear OTP after successful verification
      delete otpStore[aadharNumber];

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in OTP route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
