import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { addAPISecurityHeaders } from "@/lib/security-headers";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  let response: NextResponse;

  try {
    // Authenticate user
    const user = await authMiddleware(request);
    if (!user || !user.id) {
      response = NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "30"; // days
    const periodDays = parseInt(period);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get referral activity analytics
    const referralActivities = await db.referralActivity.findMany({
      where: {
        referrerId: user.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate conversion funnel
    const conversionFunnel = {
      clicks: referralActivities.length,
      registrations: referralActivities.filter(
        (a) =>
          a.status === "REGISTERED" ||
          a.status === "QUALIFIED" ||
          a.status === "REWARDED",
      ).length,
      qualifications: referralActivities.filter(
        (a) => a.status === "QUALIFIED" || a.status === "REWARDED",
      ).length,
      rewards: referralActivities.filter((a) => a.status === "REWARDED").length,
    };

    // Calculate conversion rates
    const conversionRates = {
      clickToRegistration:
        conversionFunnel.clicks > 0
          ? (conversionFunnel.registrations / conversionFunnel.clicks) * 100
          : 0,
      registrationToQualification:
        conversionFunnel.registrations > 0
          ? (conversionFunnel.qualifications / conversionFunnel.registrations) *
            100
          : 0,
      qualificationToReward:
        conversionFunnel.qualifications > 0
          ? (conversionFunnel.rewards / conversionFunnel.qualifications) * 100
          : 0,
      overallConversion:
        conversionFunnel.clicks > 0
          ? (conversionFunnel.rewards / conversionFunnel.clicks) * 100
          : 0,
    };

    // Get daily analytics for the period
    const dailyAnalytics: Array<{
      date: string;
      clicks: number;
      registrations: number;
      earnings: number;
    }> = [];

    for (let i = 0; i < periodDays; i++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(startDate.getDate() + i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayActivities = referralActivities.filter((a) => {
        const activityDate = new Date(a.createdAt);
        return activityDate >= dayStart && activityDate <= dayEnd;
      });

      // Get earnings for this day
      const dayEarnings = await db.walletTransaction.aggregate({
        where: {
          userId: user.id,
          type: {
            in: ["REFERRAL_REWARD_A", "REFERRAL_REWARD_B", "REFERRAL_REWARD_C"],
          },
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        _sum: { amount: true },
      });

      const dayManagementBonuses = await db.taskManagementBonus.aggregate({
        where: {
          userId: user.id,
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        _sum: { bonusAmount: true },
      });

      dailyAnalytics.push({
        date: dayStart.toISOString().split("T")[0],
        clicks: dayActivities.length,
        registrations: dayActivities.filter(
          (a) =>
            a.status === "REGISTERED" ||
            a.status === "QUALIFIED" ||
            a.status === "REWARDED",
        ).length,
        earnings:
          (dayEarnings._sum.amount || 0) +
          (dayManagementBonuses._sum.bonusAmount || 0),
      });
    }

    // Get traffic source analytics
    const trafficSources = referralActivities.reduce(
      (acc, activity) => {
        const source = activity.source || "direct";
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get team growth analytics
    const teamGrowth = await db.referralHierarchy.findMany({
      where: {
        referrerId: user.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        level: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group team growth by level and week
    const weeklyGrowth: Array<{
      week: string;
      startDate: string;
      aLevel: number;
      bLevel: number;
      cLevel: number;
      total: number;
    }> = [];
    const weekCount = Math.ceil(periodDays / 7);

    for (let i = 0; i < weekCount; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekGrowth = teamGrowth.filter((g) => {
        const growthDate = new Date(g.createdAt);
        return growthDate >= weekStart && growthDate <= weekEnd;
      });

      weeklyGrowth.push({
        week: `Week ${i + 1}`,
        startDate: weekStart.toISOString().split("T")[0],
        aLevel: weekGrowth.filter((g) => g.level === "A_LEVEL").length,
        bLevel: weekGrowth.filter((g) => g.level === "B_LEVEL").length,
        cLevel: weekGrowth.filter((g) => g.level === "C_LEVEL").length,
        total: weekGrowth.length,
      });
    }

    // Calculate performance metrics
    const bestDay =
      dailyAnalytics.length > 0
        ? dailyAnalytics.reduce((best, current) =>
            current.earnings > best.earnings ? current : best,
          )
        : { date: "", earnings: 0 };

    const performanceMetrics = {
      averageDailyClicks:
        dailyAnalytics.reduce((sum, day) => sum + day.clicks, 0) / periodDays,
      averageDailyRegistrations:
        dailyAnalytics.reduce((sum, day) => sum + day.registrations, 0) /
        periodDays,
      averageDailyEarnings:
        dailyAnalytics.reduce((sum, day) => sum + day.earnings, 0) / periodDays,
      bestPerformingDay: bestDay,
      totalPeriodEarnings: dailyAnalytics.reduce(
        (sum, day) => sum + day.earnings,
        0,
      ),
    };

    // Get leaderboard position (compare with other users)
    const userRanking = await db.user.findMany({
      select: {
        id: true,
        name: true,
        totalEarnings: true,
      },
      orderBy: { totalEarnings: "desc" },
      take: 100,
    });

    const userPosition = userRanking.findIndex((u) => u.id === user.id) + 1;
    const topPerformers = userRanking.slice(0, 10);

    response = NextResponse.json({
      success: true,
      data: {
        conversionFunnel,
        conversionRates,
        dailyAnalytics,
        weeklyGrowth,
        trafficSources,
        performanceMetrics,
        leaderboard: {
          userPosition,
          totalUsers: userRanking.length,
          topPerformers: topPerformers.map((performer, index) => ({
            rank: index + 1,
            name: performer.name || "Anonymous",
            totalEarnings: performer.totalEarnings || 0,
            isCurrentUser: performer.id === user.id,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    response = NextResponse.json(
      { success: false, error: "Failed to fetch analytics data" },
      { status: 500 },
    );
  }

  return addAPISecurityHeaders(response);
}
