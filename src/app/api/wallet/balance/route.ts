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

    // Get fresh user data
    const freshUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        walletBalance: true,
        totalEarnings: true,
      }
    });

    if (!freshUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      balance: freshUser.walletBalance,
      totalEarnings: freshUser.totalEarnings,
    });

  } catch (error) {
    console.error('Get wallet balance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
