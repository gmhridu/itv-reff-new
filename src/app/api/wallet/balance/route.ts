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
        commissionBalance: true,
        depositPaid: true,
      }
    });

    if (!freshUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get security refunds for grand total calculation
    let totalSecurityRefund = 0;
    try {
      const securityRefunds = await db.securityRefundRequest.findMany({
        where: {
          userId: user.id,
          status: "APPROVED",
        },
      });

      totalSecurityRefund = securityRefunds.reduce(
        (sum: number, refund: any) => sum + refund.refundAmount,
        0,
      );
    } catch (error) {
      console.warn("Security refund table not available yet:", error);
    }

    // Calculate grand total according to rules: Total Earnings + Security Refund
    const grandTotal = (freshUser.totalEarnings || 0) + totalSecurityRefund;

    return NextResponse.json({
      currentBalance: freshUser.walletBalance, // Only top-ups after admin approval
      securityDeposited: freshUser.depositPaid, // Plan subscription amounts
      commissionBalance: freshUser.commissionBalance, // Daily task commissions
      totalEarnings: freshUser.totalEarnings, // Only the 5 specified earning types
      securityRefund: totalSecurityRefund, // Approved security refunds
      grandTotal, // Total Earnings + Security Refund
    });

  } catch (error) {
    console.error('Get wallet balance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
