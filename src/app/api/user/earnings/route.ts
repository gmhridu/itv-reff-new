import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { db } from "@/lib/db";
import { addAPISecurityHeaders } from "@/lib/security-headers";

export async function GET(request: NextRequest) {
  let response: NextResponse;

  try {
    const user = await authMiddleware(request);

    if (!user) {
      response = NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get yesterday's date range
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get start of current week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    // Get start of next week
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // Get start of current month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get start of next month
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Fetch all earning transactions for detailed breakdown
    const allTransactions = await db.walletTransaction.findMany({
      where: {
        userId: user.id,
        type: {
          in: [
            "TASK_INCOME",
            "REFERRAL_REWARD_A",
            "REFERRAL_REWARD_B",
            "REFERRAL_REWARD_C",
            "MANAGEMENT_BONUS_A",
            "MANAGEMENT_BONUS_B",
            "MANAGEMENT_BONUS_C",
            "TOPUP_BONUS",
            "SPECIAL_COMMISSION",
            "SECURITY_REFUND",
            "CREDIT",
          ] as any,
        },
        status: "COMPLETED",
      },
      orderBy: { createdAt: "desc" },
    });

    // Helper function to calculate earnings by type and period
    const calculateEarningsByType = (
      transactions: any[],
      startDate: Date,
      endDate: Date,
    ) => {
      const filteredTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate >= startDate && transactionDate < endDate;
      });

      return {
        dailyTaskCommission: filteredTransactions
          .filter((t) => t.type === "TASK_INCOME")
          .reduce((sum, t) => sum + t.amount, 0),

        referralInviteCommission: {
          level1: filteredTransactions
            .filter((t) => t.type === "REFERRAL_REWARD_A")
            .reduce((sum, t) => sum + t.amount, 0),
          level2: filteredTransactions
            .filter((t) => t.type === "REFERRAL_REWARD_B")
            .reduce((sum, t) => sum + t.amount, 0),
          level3: filteredTransactions
            .filter((t) => t.type === "REFERRAL_REWARD_C")
            .reduce((sum, t) => sum + t.amount, 0),
          total: filteredTransactions
            .filter((t) =>
              [
                "REFERRAL_REWARD_A",
                "REFERRAL_REWARD_B",
                "REFERRAL_REWARD_C",
              ].includes(t.type),
            )
            .reduce((sum, t) => sum + t.amount, 0),
        },

        referralTaskCommission: {
          level1: filteredTransactions
            .filter((t) => t.type === "MANAGEMENT_BONUS_A")
            .reduce((sum, t) => sum + t.amount, 0),
          level2: filteredTransactions
            .filter((t) => t.type === "MANAGEMENT_BONUS_B")
            .reduce((sum, t) => sum + t.amount, 0),
          level3: filteredTransactions
            .filter((t) => t.type === "MANAGEMENT_BONUS_C")
            .reduce((sum, t) => sum + t.amount, 0),
          total: filteredTransactions
            .filter((t) =>
              [
                "MANAGEMENT_BONUS_A",
                "MANAGEMENT_BONUS_B",
                "MANAGEMENT_BONUS_C",
              ].includes(t.type),
            )
            .reduce((sum, t) => sum + t.amount, 0),
        },

        topupBonus: filteredTransactions
          .filter(
            (t) =>
              (t.type as any) === "TOPUP_BONUS" ||
              (t.type === "CREDIT" &&
                t.description?.toLowerCase().includes("usdt") &&
                t.description?.toLowerCase().includes("bonus")),
          )
          .reduce((sum, t) => sum + t.amount, 0),

        specialCommission: filteredTransactions
          .filter(
            (t) =>
              (t.type as any) === "SPECIAL_COMMISSION" ||
              t.description?.toLowerCase().includes("special") ||
              t.description?.toLowerCase().includes("blessed"),
          )
          .reduce((sum, t) => sum + t.amount, 0),

        securityRefunds: filteredTransactions
          .filter((t) => (t.type as any) === "SECURITY_REFUND")
          .reduce((sum, t) => sum + t.amount, 0),

        totalEarning: filteredTransactions.reduce(
          (sum, t) => sum + t.amount,
          0,
        ),
      };
    };

    // Calculate earnings for different periods
    const todayEarnings = calculateEarningsByType(
      allTransactions,
      today,
      tomorrow,
    );
    const yesterdayEarnings = calculateEarningsByType(
      allTransactions,
      yesterday,
      today,
    );
    const weekEarnings = calculateEarningsByType(
      allTransactions,
      startOfWeek,
      endOfWeek,
    );
    const monthEarnings = calculateEarningsByType(
      allTransactions,
      startOfMonth,
      endOfMonth,
    );
    const allTimeEarnings = calculateEarningsByType(
      allTransactions,
      new Date("2020-01-01"),
      new Date(),
    );

    // Get security refund information
    let securityRefunds: any[] = [];
    let totalSecurityRefund = 0;

    try {
      securityRefunds = await (db as any).securityRefundRequest.findMany({
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
      // Include security refunds from wallet transactions as fallback
      totalSecurityRefund = allTimeEarnings.securityRefunds || 0;
    }

    // Calculate total amount available for withdrawal
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: { walletBalance: true, commissionBalance: true },
    });

    const totalAvailableForWithdrawal =
      (currentUser?.walletBalance || 0) +
      (currentUser?.commissionBalance || 0) +
      totalSecurityRefund;

    const earningsData = {
      success: true,
      data: {
        summary: {
          today: todayEarnings.totalEarning,
          yesterday: yesterdayEarnings.totalEarning,
          thisWeek: weekEarnings.totalEarning,
          thisMonth: monthEarnings.totalEarning,
          allTime: allTimeEarnings.totalEarning,
        },

        detailed: {
          today: todayEarnings,
          yesterday: yesterdayEarnings,
          thisWeek: weekEarnings,
          thisMonth: monthEarnings,
          allTime: allTimeEarnings,
        },

        breakdown: {
          dailyTaskCommission: allTimeEarnings.dailyTaskCommission,
          referralInviteCommission: allTimeEarnings.referralInviteCommission,
          referralTaskCommission: allTimeEarnings.referralTaskCommission,
          topupBonus: allTimeEarnings.topupBonus,
          specialCommission: allTimeEarnings.specialCommission,
          securityRefunds: allTimeEarnings.securityRefunds || 0,
          totalEarning: allTimeEarnings.totalEarning,
        },

        security: {
          totalRefunds: totalSecurityRefund,
          refundHistory: securityRefunds,
        },

        wallet: {
          mainWallet: currentUser?.walletBalance || 0,
          commissionWallet: currentUser?.commissionBalance || 0,
          totalAvailableForWithdrawal,
        },

        recentTransactions: allTransactions.slice(0, 20).map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          createdAt: t.createdAt,
          status: t.status,
        })),
      },
    };

    response = NextResponse.json(earningsData);
    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Get earnings data error:", error);
    response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
