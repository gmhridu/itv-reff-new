import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SecureTokenManager } from '@/lib/token-manager';
import { rateLimiter, RATE_LIMITS } from '@/lib/rate-limiter';
import { addAPISecurityHeaders } from '@/lib/security-headers';
import { db } from '@/lib/db';
import { authenticateUser, checkAccountLockout, recordFailedLogin, resetFailedLogins } from '@/lib/api/auth';

const loginSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(1, 'Password is required').max(128),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {


  let response: NextResponse = NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });

  try {
    // Apply rate limiting
    const rateLimit = rateLimiter.checkRateLimit(request, RATE_LIMITS.LOGIN);
    if (!rateLimit.allowed) {
      response = NextResponse.json(
        {
          success: false,
          error: rateLimit.blocked
            ? 'Too many failed attempts. Account temporarily blocked.'
            : 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      );
      return addAPISecurityHeaders(response);
    }

    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Check account lockout
    const lockoutStatus = await checkAccountLockout(validatedData.phone);
    if (lockoutStatus.locked) {
      response = NextResponse.json(
        {
          success: false,
          error: 'Account is temporarily locked due to too many failed attempts',
          lockoutUntil: lockoutStatus.lockoutUntil
        },
        { status: 423 }
      );
      return addAPISecurityHeaders(response);
    }

    // Get client IP
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Authenticate user
    const user = await authenticateUser(validatedData.phone, validatedData.password);

    if (!user) {
      // Record failed login attempt
      await recordFailedLogin(validatedData.phone);

      response = NextResponse.json(
        {
          success: false,
          error: 'Invalid phone number or password',
          remainingAttempts: Math.max(0, 5 - (lockoutStatus.attempts + 1))
        },
        { status: 401 }
      );
      return addAPISecurityHeaders(response);
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      response = NextResponse.json(
        { success: false, error: 'Account is not active' },
        { status: 401 }
      );
      return addAPISecurityHeaders(response);
    }

    // Reset failed login attempts on successful login
    await resetFailedLogins(user.id);

    // Update last login IP
    await db.user.update({
      where: { id: user.id },
      data: { ipAddress },
    });

    // Generate secure token pair
    const tokens = SecureTokenManager.generateTokenPair(user.id, user.phone);

    // Record successful login
    rateLimiter.recordSuccess(request);

    // Create response with user data and tokens
    response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        referralCode: user.referralCode,
        walletBalance: user.walletBalance,
        totalEarnings: user.totalEarnings,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

    // Set secure cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    // Set access token (short-lived)
    response.cookies.set('access_token', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 minutes
    });

    // Set refresh token (longer-lived) - keep for API route usage
    response.cookies.set('refresh-token', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: validatedData.rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60, // 7 days or 1 day
    });

    return addAPISecurityHeaders(response);

  } catch (error) {
    console.error('Login error:', error);

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