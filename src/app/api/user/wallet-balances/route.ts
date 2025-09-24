import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { db, withRetry, checkDatabaseConnection } from "@/lib/db";
import { addAPISecurityHeaders } from "@/lib/security-headers";

export async function GET(request: NextRequest) {
  let response: NextResponse;

  try {
    // Check database connection first
    const dbHealth = await checkDatabaseConnection();
    if (!dbHealth.healthy) {
      console.error("Database health check failed:", dbHealth.error);
      response = NextResponse.json(
        {
          error:
            "Database temporarily unavailable. Please try again in a few moments.",
          code: "DB_CONNECTION_ERROR",
        },
        { status: 503 },
      );
      return addAPISecurityHeaders(response);
    }

    // Authenticate the user
    const user = await authMiddleware(request);
    if (!user) {
      response = NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get fresh user data with retry logic
    const freshUser = await withRetry(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          walletBalance: true, // Current Balance (topup balance only)
          commissionBalance: true, // Commission wallet (legacy field)
          depositPaid: true, // Security Deposited
        },
      });
    });

    if (!freshUser) {
      response = NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
      return addAPISecurityHeaders(response);
    }

    // Calculate ONLY the 5 specified earning types for Total Earnings with retry logic
    const earningTransactions = await withRetry(async (prisma) => {
      return await prisma.walletTransaction.aggregate({
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
        _sum: {
          amount: true,
        },
      });
    });

    // Calculate actual total earnings from transactions (ONLY the 5 earning types)
    const actualTotalEarnings = earningTransactions._sum.amount || 0;

    // Get security refunds (separate from earnings) with retry logic
    let totalSecurityRefund = 0;
    try {
      const securityRefunds = await withRetry(async (prisma) => {
        return await prisma.securityRefundRequest.aggregate({
          where: {
            userId: user.id,
            status: "APPROVED",
          },
          _sum: {
            refundAmount: true,
          },
        });
      });

      totalSecurityRefund = securityRefunds._sum.refundAmount || 0;
    } catch (error: any) {
      console.warn("Security refund table not available yet:", error.message);
      // Don't fail the entire request if security refunds aren't available
      totalSecurityRefund = 0;
    }

    // According to user-overview.tsx requirements:
    // - Current Balance (mainWallet) = Only topup balance (NOT part of Total Available for Withdrawal)
    // - Commission Wallet = Total Earnings (the 5 earning types)
    // - Security Deposited = Level deposit amounts (NOT part of Total Available for Withdrawal)
    // - Total Available for Withdrawal = ONLY Total Earnings (5 types) - Security Refund is NOT included

    const totalAvailableForWithdrawal = actualTotalEarnings; // Only Total Earnings (5 commission types)

    response = NextResponse.json({
      success: true,
      walletBalances: {
        // These are the current fields that the withdrawal component expects
        mainWallet: freshUser.walletBalance || 0, // Current Balance (topup balance only) - NOT part of withdrawal
        commissionWallet: actualTotalEarnings, // Total Earnings from the 5 commission types
        totalEarnings: actualTotalEarnings, // Same as commissionWallet for consistency

        // Additional fields for clarity and future use
        securityDeposited: freshUser.depositPaid || 0, // Security deposits (NOT part of withdrawal)
        securityRefund: totalSecurityRefund, // Security refunds (NOT part of withdrawal)
        totalAvailableForWithdrawal: totalAvailableForWithdrawal, // ONLY Total Earnings (5 commission types)
      },

      // Additional metadata
      metadata: {
        calculation: {
          totalEarnings: actualTotalEarnings,
          securityRefund: totalSecurityRefund,
          totalAvailableForWithdrawal: totalAvailableForWithdrawal,
        },
        note: "Total Available for Withdrawal = ONLY Total Earnings (5 types). Security Refund, Current Balance and Security Deposited are NOT included.",
      },
    });

    return addAPISecurityHeaders(response);
  } catch (error: any) {
    console.error("Get wallet balances error:", error);

    // Handle specific database connection errors
    if (
      error.message?.includes("Database connection failed") ||
      error.message?.includes("Can't reach database server")
    ) {
      response = NextResponse.json(
        {
          error:
            "Database temporarily unavailable. Please try again in a few moments.",
          code: "DB_CONNECTION_ERROR",
        },
        { status: 503 },
      );
      return addAPISecurityHeaders(response);
    }

    response = NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
