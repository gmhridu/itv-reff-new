import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { validateEmail } from '@/lib/security';

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
      // In a real implementation, you would:
      // 1. Generate a secure reset token
      // 2. Store it in the database with expiration
      // 3. Send an email with reset link
      
      // For now, we'll just simulate the email sending
      console.log(`Password reset requested for user: ${user.email}`);
      
      // TODO: Implement actual email sending
      // Example:
      // const resetToken = generateSecureToken();
      // const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      // 
      // await db.passwordReset.create({
      //   data: {
      //     userId: user.id,
      //     token: resetToken,
      //     expiresAt,
      //   }
      // });
      // 
      // await sendResetEmail(user.email, resetToken);
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