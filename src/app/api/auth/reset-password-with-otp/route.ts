import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { OTPManagementService } from '@/lib/otp-management-service';

const resetPasswordWithOTPSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Also accept the alternative format for direct password reset
const directResetPasswordSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Reset password with OTP API called');
    const body = await request.json();
    console.log('🔍 DEBUG: Request body:', JSON.stringify(body, null, 2));

    // Validate input
    const validatedData = resetPasswordWithOTPSchema.parse(body);
    console.log('🔍 DEBUG: Validated data:', validatedData);

    // Validate password strength
    const passwordValidation = validatePasswordStrength(validatedData.newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet security requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    console.log('🔍 DEBUG: Looking for OTP record...');
    console.log('🔍 DEBUG: Phone:', validatedData.phone);
    console.log('🔍 DEBUG: OTP:', validatedData.otp);

    // First, let's check if any OTP records exist for this phone
    const allOtpRecords = await db.whatsAppOTP.findMany({
      where: {
        phone: validatedData.phone,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log('🔍 DEBUG: All OTP records for this phone:', allOtpRecords);

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

    console.log('🔍 DEBUG: OTP record found:', otpRecord ? 'YES' : 'NO');
    if (otpRecord) {
      console.log('🔍 DEBUG: OTP record details:', {
        id: otpRecord.id,
        userId: otpRecord.userId,
        phone: otpRecord.phone,
        otp: otpRecord.otp,
        expiresAt: otpRecord.expiresAt,
        used: otpRecord.used,
        attempts: otpRecord.attempts
      });
    }

    // Check if OTP exists and is valid
    if (!otpRecord) {
      console.error('❌ DEBUG: No valid OTP record found');
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

    // Validate OTP attempts
    const attemptValidation = await OTPManagementService.validateOTPAttempts(otpRecord.id);
    if (!attemptValidation.valid) {
      return NextResponse.json(
        { error: 'OTP code has been used too many times' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 12);

    // Update user's password
    await db.user.update({
      where: { id: otpRecord.userId },
      data: { password: hashedPassword }
    });

    // Mark the OTP as used
    await db.whatsAppOTP.update({
      where: { id: otpRecord.id },
      data: {
        used: true,
        usedAt: new Date()
      }
    });

    // Increment attempts to prevent reuse
    await OTPManagementService.incrementOTPAttempts(otpRecord.id);

    // Clean up expired tokens for this user
    await OTPManagementService.cleanupUserPasswordResets(otpRecord.userId);

    // Clean up expired OTPs for this user
    await OTPManagementService.cleanupUserOTPs(otpRecord.userId);

    return NextResponse.json({
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password with OTP error:', error);

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

// Password strength validation function
function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
