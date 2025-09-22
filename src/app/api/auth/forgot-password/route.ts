import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { validateEmail } from '@/lib/security';
import { EmailService } from '@/lib/email-service';
import crypto from 'crypto';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = forgotPasswordSchema.parse(body);

    // Additional security validation
    if (!validateEmail(validatedData.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    // Always return success even if user doesn't exist (to prevent email enumeration)
    // But only send actual email if user exists
    if (user && user.status === 'ACTIVE') {
      try {
        // Generate a secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Store the reset token in the database
        await db.passwordReset.create({
          data: {
            userId: user.id,
            token: resetToken,
            expiresAt,
          }
        });

        // Send the password reset email
        const emailResult = await EmailService.sendPasswordResetEmail(
          user.email!,
          resetToken
        );

        if (!emailResult.success) {
          console.error('Failed to send password reset email:', emailResult.error);
          // Don't return error to user to prevent email enumeration
        } else {
          console.log(`Password reset email sent successfully to ${user.email}`);
        }

      } catch (emailError) {
        console.error('Error processing password reset:', emailError);
        // Don't return error to user to prevent email enumeration
      }
    }

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
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
