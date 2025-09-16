import { db as prisma } from "@/lib/db";
import {
  AnalyticsData,
  AnalyticsOverview,
  UserIncomeAnalytics,
  VideoViewsAnalytics,
  VideoAnalytics,
  UserAnalytics,
  RevenueBreakdown,
  AnalyticsTimeSeriesData,
} from "@/types/admin";

export class AnalyticsService {
  /**
   * Get comprehensive analytics data
   */
  async getAnalyticsData(
    dateFrom?: Date,
    dateTo?: Date,
    timePeriod: "daily" | "weekly" | "monthly" | "yearly" = "monthly",
  ): Promise<AnalyticsData> {
    try {
      const endDate = dateTo || new Date();
      const startDate = dateFrom || this.getDefaultStartDate(timePeriod);

      // Validate date range
      if (startDate > endDate) {
        throw new Error("Start date cannot be after end date");
      }

      // Ensure reasonable date range (not more than 5 years)
      const maxRange = 5 * 365 * 24 * 60 * 60 * 1000; // 5 years in milliseconds
      if (endDate.getTime() - startDate.getTime() > maxRange) {
        throw new Error("Date range cannot exceed 5 years");
      }

      console.log("AnalyticsService: Fetching data for period", {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timePeriod,
      });

      const [
        overview,
        userIncome,
        videoViews,
        topVideos,
        topUsers,
        revenueBreakdown,
      ] = await Promise.all([
        this.getOverviewStats(startDate, endDate),
        this.getUserIncomeAnalytics(startDate, endDate),
        this.getVideoViewsAnalytics(startDate, endDate),
        this.getTopVideos(startDate, endDate),
        this.getTopUsers(startDate, endDate),
        this.getRevenueBreakdown(startDate, endDate),
      ]);

      return {
        overview,
        userIncome,
        videoViews,
        topVideos,
        topUsers,
        revenueBreakdown,
      };
    } catch (error) {
      console.error("AnalyticsService: Error in getAnalyticsData", error);

      // Return default empty data structure
      return {
        overview: {
          totalRevenue: 0,
          revenueGrowth: 0,
          totalUsers: 0,
          userGrowth: 0,
          totalVideoViews: 0,
          videoViewGrowth: 0,
          activeUsers: 0,
          activeUserChange: 0,
        },
        userIncome: {
          monthly: [],
          weekly: [],
          yearly: [],
        },
        videoViews: {
          daily: [],
          weekly: [],
          monthly: [],
        },
        topVideos: [],
        topUsers: [],
        revenueBreakdown: [],
      };
    }
  }

  /**
   * Get overview statistics
   */
  private async getOverviewStats(
    startDate: Date,
    endDate: Date,
  ): Promise<AnalyticsOverview> {
    try {
      const previousPeriod = this.getPreviousPeriod(startDate, endDate);

      console.log("AnalyticsService: Getting overview stats", {
        currentPeriod: { startDate, endDate },
        previousPeriod,
      });

      // Current period stats
      const [
        currentRevenue,
        currentUsers,
        currentVideoViews,
        currentActiveUsers,
      ] = await Promise.all([
        this.getTotalRevenue(startDate, endDate),
        this.getTotalUsers(startDate, endDate),
        this.getTotalVideoViews(startDate, endDate),
        this.getActiveUsers(startDate, endDate),
      ]);

      // Previous period stats for growth calculation
      const [
        previousRevenue,
        previousUsers,
        previousVideoViews,
        previousActiveUsers,
      ] = await Promise.all([
        this.getTotalRevenue(previousPeriod.start, previousPeriod.end),
        this.getTotalUsers(previousPeriod.start, previousPeriod.end),
        this.getTotalVideoViews(previousPeriod.start, previousPeriod.end),
        this.getActiveUsers(previousPeriod.start, previousPeriod.end),
      ]);

      return {
        totalRevenue: currentRevenue,
        revenueGrowth: this.calculateGrowthPercentage(
          currentRevenue,
          previousRevenue,
        ),
        totalUsers: currentUsers,
        userGrowth: this.calculateGrowthPercentage(currentUsers, previousUsers),
        totalVideoViews: currentVideoViews,
        videoViewGrowth: this.calculateGrowthPercentage(
          currentVideoViews,
          previousVideoViews,
        ),
        activeUsers: currentActiveUsers,
        activeUserChange: currentActiveUsers - previousActiveUsers,
      };
    } catch (error) {
      console.error("AnalyticsService: Error in getOverviewStats", error);
      return {
        totalRevenue: 0,
        revenueGrowth: 0,
        totalUsers: 0,
        userGrowth: 0,
        totalVideoViews: 0,
        videoViewGrowth: 0,
        activeUsers: 0,
        activeUserChange: 0,
      };
    }
  }

