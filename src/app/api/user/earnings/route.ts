import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addAPISecurityHeaders } from "@/lib/security-headers";
import { authMiddleware } from "@/lib/api/api-auth";

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

    // Fetch ONLY the transactions for the 5 specified earning types:
    // 1. Daily Task Commission (TASK_INCOME)
    // 2. Referral Invite Commission (REFERRAL_REWARD_A, REFERRAL_REWARD_B, REFERRAL_REWARD_C)
    // 3. Referral Task Commission (MANAGEMENT_BONUS_A, MANAGEMENT_BONUS_B, MANAGEMENT_BONUS_C)
    // 4. USDT Top-up Bonus (TOPUP_BONUS)
    // 5. Special Commission (SPECIAL_COMMISSION)
    const allEarningTransactions = await db.walletTransaction.findMany({
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
        // 1. Daily Task Commission
        dailyTaskCommission: filteredTransactions
          .filter((t) => t.type === "TASK_INCOME")
          .reduce((sum, t) => sum + t.amount, 0),

        // 2. Referral Invite Commission (Multi-level: 10% → 3% → 1%)
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

        // 3. Referral Task Commission (Multi-level: 8% → 3% → 1%)
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

        // 4. USDT Top-up Bonus (3%)
        topupBonus: filteredTransactions
          .filter((t) => t.type === "TOPUP_BONUS")
          .reduce((sum, t) => sum + t.amount, 0),

        // 5. Special Commission
        specialCommission: filteredTransactions
          .filter((t) => t.type === "SPECIAL_COMMISSION")
          .reduce((sum, t) => sum + t.amount, 0),

        // Total Earnings = ONLY sum of the 5 categories above (NO security refunds)
        totalEarning: filteredTransactions.reduce(
          (sum, t) => sum + t.amount,
          0,
        ),
      };
    };

    // Calculate earnings for different periods
    const todayEarnings = calculateEarningsByType(
      allEarningTransactions,
      today,
      tomorrow,
    );
    const yesterdayEarnings = calculateEarningsByType(
      allEarningTransactions,
      yesterday,
      today,
    );
    const weekEarnings = calculateEarningsByType(
      allEarningTransactions,
      startOfWeek,
      endOfWeek,
    );
    const monthEarnings = calculateEarningsByType(
      allEarningTransactions,
      startOfMonth,
      endOfMonth,
    );
    const allTimeEarnings = calculateEarningsByType(
      allEarningTransactions,
      new Date("2020-01-01"),
      new Date(),
    );

    // Calculate previous periods for trending comparison
    const previousDay = new Date(yesterday);
    previousDay.setDate(previousDay.getDate() - 1);
    
    const previousWeekStart = new Date(startOfWeek);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    
    const previousMonthStart = new Date(startOfMonth);
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
    const previousMonthEnd = new Date(startOfMonth);

    // Calculate earnings for previous periods
    const previousDayEarnings = calculateEarningsByType(
      allEarningTransactions,
      previousDay,
      yesterday,
    );
    const previousWeekEarnings = calculateEarningsByType(
      allEarningTransactions,
      previousWeekStart,
      startOfWeek,
    );
    const previousMonthEarnings = calculateEarningsByType(
      allEarningTransactions,
      previousMonthStart,
      previousMonthEnd,
    );

    // Calculate trending status
    const calculateTrend = (current: number, previous: number) => {
      if (current > previous) return 'up';
      if (current < previous) return 'down';
      return 'same';
    };

    const trendingData = {
      today: calculateTrend(todayEarnings.totalEarning, previousDayEarnings.totalEarning),
      yesterday: calculateTrend(yesterdayEarnings.totalEarning, previousDayEarnings.totalEarning),
      thisWeek: calculateTrend(weekEarnings.totalEarning, previousWeekEarnings.totalEarning),
      thisMonth: calculateTrend(monthEarnings.totalEarning, previousMonthEarnings.totalEarning),
    };

    // Get current user wallet information
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        walletBalance: true, // Current Balance (topup balance)
        commissionBalance: true, // Commission wallet
        depositPaid: true, // Security Deposited
        securityRefund: true, // Security refund amount available for withdrawal
      },
    });

    // Get security refund information from user table (accumulated approved refunds)
    const userSecurityRefund = currentUser?.securityRefund || 0;

    // According to requirements:
    // Total Available for Withdrawal = Total Earnings (5 types) + Security Refund
    // (NOT including Current Balance/Security Deposited)
    const totalAvailableForWithdrawal = allTimeEarnings.totalEarning + userSecurityRefund;

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
        trending: trendingData,
        detailed: {
          today: todayEarnings,
          yesterday: yesterdayEarnings,
          thisWeek: weekEarnings,
          thisMonth: monthEarnings,
          allTime: allTimeEarnings,
        },
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
