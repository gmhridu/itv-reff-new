import { NextRequest, NextResponse } from 'next/server';
import { SecureTokenManager } from '@/lib/token-manager';
import { addAPISecurityHeaders } from '@/lib/security-headers';
import { rateLimiter, RATE_LIMITS } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  let response = NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 });

  try {
    // Apply rate limiting
    const rateLimit = rateLimiter.checkRateLimit(request, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 10, // Allow more attempts for refresh
      blockDurationMs: 15 * 60 * 1000, // 15 minutes block
    });

    if (!rateLimit.allowed) {
      response = NextResponse.json(
        {
          success: false,
          error: 'Too many refresh attempts',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      );
      return addAPISecurityHeaders(response);
    }

    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refresh-token')?.value;

    if (!refreshToken) {
      response = NextResponse.json(
        { success: false, error: 'No refresh token provided' },
        { status: 401 }
      );
      return addAPISecurityHeaders(response);
    }

    // Generate new token pair
    const newTokens = SecureTokenManager.refreshTokens(refreshToken);

    if (!newTokens) {
      // Clear invalid refresh token
      response = NextResponse.json(
        { success: false, error: 'Invalid or expired refresh token' },
        { status: 401 }
      );

      response.cookies.delete('refresh-token');
      response.cookies.delete('access_token');

      return addAPISecurityHeaders(response);
    }

    // Success response
    response = NextResponse.json({
      success: true,
      message: 'Tokens refreshed successfully'
    });

    // Set new tokens in cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    // Set new access token (short-lived)
    response.cookies.set('access_token', newTokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 minutes
    });

    // Set new refresh token (longer-lived)
    response.cookies.set('refresh-token', newTokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return addAPISecurityHeaders(response);

  } catch (error) {
    console.error('Token refresh error:', error);

    response = NextResponse.json(
      { success: false, error: 'Token refresh failed' },
      { status: 500 }
    );

    return addAPISecurityHeaders(response);
  }
}
