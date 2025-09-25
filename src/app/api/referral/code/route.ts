import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/api/api-auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's referral code and stats
    const freshUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        referralCode: true,
      }
    });

    if (!freshUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate referral link with register path
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icl.finance';
    const referralLink = `${baseUrl}/register?ref=${freshUser.referralCode}`;

    return NextResponse.json({
      referralCode: freshUser.referralCode,
      referralLink,
    });

  } catch (error) {
    console.error('Get referral code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
