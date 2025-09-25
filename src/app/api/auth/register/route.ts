import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateRegistrationRequest } from '@/lib/api/api-auth';
import { getClientIP, generateDeviceFingerprint, validateEmail, validatePhone } from '@/lib/security';
import { ReferralService } from '@/lib/referral-service';
import { EnhancedReferralService } from '@/lib/enhanced-referral-service';
import { addAPISecurityHeaders } from '@/lib/security-headers';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { SecureTokenManager } from '@/lib/token-manager';
import { createUser } from '@/lib/api/auth';
import { db } from '@/lib/db';

// Store CAPTCHA codes in memory (in production, use Redis or similar)
const captchaStore = new Map<string, { code: string; expiresAt: number }>();

// Generate a CAPTCHA code and store it
function generateAndStoreCaptcha(request: NextRequest): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const clientId = getClientIP(request) + request.headers.get('user-agent');
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  captchaStore.set(clientId, { code: result, expiresAt });

  // Clean up expired entries periodically
  if (Math.random() < 0.1) { // 10% chance to clean up
    const now = Date.now();
    for (const [key, value] of captchaStore.entries()) {
      if (value.expiresAt < now) {
        captchaStore.delete(key);
      }
    }
  }

  return result;
}

// Verify CAPTCHA code
function verifyCaptcha(request: NextRequest, code: string): boolean {
  const clientId = getClientIP(request) + request.headers.get('user-agent');
  const captchaData = captchaStore.get(clientId);

  if (!captchaData) {
    return false;
  }

  // Check if expired
  if (Date.now() > captchaData.expiresAt) {
    captchaStore.delete(clientId);
    return false;
  }

  // Check if code matches
  const isValid = captchaData.code === code.toUpperCase();

  // Remove the used CAPTCHA
  captchaStore.delete(clientId);

  return isValid;
}

const registerSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  referralCode: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  let response: NextResponse = NextResponse.json({ error: 'Registration failed' }, { status: 500 });

  try {
    // Security validation
    const securityValidation = await validateRegistrationRequest(request);
    if (!securityValidation.valid) {
      return addAPISecurityHeaders(securityValidation.response!);
    }

    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    // Additional security validation
    if (validatedData.email && validatedData.email.trim() && !validateEmail(validatedData.email)) {
      response = NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
      return addAPISecurityHeaders(response);
    }

    if (!validatePhone(validatedData.phone)) {
      response = NextResponse.json(
        {
          success: false,
          error: 'Invalid phone number format',
          field: 'phone'
        },
        { status: 400 }
      );
      return addAPISecurityHeaders(response);
    }

    // Get client IP and device info for security tracking
    const ipAddress = getClientIP(request);
    const deviceFingerprint = generateDeviceFingerprint(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create user with security information
    let user;
    try {
      user = await createUser({
        phone: validatedData.phone,
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
        referralCode: validatedData.referralCode,
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object') {
        console.log('Caught error in createUser try-catch:', (err as any).constructor?.name, (err as any).code);
        console.log('Error meta:', (err as any).meta);
      } else {
        console.log('Caught error in createUser try-catch:', err);
      }

      // Handle Prisma unique constraint violations from createUser
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
        console.log('✅ INSIDE P2002 HANDLER');
        console.log('Handling P2002 error, meta:', err.meta);
        const fields = (err.meta?.target as string[]) || [];
        console.log('Extracted fields:', fields);

        if (fields.includes('phone')) {
          console.log('Returning 409 for duplicate phone');
          response = NextResponse.json(
            {
              success: false,
              error: 'An account with this phone number already exists. Please use a different phone number or try logging in.',
              field: 'phone'
            },
            { status: 409 }
          );
          return addAPISecurityHeaders(response);
        }

        if (fields.includes('email')) {
          response = NextResponse.json(
            {
              success: false,
              error: 'An account with this email address already exists. Please use a different email or try logging in.',
              field: 'email'
            },
            { status: 409 }
          );
          return addAPISecurityHeaders(response);
        }

        // Generic unique constraint error
        response = NextResponse.json(
          {
            success: false,
            error: 'An account with this information already exists. Please check your details and try again.',
            fields: fields
          },
          { status: 409 }
        );
        return addAPISecurityHeaders(response);
      }

      // Re-throw other errors to be handled by outer catch
      console.log('Re-throwing error:', err && typeof err === 'object' && 'name' in err ? (err as any).name : typeof err);
      throw err;
    }

    if (!user) {
      response = NextResponse.json(
        {
          success: false,
          error: 'Failed to create user account. Please try again.'
        },
        { status: 500 }
      );
      return addAPISecurityHeaders(response);
    }

    // Process referral if provided
    let referralReward = 0;
    let referrerId: string | null = null;
    if (validatedData.referralCode) {
      const referralResult = await ReferralService.processReferralRegistration(
        validatedData.referralCode,
        user.id,
        ipAddress
      );

      if (referralResult.success) {
        referralReward = referralResult.rewardAmount || 0;
      }

      // Get the referrer ID for hierarchy building
      const referrer = await db.user.findUnique({
        where: { referralCode: validatedData.referralCode },
        select: { id: true }
      });
      referrerId = referrer?.id || null;

      // Build referral hierarchy for the new user
      try {
        if (referrerId) {
          await ReferralService.buildReferralHierarchy(user.id, referrerId);
          console.log(`✅ Referral hierarchy built for user: ${user.phone}`);
        }
      } catch (error) {
        console.error(`❌ Failed to build referral hierarchy for user ${user.phone}:`, error);
        // Don't fail registration if hierarchy building fails
      }
    }

    // Generate tokens for automatic login
    const tokens = SecureTokenManager.generateTokenPair(user.id, user.phone);

    // Return success response with user data and tokens
    response = NextResponse.json({
      success: true,
      message: 'User created successfully',
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
      referral: validatedData.referralCode ? {
        applied: true,
        rewardAmount: referralReward
      } : null
    });

    // Set secure cookies for automatic login
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

    // Set refresh token (longer-lived)
    response.cookies.set('refresh-token', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return addAPISecurityHeaders(response);

  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      response = NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
      return addAPISecurityHeaders(response);
    }

    // Prisma errors are now handled in the inner try-catch block
    // This catch block handles other types of errors

    response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addAPISecurityHeaders(response);
  }
}

// Add a GET endpoint to generate CAPTCHA codes
export async function GET(request: NextRequest) {
  const captchaCode = generateAndStoreCaptcha(request);

  // Return the CAPTCHA code (in a real implementation, you might return an image)
  return NextResponse.json({ captcha: captchaCode });
}
