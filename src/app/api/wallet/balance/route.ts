import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get fresh user data
    const freshUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        walletBalance: true, // Current Balance (topup balance only)
        totalEarnings: true, // Legacy field - will calculate fresh
        commissionBalance: true, // Commission wallet
        depositPaid: true, // Security Deposited
      },
    });

    if (!freshUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate ONLY the 5 specified earning types for Total Earnings
    const earningTransactions = await db.walletTransaction.findMany({
      where: {
        userId: user.id,
        type: {
          in: [
            "TASK_INCOME", // 1. Daily Task Commission
            "REFERRAL_REWARD_A", // 2. Referral Invite Commission - Level A (10%)
            "REFERRAL_REWARD_B", // 2. Referral Invite Commission - Level B (3%)
            "REFERRAL_REWARD_C", // 2. Referral Invite Commission - Level C (1%)
            "MANAGEMENT_BONUS_A", // 3. Referral Task Commission - Level A (8%)
            "MANAGEMENT_BONUS_B", // 3. Referral Task Commission - Level B (3%)
            "MANAGEMENT_BONUS_C", // 3. Referral Task Commission - Level C (1%)
            "TOPUP_BONUS", // 4. USDT Top-up Bonus (3%)
            "SPECIAL_COMMISSION", // 5. Special Commission
          ] as any,
        },
        status: "COMPLETED",
      },
    });

    // Calculate actual total earnings from transactions
    const actualTotalEarnings = earningTransactions.reduce(
      (sum, t) => sum + t.amount,
      0,
    );

    // Get security refunds (separate from earnings)
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

    // According to requirements:
    // - Current Balance = Only topup balance (NOT part of Total Earnings or Total Available for Withdrawal)
    // - Security Deposited = Level deposit amounts (NOT part of Total Earnings or Total Available for Withdrawal)
    // - Total Earnings = ONLY the 5 specified commission types
    // - Total Available for Withdrawal = ONLY Total Earnings (5 types) - NO Security Refunds

    return NextResponse.json({
      currentBalance: freshUser.walletBalance || 0, // Only topup balance after admin approval
      securityDeposited: freshUser.depositPaid || 0, // Level subscription deposit amounts
      commissionBalance: actualTotalEarnings, // Commission earnings (matches Total Earnings)
      totalEarnings: actualTotalEarnings, // Only the 5 specified earning types
      securityRefund: totalSecurityRefund, // Approved security refunds (separate from earnings)
      grandTotal: actualTotalEarnings, // Total Available for Withdrawal (ONLY Total Earnings)
    });
  } catch (error) {
    console.error("Get wallet balance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
