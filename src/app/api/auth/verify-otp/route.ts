import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { OTPManagementService } from '@/lib/otp-management-service';
import crypto from 'crypto';

const verifyOTPSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Verify OTP API called');
    const body = await request.json();
    console.log('🔍 DEBUG: Request body:', JSON.stringify(body, null, 2));

    // Validate input
    const validatedData = verifyOTPSchema.parse(body);
    console.log('🔍 DEBUG: Validated data:', validatedData);

    // Find the most recent unused OTP for this phone number
    const otpRecord = await db.whatsAppOTP.findFirst({
      where: {
        phone: validatedData.phone,
        otp: validatedData.otp,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Check if OTP exists and is valid
    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP code' },
        { status: 400 }
      );
    }

    // Check if user exists and is active
    if (!otpRecord.user || otpRecord.user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'User account is not active' },
        { status: 400 }
      );
    }

    // Validate OTP attempts using the management service
    const attemptValidation = await OTPManagementService.validateOTPAttempts(otpRecord.id);
    if (!attemptValidation.valid) {
      return NextResponse.json(
        { error: 'OTP code has been used too many times' },
        { status: 400 }
      );
    }

    // Increment attempts
    await OTPManagementService.incrementOTPAttempts(otpRecord.id);

    // Mark OTP as used
    await db.whatsAppOTP.update({
      where: { id: otpRecord.id },
      data: {
        used: true,
        usedAt: new Date()
      }
    });

    // Generate a temporary reset token for password reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store the reset token in the database
    await db.passwordReset.create({
      data: {
        userId: otpRecord.userId,
        token: resetToken,
        expiresAt,
      }
    });

    // Clean up expired OTPs for this user
    await db.whatsAppOTP.updateMany({
      where: {
        userId: otpRecord.userId,
        expiresAt: { lt: new Date() },
        used: false
      },
      data: { used: true }
    });

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken: resetToken,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('OTP verification error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
