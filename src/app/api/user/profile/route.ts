import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/api/api-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        referralCode: user.referralCode,
        status: user.status,
        walletBalance: user.walletBalance,
        totalEarnings: user.totalEarnings,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
