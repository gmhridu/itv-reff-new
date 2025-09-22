import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = resetPasswordSchema.parse(body);

    // Find the password reset token
    const passwordReset = await db.passwordReset.findUnique({
      where: { token: validatedData.token },
      include: { user: true }
    });

    // Check if token exists and is valid
    if (!passwordReset) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (passwordReset.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      );
    }

    // Check if token has already been used
    if (passwordReset.used) {
      return NextResponse.json(
        { error: 'Reset token has already been used' },
        { status: 400 }
      );
    }

    // Check if user exists and is active
    if (!passwordReset.user || passwordReset.user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'User account is not active' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Update user's password
    await db.user.update({
      where: { id: passwordReset.userId },
      data: { password: hashedPassword }
    });

    // Mark the reset token as used
    await db.passwordReset.update({
      where: { id: passwordReset.id },
      data: {
        used: true,
        usedAt: new Date()
      }
    });

    // Clean up expired tokens for this user
    await db.passwordReset.updateMany({
      where: {
        userId: passwordReset.userId,
        expiresAt: { lt: new Date() },
        used: false
      },
      data: { used: true }
    });

    return NextResponse.json({
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);

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