  /**
   * Get user income analytics
   */
  private async getUserIncomeAnalytics(
    startDate: Date,
    endDate: Date,
  ): Promise<UserIncomeAnalytics> {
    try {
      const [monthlyData, weeklyData, yearlyData] = await Promise.all([
        this.getUserIncomeByPeriod(startDate, endDate, "month"),
        this.getUserIncomeByPeriod(startDate, endDate, "week"),
        this.getUserIncomeByPeriod(startDate, endDate, "year"),
      ]);

      return {
        monthly: monthlyData,
        weekly: weeklyData,
        yearly: yearlyData,
      };
    } catch (error) {
      console.error("AnalyticsService: Error in getUserIncomeAnalytics", error);
      return {
        monthly: [],
        weekly: [],
        yearly: [],
      };
    }
  }

  /**
   * Get video views analytics
   */
  private async getVideoViewsAnalytics(
    startDate: Date,
    endDate: Date,
  ): Promise<VideoViewsAnalytics> {
    try {
      const [dailyData, weeklyData, monthlyData] = await Promise.all([
        this.getVideoViewsByPeriod(startDate, endDate, "day"),
        this.getVideoViewsByPeriod(startDate, endDate, "week"),
        this.getVideoViewsByPeriod(startDate, endDate, "month"),
      ]);

      return {
        daily: dailyData,
        weekly: weeklyData,
        monthly: monthlyData,
      };
    } catch (error) {
      console.error("AnalyticsService: Error in getVideoViewsAnalytics", error);
      return {
        daily: [],
        weekly: [],
        monthly: [],
      };
    }
  }

