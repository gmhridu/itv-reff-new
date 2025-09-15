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
    const timePeriod = url.searchParams.get("timePeriod") || "monthly";

    // Calculate date ranges
    const endDate = new Date();
    const startDate = new Date();

    switch (timePeriod) {
      case "daily":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "weekly":
        startDate.setDate(startDate.getDate() - 84); // 12 weeks
        break;
      case "monthly":
        startDate.setMonth(startDate.getMonth() - 12);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 12);
    }

    // Get user's current position
    const userDetails = await db.user.findUnique({
      where: { id: user.id },
      include: {
        currentPosition: true,
        userPlan: true,
      },
    });

    // Get wallet transactions for income tracking
    const walletTransactions = await db.walletTransaction.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Get video task completions
    const videoTasks = await db.userVideoTask.findMany({
      where: {
        userId: user.id,
        watchedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { watchedAt: "asc" },
    });

    // Get referral data
    const referralHierarchy = await db.referralHierarchy.findMany({
      where: {
        referrerId: user.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Generate monthly income data
    const generateMonthlyData = () => {
      const monthlyData: Array<{
        month: string;
        earnings: number;
        videosWatched: number;
      }> = [];

      for (let i = 8; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          1,
        );
        const monthEnd = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          0,
        );

        const monthTransactions = walletTransactions.filter((t) => {
          const tDate = new Date(t.createdAt);
          return (
            tDate >= monthStart && tDate <= monthEnd && t.type === "CREDIT"
          );
        });

        const monthVideos = videoTasks.filter((v) => {
          const vDate = new Date(v.watchedAt);
          return vDate >= monthStart && vDate <= monthEnd;
        });

        const earnings = monthTransactions.reduce(
          (sum, t) => sum + (t.amount || 0),
          0,
        );

        monthlyData.push({
          month: monthDate.toLocaleDateString("en-US", { month: "short" }),
          earnings,
          videosWatched: monthVideos.length,
        });
      }

      return monthlyData;
    };

    // Generate weekly data
    const generateWeeklyData = () => {
      const weeklyData: Array<{
        week: string;
        earnings: number;
        videosWatched: number;
      }> = [];

      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - i * 7);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weekTransactions = walletTransactions.filter((t) => {
          const tDate = new Date(t.createdAt);
          return tDate >= weekStart && tDate <= weekEnd && t.type === "CREDIT";
        });

        const weekVideos = videoTasks.filter((v) => {
          const vDate = new Date(v.watchedAt);
          return vDate >= weekStart && vDate <= weekEnd;
        });

        const earnings = weekTransactions.reduce(
          (sum, t) => sum + (t.amount || 0),
          0,
        );

        weeklyData.push({
          week: `Week ${12 - i}`,
          earnings,
          videosWatched: weekVideos.length,
        });
      }

      return weeklyData;
    };

    // Generate daily data
    const generateDailyData = () => {
      const dailyData: Array<{
        date: string;
        earnings: number;
        videosWatched: number;
      }> = [];

      for (let i = 29; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const dayTransactions = walletTransactions.filter((t) => {
          const tDate = new Date(t.createdAt);
          return tDate >= dayStart && tDate <= dayEnd && t.type === "CREDIT";
        });

        const dayVideos = videoTasks.filter((v) => {
          const vDate = new Date(v.watchedAt);
          return vDate >= dayStart && vDate <= dayEnd;
        });

        const earnings = dayTransactions.reduce(
          (sum, t) => sum + (t.amount || 0),
          0,
        );

        dailyData.push({
          date: dayStart.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          earnings,
          videosWatched: dayVideos.length,
        });
      }

      return dailyData;
    };

    // Generate referral growth data
    const generateReferralGrowthData = () => {
      const referralData: Array<{
        month: string;
        newReferrals: number;
        totalReferrals: number;
      }> = [];

      let cumulativeReferrals = 0;

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStart = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          1,
        );
        const monthEnd = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          0,
        );

        const monthReferrals = referralHierarchy.filter((r) => {
          const rDate = new Date(r.createdAt);
          return rDate >= monthStart && rDate <= monthEnd;
        });

        const newReferrals = monthReferrals.length;
        cumulativeReferrals += newReferrals;

        referralData.push({
          month: monthDate.toLocaleDateString("en-US", { month: "short" }),
          newReferrals,
          totalReferrals: cumulativeReferrals,
        });
      }

      return referralData;
    };

    // Calculate revenue breakdown
    const creditTransactions = walletTransactions.filter(
      (t) => t.type === "CREDIT",
    );
    const totalRevenue = creditTransactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0,
    );

    const videoTaskRevenue = creditTransactions
      .filter((t) => t.description?.toLowerCase().includes("video"))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const referralRevenue = creditTransactions
      .filter((t) => t.description?.toLowerCase().includes("referral"))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const bonusRevenue = creditTransactions
      .filter((t) => t.description?.toLowerCase().includes("bonus"))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const otherRevenue =
      totalRevenue - videoTaskRevenue - referralRevenue - bonusRevenue;

    const revenueBreakdown = [
      {
        source: "Video Tasks",
        amount: videoTaskRevenue,
        percentage:
          totalRevenue > 0 ? (videoTaskRevenue / totalRevenue) * 100 : 0,
      },
      {
        source: "Referral Bonuses",
        amount: referralRevenue,
        percentage:
          totalRevenue > 0 ? (referralRevenue / totalRevenue) * 100 : 0,
      },
      {
        source: "Level Bonuses",
        amount: bonusRevenue,
        percentage: totalRevenue > 0 ? (bonusRevenue / totalRevenue) * 100 : 0,
      },
      {
        source: "Other",
        amount: otherRevenue,
        percentage: totalRevenue > 0 ? (otherRevenue / totalRevenue) * 100 : 0,
      },
    ].filter((item) => item.amount > 0);

    // Calculate performance metrics
    const totalVideos = videoTasks.length;
    const averageEarningsPerVideo =
      totalVideos > 0 ? videoTaskRevenue / totalVideos : 0;

    // Calculate completion rate based on available data
    const dailyLimit = userDetails?.currentPosition?.tasksPerDay || 10;
    const daysSinceStart = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const expectedTotalVideos = daysSinceStart * dailyLimit;
    const completionRate =
      expectedTotalVideos > 0
        ? Math.min((totalVideos / expectedTotalVideos) * 100, 100)
        : 0;

    // Calculate current streak (simplified)
    const streakDays = Math.floor(Math.random() * 15) + 1; // Placeholder for now

    // Get total referral stats
    const totalReferrals = await db.referralHierarchy.count({
      where: { referrerId: user.id },
    });

    const activeReferrals = Math.floor(totalReferrals * 0.8); // Estimate

    // Build response data
    const analyticsData = {
      incomeTracking: {
        daily: generateDailyData(),
        weekly: generateWeeklyData(),
        monthly: generateMonthlyData(),
      },
      userGrowth: {
        referralStats: {
          totalReferrals,
          activeReferrals,
          referralEarnings: referralRevenue,
          monthlyGrowth: generateReferralGrowthData(),
        },
        progressStats: {
          currentLevel: userDetails?.currentPosition?.name || "Intern",
          nextLevel: `L${(userDetails?.currentPosition?.level || 0) + 1}`,
          progressToNext: Math.random() * 100,
          daysActive: Math.floor(
            (Date.now() -
              new Date(userDetails?.createdAt || Date.now()).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        },
      },
      revenueBreakdown,
      performanceMetrics: {
        averageEarningsPerVideo,
        completionRate,
        streakDays,
        totalVideoHours: totalVideos * 0.5,
      },
    };

    response = NextResponse.json({
      success: true,
      data: analyticsData,
    });
  } catch (error) {
    console.error("User analytics error:", error);
    response = NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch user analytics data",
      },
      { status: 500 },
    );
  }

  return addAPISecurityHeaders(response);
}
