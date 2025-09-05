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

const registerSchema = z.object({
  email: z.email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
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
    if (!validateEmail(validatedData.email)) {
      response = NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
      return addAPISecurityHeaders(response);
    }

    if (validatedData.phone && validatedData.phone.trim() && !validatePhone(validatedData.phone)) {
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
        email: validatedData.email,
        name: validatedData.name,
        phone: validatedData.phone,
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

        if (fields.includes('email')) {
          console.log('Returning 409 for duplicate email');
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

        if (fields.includes('phone')) {
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
    if (validatedData.referralCode) {
      const referralResult = await ReferralService.processReferralRegistration(
        validatedData.referralCode,
        user.id,
        ipAddress
      );

      if (referralResult.success) {
        referralReward = referralResult.rewardAmount || 0;
      }

      // Build referral hierarchy for the new user
      try {
        await EnhancedReferralService.buildReferralHierarchy(user.id);
        console.log(`✅ Referral hierarchy built for user: ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to build referral hierarchy for user ${user.email}:`, error);
        // Don't fail registration if hierarchy building fails
      }
    }

    // Generate tokens for automatic login
    const tokens = SecureTokenManager.generateTokenPair(user.id, user.email);

    // Return success response with user data and tokens
    response = NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
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
