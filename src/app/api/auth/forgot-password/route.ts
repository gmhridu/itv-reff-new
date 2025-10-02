import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { WhatsAppOTPService } from '@/lib/whatsapp-otp-service';

const forgotPasswordSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Forgot password API called');
    const body = await request.json();
    console.log('🔍 DEBUG: Request body:', body);

    // Validate input
    const validatedData = forgotPasswordSchema.parse(body);
    console.log('🔍 DEBUG: Validated phone number:', validatedData.phone);

    // Validate phone number format
    if (!WhatsAppOTPService.validatePhoneNumber(validatedData.phone)) {
      console.error('❌ DEBUG: Phone number validation failed');
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }
    console.log('🔍 DEBUG: Phone number format is valid');

    // Check if user exists
    console.log('🔍 DEBUG: Checking if user exists with phone:', validatedData.phone);
    const user = await db.user.findUnique({
      where: { phone: validatedData.phone },
    });
    console.log('🔍 DEBUG: User found:', user ? 'YES' : 'NO');
    if (user) {
      console.log('🔍 DEBUG: User status:', user.status);
      console.log('🔍 DEBUG: User ID:', user.id);
    }

    // Always return success even if user doesn't exist (to prevent phone enumeration)
    // But only send actual OTP if user exists
    if (user && user.status === 'ACTIVE') {
      try {
        // Check rate limiting
        const rateLimitCheck = WhatsAppOTPService.checkRateLimit(validatedData.phone);
        if (!rateLimitCheck.allowed) {
          const remainingTime = rateLimitCheck.remainingTime || 60;
          return NextResponse.json(
            {
              error: `Too many OTP requests. Please try again in ${remainingTime} seconds.`,
              retryAfter: remainingTime
            },
            { status: 429 }
          );
        }

        // Send OTP via WhatsApp
        const otpResult = await WhatsAppOTPService.sendPasswordResetOTP(validatedData.phone);

        if (otpResult.success && otpResult.otp) {
          // Store OTP in database for verification
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

          await db.whatsAppOTP.create({
            data: {
              userId: user.id,
              phone: validatedData.phone,
              otp: otpResult.otp,
              expiresAt,
            }
          });

          console.log(`Password reset OTP sent successfully to ${validatedData.phone}`);

          // In development, log the OTP for testing
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔐 DEVELOPMENT OTP for ${validatedData.phone}: ${otpResult.otp}`);
          }
        } else {
          console.error('Failed to send WhatsApp OTP:', otpResult.error);
          // Don't return error to user to prevent phone enumeration
        }

      } catch (otpError) {
        console.error('Error processing password reset OTP:', otpError);
        // Don't return error to user to prevent phone enumeration
      }
    }

    return NextResponse.json({
      message: 'If an account exists with this phone number, a password reset code has been sent via WhatsApp.',
    });

  } catch (error) {
    console.error('Forgot password error:', error);

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
