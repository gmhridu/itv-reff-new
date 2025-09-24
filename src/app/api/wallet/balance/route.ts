import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { db, withRetry, checkDatabaseConnection } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Check database connection first
    const dbHealth = await checkDatabaseConnection();
    if (!dbHealth.healthy) {
      console.error("Database health check failed:", dbHealth.error);
      return NextResponse.json(
        {
          error:
            "Database temporarily unavailable. Please try again in a few moments.",
          code: "DB_CONNECTION_ERROR",
        },
        { status: 503 },
      );
    }

    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get fresh user data with retry logic
    const freshUser = await withRetry(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          walletBalance: true, // Current Balance (topup balance only)
          commissionBalance: true, // Commission wallet
          depositPaid: true, // Security Deposited
        },
      });
    });

    if (!freshUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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

    // Get breakdown of each earning type with retry logic
    const [
      dailyTaskCommission,
      referralInviteCommission,
      referralTaskCommission,
      usdtTopupBonus,
      specialCommission,
    ] = await Promise.all([
      // 1. Daily Task Commission
      withRetry(async (prisma) => {
        return await prisma.walletTransaction.aggregate({
          where: {
            userId: user.id,
            type: "TASK_INCOME",
            status: "COMPLETED",
          },
          _sum: { amount: true },
        });
      }),

      // 2. Referral Invite Commission (Multi-level)
      withRetry(async (prisma) => {
        return await prisma.walletTransaction.aggregate({
          where: {
            userId: user.id,
            type: {
              in: [
                "REFERRAL_REWARD_A",
                "REFERRAL_REWARD_B",
                "REFERRAL_REWARD_C",
              ],
            },
            status: "COMPLETED",
          },
          _sum: { amount: true },
        });
      }),

      // 3. Referral Task Commission (Multi-level)
      withRetry(async (prisma) => {
        return await prisma.walletTransaction.aggregate({
          where: {
            userId: user.id,
            type: {
              in: [
                "MANAGEMENT_BONUS_A",
                "MANAGEMENT_BONUS_B",
                "MANAGEMENT_BONUS_C",
              ],
            },
            status: "COMPLETED",
          },
          _sum: { amount: true },
        });
      }),

      // 4. USDT Top-up Bonus
      withRetry(async (prisma) => {
        return await prisma.walletTransaction.aggregate({
          where: {
            userId: user.id,
            type: "TOPUP_BONUS",
            status: "COMPLETED",
          },
          _sum: { amount: true },
        });
      }),

      // 5. Special Commission
      withRetry(async (prisma) => {
        return await prisma.walletTransaction.aggregate({
          where: {
            userId: user.id,
            type: "SPECIAL_COMMISSION",
            status: "COMPLETED",
          },
          _sum: { amount: true },
        });
      }),
    ]);

    // Calculate actual total earnings from transactions
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

    // According to requirements:
    // - Current Balance = Only topup balance (NOT part of Total Earnings or Total Available for Withdrawal)
    // - Security Deposited = Level deposit amounts (NOT part of Total Earnings or Total Available for Withdrawal)
    // - Total Earnings = ONLY the 5 specified commission types
    // - Total Available for Withdrawal = Total Earnings + Security Refund

    return NextResponse.json({
      // Wallet balances
      currentBalance: freshUser.walletBalance || 0, // Only topup balance after admin approval
      securityDeposited: freshUser.depositPaid || 0, // Level subscription deposit amounts
      commissionBalance: actualTotalEarnings, // Commission earnings (matches Total Earnings)
      securityRefund: totalSecurityRefund, // Approved security refunds (separate from earnings)

      // Total calculations
      totalEarnings: actualTotalEarnings, // Only the 5 specified earning types
      totalAvailableForWithdrawal: actualTotalEarnings, // Only Total Earnings (5 commission types)

      // Detailed breakdown of Total Earnings (5 types only)
      earningsBreakdown: {
        dailyTaskCommission: dailyTaskCommission._sum.amount || 0,
        referralInviteCommission: referralInviteCommission._sum.amount || 0,
        referralTaskCommission: referralTaskCommission._sum.amount || 0,
        usdtTopupBonus: usdtTopupBonus._sum.amount || 0,
        specialCommission: specialCommission._sum.amount || 0,
      },

      // Legacy field for backward compatibility
      grandTotal: actualTotalEarnings + totalSecurityRefund, // Same as totalAvailableForWithdrawal
    });
  } catch (error: any) {
    console.error("Get wallet balance error:", error);

    // Handle specific database connection errors
    if (
      error.message?.includes("Database connection failed") ||
      error.message?.includes("Can't reach database server")
    ) {
      return NextResponse.json(
        {
          error:
            "Database temporarily unavailable. Please try again in a few moments.",
          code: "DB_CONNECTION_ERROR",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