  /**
   * Get user income data grouped by period
   */
  private async getUserIncomeByPeriod(
    startDate: Date,
    endDate: Date,
    period: "day" | "week" | "month" | "year",
  ): Promise<AnalyticsTimeSeriesData[]> {
    try {
      console.log("AnalyticsService: Getting user income by period", {
        startDate,
        endDate,
        period,
      });

      // Use Prisma aggregation instead of raw SQL to avoid GROUP BY issues
      const transactions = await prisma.walletTransaction.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: "COMPLETED",
          type: {
            in: [
              "TASK_INCOME",
              "REFERRAL_REWARD_A",
              "REFERRAL_REWARD_B",
              "REFERRAL_REWARD_C",
              "MANAGEMENT_BONUS_A",
              "MANAGEMENT_BONUS_B",
              "MANAGEMENT_BONUS_C",
            ],
          },
        },
        select: {
          amount: true,
          createdAt: true,
        },
      });

      // Group transactions by period
      const groupedData: { [key: string]: number } = {};

      transactions.forEach((transaction) => {
        if (transaction.createdAt) {
          const periodKey = this.formatDateByPeriod(
            transaction.createdAt,
            period,
          );
          groupedData[periodKey] =
            (groupedData[periodKey] || 0) + (transaction.amount || 0);
        }
      });

      return Object.entries(groupedData)
        .map(([period, value]) => ({
          name: period,
          value,
          date: period,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("AnalyticsService: Error in getUserIncomeByPeriod", error);
      return [];
    }
  }

  /**
   * Get video views data grouped by period
   */
  private async getVideoViewsByPeriod(
    startDate: Date,
    endDate: Date,
    period: "day" | "week" | "month" | "year",
  ): Promise<AnalyticsTimeSeriesData[]> {
    try {
      console.log("AnalyticsService: Getting video views by period", {
        startDate,
        endDate,
        period,
      });

      // Use Prisma to get video tasks
      const videoTasks = await prisma.userVideoTask.findMany({
        where: {
          watchedAt: { gte: startDate, lte: endDate },
          isVerified: true,
        },
        select: {
          watchedAt: true,
        },
      });

      // Group video tasks by period
      const groupedData: { [key: string]: number } = {};

      videoTasks.forEach((task) => {
        if (task.watchedAt) {
          const periodKey = this.formatDateByPeriod(task.watchedAt, period);
          groupedData[periodKey] = (groupedData[periodKey] || 0) + 1;
        }
      });

      return Object.entries(groupedData)
        .map(([period, value]) => ({
          name: period,
          value,
          date: period,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("AnalyticsService: Error in getVideoViewsByPeriod", error);
      return [];
    }
  }

  /**
   * Get top performing videos
   */
  private async getTopVideos(
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ): Promise<VideoAnalytics[]> {
    try {
      console.log("AnalyticsService: Getting top videos", {
        startDate,
        endDate,
        limit,
      });

      // Get videos with their task statistics
      const videos = await prisma.video.findMany({
        where: {
          isActive: true,
        },
        include: {
          videoTasks: {
            where: {
              watchedAt: { gte: startDate, lte: endDate },
              isVerified: true,
            },
          },
        },
      });

      const videoAnalytics: VideoAnalytics[] = videos
        .map((video) => {
          const tasks = video.videoTasks || [];
          const views = tasks.length;
          const totalRewardsPaid = tasks.reduce(
            (sum, task) => sum + (task.rewardEarned || 0),
            0,
          );
          const averageWatchTime =
            tasks.length > 0
              ? tasks.reduce(
                  (sum, task) => sum + (task.watchDuration || 0),
                  0,
                ) / tasks.length
              : 0;
          const completedTasks = tasks.filter(
            (task) => (task.watchDuration || 0) >= (video.duration || 0) * 0.8,
          ).length;
          const completionRate =
            tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

          return {
            id: video.id,
            title: video.title || "Untitled Video",
            views,
            engagement: completionRate,
            totalRewardsPaid,
            averageWatchTime,
            completionRate,
          };
        })
        .sort(
          (a, b) =>
            b.views - a.views || b.totalRewardsPaid - a.totalRewardsPaid,
        )
        .slice(0, limit);

      return videoAnalytics;
    } catch (error) {
      console.error("AnalyticsService: Error in getTopVideos", error);
      return [];
    }
  }

  /**
   * Get top performing users
   */
  private async getTopUsers(
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ): Promise<UserAnalytics[]> {
    try {
      console.log("AnalyticsService: Getting top users", {
        startDate,
        endDate,
        limit,
      });

      // Get users with their activity in the period
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { createdAt: { gte: startDate } },
            {
              videoTasks: {
                some: {
                  watchedAt: { gte: startDate, lte: endDate },
                  isVerified: true,
                },
              },
            },
          ],
        },
        include: {
          videoTasks: {
            where: {
              watchedAt: { gte: startDate, lte: endDate },
              isVerified: true,
            },
          },
          referrals: true,
        },
        orderBy: {
          totalEarnings: "desc",
        },
        take: limit,
      });

      return users.map((user) => ({
        id: user.id,
        name: user.name || "Unknown",
        email: user.email || "No email",
        totalEarnings: user.totalEarnings || 0,
        videoTasksCompleted: user.videoTasks?.length || 0,
        referralCount: user.referrals?.length || 0,
        engagement:
          user.videoTasks && user.videoTasks.length > 0
            ? Math.min((user.videoTasks.length / 30) * 100, 100)
            : 0,
      }));
    } catch (error) {
      console.error("AnalyticsService: Error in getTopUsers", error);
      return [];
    }
  }

  /**
   * Get revenue breakdown by source
   */
  private async getRevenueBreakdown(
    startDate: Date,
    endDate: Date,
  ): Promise<RevenueBreakdown[]> {
    try {
      console.log("AnalyticsService: Getting revenue breakdown", {
        startDate,
        endDate,
      });

      // Get transactions grouped by type
      const transactions = await prisma.walletTransaction.groupBy({
        by: ["type"],
        _sum: {
          amount: true,
        },
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: "COMPLETED",
          type: {
            in: [
              "TASK_INCOME",
              "REFERRAL_REWARD_A",
              "REFERRAL_REWARD_B",
              "REFERRAL_REWARD_C",
              "MANAGEMENT_BONUS_A",
              "MANAGEMENT_BONUS_B",
              "MANAGEMENT_BONUS_C",
            ],
          },
        },
        orderBy: {
          _sum: {
            amount: "desc",
          },
        },
      });

      const totalAmount = transactions.reduce(
        (sum, group) => sum + (group._sum.amount || 0),
        0,
      );

      return transactions.map((group) => {
        const amount = group._sum.amount || 0;
        return {
          source: this.formatTransactionType(group.type),
          amount,
          percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
        };
      });
    } catch (error) {
      console.error("AnalyticsService: Error in getRevenueBreakdown", error);
      return [];
    }
  }

  /**
   * Helper methods
   */
  private async getTotalRevenue(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    try {
      const result = await prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: "COMPLETED",
          type: {
            in: [
              "TASK_INCOME",
              "REFERRAL_REWARD_A",
              "REFERRAL_REWARD_B",
              "REFERRAL_REWARD_C",
              "MANAGEMENT_BONUS_A",
              "MANAGEMENT_BONUS_B",
              "MANAGEMENT_BONUS_C",
            ],
          },
        },
      });

      return result._sum.amount || 0;
    } catch (error) {
      console.error("AnalyticsService: Error in getTotalRevenue", error);
      return 0;
    }
  }

  private async getTotalUsers(startDate: Date, endDate: Date): Promise<number> {
    try {
      return await prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      });
    } catch (error) {
      console.error("AnalyticsService: Error in getTotalUsers", error);
      return 0;
    }
  }

  private async getTotalVideoViews(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    try {
      return await prisma.userVideoTask.count({
        where: {
          watchedAt: { gte: startDate, lte: endDate },
          isVerified: true,
        },
      });
    } catch (error) {
      console.error("AnalyticsService: Error in getTotalVideoViews", error);
      return 0;
    }
  }

  private async getActiveUsers(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    try {
      return await prisma.user.count({
        where: {
          OR: [
            { lastLoginAt: { gte: startDate, lte: endDate } },
            {
              videoTasks: {
                some: {
                  watchedAt: { gte: startDate, lte: endDate },
                  isVerified: true,
                },
              },
            },
          ],
        },
      });
    } catch (error) {
      console.error("AnalyticsService: Error in getActiveUsers", error);
      return 0;
    }
  }

  private formatDateByPeriod(
    date: Date,
    period: "day" | "week" | "month" | "year",
  ): string {
    switch (period) {
      case "day":
        return date.toISOString().split("T")[0]; // YYYY-MM-DD
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
      case "month":
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      case "year":
        return String(date.getFullYear());
      default:
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
  }

  private getDateFormat(period: "day" | "week" | "month" | "year"): string {
    switch (period) {
      case "day":
        return "YYYY-MM-DD";
      case "week":
        return "IYYY-IW";
      case "month":
        return "YYYY-MM";
      case "year":
        return "YYYY";
      default:
        return "YYYY-MM";
    }
  }

  private getDefaultStartDate(timePeriod: string): Date {
    const now = new Date();
    switch (timePeriod) {
      case "daily":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
      case "weekly":
        return new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // 12 weeks
      case "monthly":
        return new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000); // 12 months
      case "yearly":
        return new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000); // 5 years
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  private getPreviousPeriod(
    startDate: Date,
    endDate: Date,
  ): { start: Date; end: Date } {
    const duration = endDate.getTime() - startDate.getTime();
    return {
      start: new Date(startDate.getTime() - duration),
      end: new Date(startDate.getTime()),
    };
  }

  private calculateGrowthPercentage(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private formatTransactionType(type: string): string {
    const typeMap: { [key: string]: string } = {
      TASK_INCOME: "Task Rewards",
      REFERRAL_REWARD_A: "Level A Referrals",
      REFERRAL_REWARD_B: "Level B Referrals",
      REFERRAL_REWARD_C: "Level C Referrals",
      MANAGEMENT_BONUS_A: "Level A Management",
      MANAGEMENT_BONUS_B: "Level B Management",
      MANAGEMENT_BONUS_C: "Level C Management",
    };

    return typeMap[type] || type;
  }
}

export const analyticsService = new AnalyticsService();
