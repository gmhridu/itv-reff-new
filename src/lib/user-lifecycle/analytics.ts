import { db as prisma } from "@/lib/db";
import {
  UserLifecycleStage,
  UserLifecycleEvent,
  UserSegment,
  UserJourneyPhase,
  UserLifecycleFilters,
  LifecycleAnalyticsFilters,
  JourneyFunnelAnalysis,
  CohortAnalysis,
  LifecycleInsight,
  InsightCategory,
  InsightImpact,
  SegmentAnalysis,
  JourneyPhaseMetrics,
  DropOffAnalysis,
} from "./types";
import { JOURNEY_PHASE_MAPPING, SEGMENT_RULES } from "./config";
import { userLifecycleService } from "./service";

export interface LifecycleDashboardMetrics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    churnRate: number;
    averageEngagementScore: number;
    lifetimeValueTotal: number;
  };
  stageDistribution: Record<UserLifecycleStage, number>;
  segmentDistribution: Record<UserSegment, number>;
  journeyMetrics: {
    averageTimeToFirstTask: number; // hours
    averageTimeToFirstEarning: number; // hours
    averageTimeToFirstReferral: number; // days
    conversionRate: number;
  };
  trends: {
    userGrowth: Array<{ date: string; count: number }>;
    engagementTrend: Array<{ date: string; score: number }>;
    churnTrend: Array<{ date: string; rate: number }>;
  };
  topSegments: Array<{
    segment: UserSegment;
    userCount: number;
    growthRate: number;
    averageLTV: number;
  }>;
}

export interface UserActivityHeatmap {
  hourlyActivity: Record<number, number>; // hour -> activity count
  dailyActivity: Record<string, number>; // day -> activity count
  weeklyActivity: Record<number, number>; // weekday -> activity count
  monthlyActivity: Record<string, number>; // month -> activity count
}

export interface UserJourneyFlowAnalysis {
  stageTransitions: Array<{
    from: UserLifecycleStage | null;
    to: UserLifecycleStage;
    count: number;
    averageTime: number; // days
    conversionRate: number;
  }>;
  dropOffPoints: Array<{
    stage: UserLifecycleStage;
    dropOffCount: number;
    dropOffRate: number;
    nextStageCount: number;
  }>;
  commonPaths: Array<{
    path: UserLifecycleStage[];
    userCount: number;
    percentage: number;
    averageTimeToComplete: number; // days
  }>;
}

export interface CohortRetentionAnalysis {
  cohorts: Array<{
    cohortId: string;
    startDate: Date;
    initialSize: number;
    retentionCurve: Array<{
      day: number;
      usersRetained: number;
      retentionRate: number;
    }>;
  }>;
  averageRetentionRates: Record<number, number>; // day -> average retention rate
  retentionBySegment: Record<UserSegment, Record<number, number>>;
}

export class UserLifecycleAnalyticsService {
  private static instance: UserLifecycleAnalyticsService;

  public static getInstance(): UserLifecycleAnalyticsService {
    if (!UserLifecycleAnalyticsService.instance) {
      UserLifecycleAnalyticsService.instance =
        new UserLifecycleAnalyticsService();
    }
    return UserLifecycleAnalyticsService.instance;
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(
    filters: LifecycleAnalyticsFilters,
  ): Promise<LifecycleDashboardMetrics> {
    const { dateFrom, dateTo } = filters;

    // Get overview metrics
    const overview = await this.getOverviewMetrics(dateFrom, dateTo);

    // Get distribution data
    const [stageDistribution, segmentDistribution] = await Promise.all([
      this.getStageDistribution(dateFrom, dateTo),
      this.getSegmentDistribution(dateFrom, dateTo),
    ]);

    // Get journey metrics
    const journeyMetrics = await this.getJourneyMetrics(dateFrom, dateTo);

    // Get trends
    const trends = await this.getTrendData(
      dateFrom,
      dateTo,
      filters.groupBy || "day",
    );

    // Get top segments
    const topSegments = await this.getTopPerformingSegments(dateFrom, dateTo);

    return {
      overview,
      stageDistribution,
      segmentDistribution,
      journeyMetrics,
      trends,
      topSegments,
    };
  }

  /**
   * Get user activity heatmap data
   */
  async getUserActivityHeatmap(
    dateFrom: Date,
    dateTo: Date,
    eventTypes?: UserLifecycleEvent[],
  ): Promise<UserActivityHeatmap> {
    const whereClause: any = {
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    };

    if (eventTypes && eventTypes.length > 0) {
      whereClause.activity = {
        in: eventTypes,
      };
    }

    // Get all activity logs in the date range
    const activities = await prisma.activityLog.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        activity: true,
      },
    });

    // Initialize counters
    const hourlyActivity: Record<number, number> = {};
    const dailyActivity: Record<string, number> = {};
    const weeklyActivity: Record<number, number> = {};
    const monthlyActivity: Record<string, number> = {};

    // Initialize all hours, days, etc.
    for (let i = 0; i < 24; i++) hourlyActivity[i] = 0;
    for (let i = 0; i < 7; i++) weeklyActivity[i] = 0;

    // Process each activity
    activities.forEach((activity) => {
      const date = new Date(activity.createdAt);

      // Hourly activity
      const hour = date.getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;

      // Daily activity
      const dayKey = date.toISOString().split("T")[0];
      dailyActivity[dayKey] = (dailyActivity[dayKey] || 0) + 1;

      // Weekly activity (0 = Sunday, 1 = Monday, etc.)
      const weekday = date.getDay();
      weeklyActivity[weekday] = (weeklyActivity[weekday] || 0) + 1;

      // Monthly activity
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyActivity[monthKey] = (monthlyActivity[monthKey] || 0) + 1;
    });

    return {
      hourlyActivity,
      dailyActivity,
      weeklyActivity,
      monthlyActivity,
    };
  }

  /**
   * Analyze user journey flow and transitions
   */
  async analyzeUserJourneyFlow(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<UserJourneyFlowAnalysis> {
    // Get all stage transitions in the date range
    const transitions = await prisma.activityLog.findMany({
      where: {
        activity: "STAGE_TRANSITION",
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      select: {
        userId: true,
        metadata: true,
        createdAt: true,
      },
    });

    const stageTransitionCounts: Record<
      string,
      {
        count: number;
        totalTime: number;
        fromStage: UserLifecycleStage | null;
        toStage: UserLifecycleStage | null;
      }
    > = {};

    const userPaths: Record<string, UserLifecycleStage[]> = {};
    const stageDropOffs: Record<UserLifecycleStage, number> = Object.values(
      UserLifecycleStage,
    ).reduce(
      (acc, stage) => {
        acc[stage] = 0;
        return acc;
      },
      {} as Record<UserLifecycleStage, number>,
    );

    // Process transitions
    transitions.forEach((transition) => {
      try {
        const metadata = JSON.parse(transition.metadata || "{}");
        const fromStageRaw = metadata.fromStage;
        const toStageRaw = metadata.toStage;

        // Type guard for valid lifecycle stages
        const isValidStage = (stage: any): stage is UserLifecycleStage => {
          return stage && Object.values(UserLifecycleStage).includes(stage);
        };

        const fromStage: UserLifecycleStage | null = isValidStage(fromStageRaw)
          ? fromStageRaw
          : null;
        const toStage: UserLifecycleStage | null = isValidStage(toStageRaw)
          ? toStageRaw
          : null;

        if (!toStage) {
          return; // Skip invalid transitions
        }

        const transitionKey = `${fromStageRaw || "NULL"}_${toStageRaw}`;

        // Count transitions
        if (!stageTransitionCounts[transitionKey]) {
          stageTransitionCounts[transitionKey] = {
            count: 0,
            totalTime: 0,
            fromStage:
              fromStageRaw && isValidStage(fromStageRaw)
                ? (fromStageRaw as UserLifecycleStage)
                : null,
            toStage:
              toStageRaw && isValidStage(toStageRaw)
                ? (toStageRaw as UserLifecycleStage)
                : null,
          };
        }
        stageTransitionCounts[transitionKey].count++;

        if (metadata.daysInPreviousStage) {
          stageTransitionCounts[transitionKey].totalTime +=
            metadata.daysInPreviousStage;
        }

        // Track user paths - skip if no userId
        if (transition.userId) {
          if (!userPaths[transition.userId]) {
            userPaths[transition.userId] = [];
          }

          // Add fromStage to path if it's a valid stage
          if (isValidStage(fromStageRaw)) {
            const validFromStage = fromStageRaw as UserLifecycleStage;
            if (!userPaths[transition.userId].includes(validFromStage)) {
              userPaths[transition.userId].push(validFromStage);
            }
            // Count drop-offs for valid fromStage
            stageDropOffs[validFromStage] =
              (stageDropOffs[validFromStage] || 0) + 1;
          }

          // Add toStage to path if it's a valid stage
          if (isValidStage(toStageRaw)) {
            const validToStage = toStageRaw as UserLifecycleStage;
            if (!userPaths[transition.userId].includes(validToStage)) {
              userPaths[transition.userId].push(validToStage);
            }
          }
        }
      } catch (error) {
        console.error("Error parsing transition metadata:", error);
      }
    });

    // Calculate stage transitions with metrics
    const stageTransitionPromises = Object.entries(stageTransitionCounts).map(
      async ([key, data]) => {
        const [fromStageStr, toStageStr] = key.split("_");
        const fromStageResult =
          fromStageStr === "NULL" ? null : (fromStageStr as UserLifecycleStage);
        const toStageResult = toStageStr as UserLifecycleStage;

        return {
          from: fromStageResult,
          to: toStageResult,
          count: data.count,
          averageTime: data.count > 0 ? data.totalTime / data.count : 0,
          conversionRate: await this.calculateStageConversionRate(
            fromStageResult,
            toStageResult,
            dateFrom,
            dateTo,
          ),
        };
      },
    );

    const stageTransitions = await Promise.all(stageTransitionPromises);

    // Calculate drop-off points
    const dropOffPoints = await this.calculateDropOffPoints(stageTransitions);

    // Find common paths
    const commonPaths = this.findCommonUserPaths(userPaths);

    return {
      stageTransitions,
      dropOffPoints,
      commonPaths,
    } as UserJourneyFlowAnalysis;
  }

  /**
   * Perform cohort retention analysis
   */
  async analyzeCohortRetention(
    startDate: Date,
    endDate: Date,
    cohortPeriod: "weekly" | "monthly" = "monthly",
  ): Promise<CohortRetentionAnalysis> {
    const cohorts: CohortAnalysis[] = [];
    const retentionBySegment: Record<
      UserSegment,
      Record<number, number>
    > = {} as any;

    // Generate cohort periods
    const cohortPeriods = this.generateCohortPeriods(
      startDate,
      endDate,
      cohortPeriod,
    );

    for (const period of cohortPeriods) {
      const cohort = await this.analyzeCohort(period.start, period.end);
      if (cohort.initialSize > 0) {
        cohorts.push(cohort);
      }
    }

    // Calculate average retention rates across all cohorts
    const averageRetentionRates: Record<number, number> = {};
    if (cohorts.length > 0) {
      const maxDays = Math.max(
        ...cohorts.flatMap((c) => Object.keys(c.retentionCurve).map(Number)),
      );

      for (let day = 1; day <= maxDays; day++) {
        const rates = cohorts
          .map((c) => c.retentionCurve[day])
          .filter((rate) => rate !== undefined) as number[];

        if (rates.length > 0) {
          averageRetentionRates[day] =
            rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
        }
      }
    }

    // Calculate retention by segment (simplified implementation)
    for (const segment of Object.values(UserSegment)) {
      retentionBySegment[segment] = averageRetentionRates;
    }

    return {
      cohorts: cohorts.map((cohort) => ({
        cohortId: cohort.cohortId,
        startDate: cohort.cohortStartDate,
        initialSize: cohort.initialSize,
        retentionCurve: Object.entries(cohort.retentionCurve).map(
          ([day, rate]) => ({
            day: Number(day),
            usersRetained: Math.floor(cohort.initialSize * (rate / 100)),
            retentionRate: rate,
          }),
        ),
      })),
      averageRetentionRates,
      retentionBySegment,
    };
  }

  /**
   * Generate actionable insights from analytics data
   */
  async generateInsights(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<LifecycleInsight[]> {
    const insights: LifecycleInsight[] = [];

    // Get analytics data
    const [dashboardMetrics, journeyFlow, cohortRetention] = await Promise.all([
      this.getDashboardMetrics({ dateFrom, dateTo }),
      this.analyzeUserJourneyFlow(dateFrom, dateTo),
      this.analyzeCohortRetention(dateFrom, dateTo),
    ]);

    // Insight 1: High churn rate detection
    if (dashboardMetrics.overview.churnRate > 0.2) {
      insights.push({
        id: `high-churn-${Date.now()}`,
        title: "High Churn Rate Detected",
        description: `Current churn rate is ${(dashboardMetrics.overview.churnRate * 100).toFixed(1)}%, which is above the recommended threshold of 20%.`,
        category: InsightCategory.RISK,
        impact: InsightImpact.HIGH,
        confidence: 0.9,
        recommendation:
          "Implement targeted re-engagement campaigns for at-risk users and investigate common drop-off points.",
        data: {
          churnRate: dashboardMetrics.overview.churnRate,
          threshold: 0.2,
        },
      });
    }

    // Insight 2: Low conversion rate in key stages
    const lowConversionTransitions = journeyFlow.stageTransitions.filter(
      (t) => t.conversionRate < 0.5 && t.count > 10,
    );

    if (lowConversionTransitions.length > 0) {
      const worstTransition = lowConversionTransitions.reduce(
        (worst, current) =>
          current.conversionRate < worst.conversionRate ? current : worst,
      );

      insights.push({
        id: `low-conversion-${Date.now()}`,
        title: "Low Stage Conversion Rate",
        description: `Conversion from ${worstTransition.from} to ${worstTransition.to} is only ${(worstTransition.conversionRate * 100).toFixed(1)}%.`,
        category: InsightCategory.CONVERSION,
        impact: InsightImpact.HIGH,
        confidence: 0.8,
        recommendation: `Focus on improving user experience in the ${worstTransition.from} stage to increase progression to ${worstTransition.to}.`,
        data: {
          fromStage: worstTransition.from,
          toStage: worstTransition.to,
          conversionRate: worstTransition.conversionRate,
        },
      });
    }

    // Insight 3: Engagement trend analysis
    const recentEngagement = dashboardMetrics.trends.engagementTrend.slice(-7);
    const averageRecentEngagement =
      recentEngagement.reduce((sum, day) => sum + day.score, 0) /
      recentEngagement.length;
    const previousWeekEngagement =
      dashboardMetrics.trends.engagementTrend.slice(-14, -7);
    const averagePreviousEngagement =
      previousWeekEngagement.reduce((sum, day) => sum + day.score, 0) /
      previousWeekEngagement.length;

    if (averageRecentEngagement < averagePreviousEngagement * 0.9) {
      insights.push({
        id: `declining-engagement-${Date.now()}`,
        title: "Declining User Engagement",
        description: `Average engagement score has dropped ${(((averagePreviousEngagement - averageRecentEngagement) / averagePreviousEngagement) * 100).toFixed(1)}% compared to the previous week.`,
        category: InsightCategory.ENGAGEMENT,
        impact: InsightImpact.MEDIUM,
        confidence: 0.75,
        recommendation:
          "Review recent changes and implement engagement boosting activities such as new content, challenges, or rewards.",
        data: {
          currentEngagement: averageRecentEngagement,
          previousEngagement: averagePreviousEngagement,
          change:
            (averageRecentEngagement - averagePreviousEngagement) /
            averagePreviousEngagement,
        },
      });
    }

    // Insight 4: High-value segment opportunities
    const highValueSegments = dashboardMetrics.topSegments.filter(
      (s) => s.averageLTV > 1000,
    );
    if (highValueSegments.length > 0) {
      const topSegment = highValueSegments[0];

      insights.push({
        id: `high-value-opportunity-${Date.now()}`,
        title: "High-Value Segment Growth Opportunity",
        description: `${topSegment.segment} segment has high LTV (${topSegment.averageLTV.toFixed(0)}) and growth rate (${(topSegment.growthRate * 100).toFixed(1)}%).`,
        category: InsightCategory.OPPORTUNITY,
        impact: InsightImpact.HIGH,
        confidence: 0.85,
        recommendation: `Invest in acquiring more users for the ${topSegment.segment} segment and optimize their user journey.`,
        data: {
          segment: topSegment.segment,
          averageLTV: topSegment.averageLTV,
          growthRate: topSegment.growthRate,
          userCount: topSegment.userCount,
        },
      });
    }

    // Insight 5: Retention improvement opportunities
    const day7Retention = cohortRetention.averageRetentionRates[7];
    const day30Retention = cohortRetention.averageRetentionRates[30];

    if (day7Retention && day7Retention < 0.5) {
      insights.push({
        id: `low-7day-retention-${Date.now()}`,
        title: "Low 7-Day Retention Rate",
        description: `Only ${(day7Retention * 100).toFixed(1)}% of users are retained after 7 days.`,
        category: InsightCategory.RETENTION,
        impact: InsightImpact.HIGH,
        confidence: 0.9,
        recommendation:
          "Implement an improved onboarding sequence and early engagement activities to increase 7-day retention.",
        data: {
          day7Retention,
          benchmark: 0.5,
        },
      });
    }

    return insights;
  }

  /**
   * Get detailed segment analysis
   */
  async getSegmentAnalysis(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Record<UserSegment, SegmentAnalysis>> {
    const result: Record<UserSegment, SegmentAnalysis> = {} as any;

    for (const segment of Object.values(UserSegment)) {
      const segmentUsers = await this.getSegmentUsers(
        segment,
        dateFrom,
        dateTo,
      );

      if (segmentUsers.length === 0) {
        result[segment] = {
          userCount: 0,
          percentage: 0,
          averageEngagementScore: 0,
          averageLifetimeValue: 0,
          retentionRate: 0,
          conversionRate: 0,
          topStages: [],
        };
        continue;
      }

      // Calculate metrics for the segment
      const totalUsers = segmentUsers.length;
      const totalEngagement = segmentUsers.reduce(
        (sum, user) => sum + (user.engagementScore || 0),
        0,
      );
      const totalLTV = segmentUsers.reduce(
        (sum, user) => sum + (user.totalEarnings || 0),
        0,
      );

      // Get stage distribution for this segment
      const stageDistribution = await this.getSegmentStageDistribution(
        segment,
        dateFrom,
        dateTo,
      );
      const topStages = Object.entries(stageDistribution)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([stage]) => stage as UserLifecycleStage);

      result[segment] = {
        userCount: totalUsers,
        percentage: 0, // Will be calculated after all segments are processed
        averageEngagementScore:
          totalUsers > 0 ? totalEngagement / totalUsers : 0,
        averageLifetimeValue: totalUsers > 0 ? totalLTV / totalUsers : 0,
        retentionRate: await this.calculateSegmentRetentionRate(
          segment,
          dateFrom,
          dateTo,
        ),
        conversionRate: await this.calculateSegmentConversionRate(
          segment,
          dateFrom,
          dateTo,
        ),
        topStages,
      };
    }

    // Calculate percentages
    const totalUsersAcrossSegments = Object.values(result).reduce(
      (sum, segment) => sum + segment.userCount,
      0,
    );
    if (totalUsersAcrossSegments > 0) {
      Object.keys(result).forEach((segment) => {
        result[segment as UserSegment].percentage =
          (result[segment as UserSegment].userCount /
            totalUsersAcrossSegments) *
          100;
      });
    }

    return result;
  }

  /**
   * Private helper methods
   */

  private async getOverviewMetrics(dateFrom: Date, dateTo: Date) {
    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      churnedUsers,
      avgEngagement,
      totalLTV,
    ] = await Promise.all([
      prisma.user.count(),
      this.getActiveUsersCount(dateFrom, dateTo),
      this.getNewUsersTodayCount(),
      this.getChurnedUsersCount(dateFrom, dateTo),
      this.getAverageEngagementScore(),
      this.getTotalLifetimeValue(),
    ]);

    const churnRate = totalUsers > 0 ? churnedUsers / totalUsers : 0;

    return {
      totalUsers,
      activeUsers,
      newUsersToday,
      churnRate,
      averageEngagementScore: avgEngagement,
      lifetimeValueTotal: totalLTV,
    };
  }

  private async getStageDistribution(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Record<UserLifecycleStage, number>> {
    // Get all users and their current stages
    const result: Record<UserLifecycleStage, number> = {} as any;

    // Initialize all stages with 0
    Object.values(UserLifecycleStage).forEach((stage) => {
      result[stage] = 0;
    });

    // This would need to be implemented based on how stages are stored
    // For now, return empty distribution
    return result;
  }

  private async getSegmentDistribution(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Record<UserSegment, number>> {
    const result: Record<UserSegment, number> = {} as any;

    // Initialize all segments with 0
    Object.values(UserSegment).forEach((segment) => {
      result[segment] = 0;
    });

    // This would need to be implemented based on segment calculation logic
    return result;
  }

  private async getJourneyMetrics(dateFrom: Date, dateTo: Date) {
    // Calculate average times for key milestones
    const firstTaskTimes = await prisma.$queryRaw<Array<{ avg_hours: number }>>`
      SELECT AVG(EXTRACT(EPOCH FROM (task_time.created_at - users.created_at))/3600) as avg_hours
      FROM users
      JOIN (
        SELECT user_id, MIN(created_at) as created_at
        FROM user_video_tasks
        WHERE created_at BETWEEN ${dateFrom} AND ${dateTo}
        GROUP BY user_id
      ) task_time ON users.id = task_time.user_id
    `;

    const firstEarningTimes = await prisma.$queryRaw<
      Array<{ avg_hours: number }>
    >`
      SELECT AVG(EXTRACT(EPOCH FROM (earning_time.created_at - users.created_at))/3600) as avg_hours
      FROM users
      JOIN (
        SELECT user_id, MIN(created_at) as created_at
        FROM wallet_transactions
        WHERE type = 'CREDIT' AND amount > 0 AND created_at BETWEEN ${dateFrom} AND ${dateTo}
        GROUP BY user_id
      ) earning_time ON users.id = earning_time.user_id
    `;

    return {
      averageTimeToFirstTask: firstTaskTimes[0]?.avg_hours || 0,
      averageTimeToFirstEarning: firstEarningTimes[0]?.avg_hours || 0,
      averageTimeToFirstReferral: 0, // Would calculate similarly
      conversionRate: 0, // Would calculate based on funnel
    };
  }

  private async getTrendData(dateFrom: Date, dateTo: Date, groupBy: string) {
    const userGrowth = await this.getUserGrowthTrend(dateFrom, dateTo, groupBy);
    const engagementTrend = await this.getEngagementTrend(
      dateFrom,
      dateTo,
      groupBy,
    );
    const churnTrend = await this.getChurnTrend(dateFrom, dateTo, groupBy);

    return {
      userGrowth,
      engagementTrend,
      churnTrend,
    };
  }

  private async getTopPerformingSegments(dateFrom: Date, dateTo: Date) {
    // This would analyze segment performance and return top segments
    return [];
  }

  private async getUserGrowthTrend(
    dateFrom: Date,
    dateTo: Date,
    groupBy: string,
  ) {
    const dateFormat = this.getDateFormat(groupBy);

    const results = await prisma.$queryRaw<
      Array<{ date: string; count: number }>
    >`
      SELECT
        TO_CHAR(created_at, ${dateFormat}) as date,
        COUNT(*)::int as count
      FROM users
      WHERE created_at BETWEEN ${dateFrom} AND ${dateTo}
      GROUP BY TO_CHAR(created_at, ${dateFormat})
      ORDER BY date
    `;

    return results;
  }

  private async getEngagementTrend(
    dateFrom: Date,
    dateTo: Date,
    groupBy: string,
  ) {
    // This would calculate daily/weekly/monthly engagement scores
    return [];
  }

  private async getChurnTrend(dateFrom: Date, dateTo: Date, groupBy: string) {
    // This would calculate churn rates over time
    return [];
  }

  private getDateFormat(groupBy: string): string {
    switch (groupBy) {
      case "day":
        return "YYYY-MM-DD";
      case "week":
        return "YYYY-WW";
      case "month":
        return "YYYY-MM";
      default:
        return "YYYY-MM-DD";
    }
  }

  private async calculateStageConversionRate(
    fromStage: UserLifecycleStage | null,
    toStage: UserLifecycleStage,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<number> {
    try {
      const whereClause: any = {
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      };

      if (fromStage) {
        whereClause.activity = "STAGE_TRANSITION";
        whereClause.metadata = {
          contains: `"fromStage":"${fromStage}"`,
        };
      }

      const fromStageCount = await prisma.activityLog.count({
        where: whereClause,
      });

      if (fromStageCount === 0) return 0;

      const toStageCount = await prisma.activityLog.count({
        where: {
          ...whereClause,
          metadata: {
            contains: `"toStage":"${toStage}"`,
          },
        },
      });

      return (toStageCount / fromStageCount) * 100;
    } catch (error) {
      console.error("Error calculating stage conversion rate:", error);
      return 0;
    }
  }

  private async calculateDropOffPoints(transitions: any[]): Promise<
    Array<{
      stage: UserLifecycleStage;
      dropOffCount: number;
      dropOffRate: number;
      nextStageCount: number;
    }>
  > {
    const dropOffPoints = [] as Array<{
      stage: UserLifecycleStage;
      dropOffCount: number;
      dropOffRate: number;
      nextStageCount: number;
    }>;

    for (const transition of transitions) {
      if (transition.conversionRate < 50) {
        // Less than 50% conversion rate
        const dropOffCount = Math.floor(
          transition.count * (1 - transition.conversionRate / 100),
        );
        dropOffPoints.push({
          stage:
            (transition.from as UserLifecycleStage) ||
            UserLifecycleStage.REGISTERED,
          dropOffCount,
          dropOffRate: 100 - transition.conversionRate,
          nextStageCount: transition.count - dropOffCount,
        });
      }
    }

    return dropOffPoints;
  }

  private findCommonUserPaths(
    userPaths: Record<string, UserLifecycleStage[]>,
  ): Array<{
    path: UserLifecycleStage[];
    userCount: number;
    percentage: number;
    averageTimeToComplete: number;
  }> {
    const pathCounts: Record<
      string,
      { count: number; stages: UserLifecycleStage[] }
    > = {};
    const totalUsers = Object.keys(userPaths).length;

    Object.values(userPaths).forEach((path) => {
      if (path.length > 1) {
        const pathKey = path.join(" -> ");
        if (!pathCounts[pathKey]) {
          pathCounts[pathKey] = { count: 0, stages: path };
        }
        pathCounts[pathKey].count++;
      }
    });

    return Object.values(pathCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((pathData) => ({
        path: pathData.stages,
        userCount: pathData.count,
        percentage: totalUsers > 0 ? (pathData.count / totalUsers) * 100 : 0,
        averageTimeToComplete: 30, // Placeholder - would need actual calculation
      }));
  }

  private generateCohortPeriods(
    startDate: Date,
    endDate: Date,
    period: "weekly" | "monthly",
  ): Array<{ start: Date; end: Date; id: string }> {
    const periods: Array<{ start: Date; end: Date; id: string }> = [];
    const current = new Date(startDate);

    while (current < endDate) {
      const periodStart = new Date(current);
      const periodEnd = new Date(current);

      if (period === "monthly") {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setDate(periodEnd.getDate() + 7);
      }

      const cohortId =
        period === "monthly"
          ? `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, "0")}`
          : `${periodStart.getFullYear()}-W${Math.ceil(periodStart.getDate() / 7)}`;

      periods.push({
        start: periodStart,
        end: new Date(Math.min(periodEnd.getTime(), endDate.getTime())),
        id: cohortId,
      });

      current.setTime(periodEnd.getTime());
    }

    return periods;
  }

  private async analyzeCohort(
    startDate: Date,
    endDate: Date,
  ): Promise<CohortAnalysis> {
    // Get users who registered in this cohort period
    const cohortUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    const initialSize = cohortUsers.length;
    const cohortId = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`;

    // Calculate retention for different day intervals
    const retentionCurve = await this.calculateCohortRetention(
      cohortUsers,
      startDate,
    );

    return {
      cohortId,
      cohortStartDate: startDate,
      initialSize,
      currentSize: cohortUsers.length,
      retentionCurve,
      lifetimeValueProgression: {},
      stageProgressions: [],
    };
  }

  private async calculateCohortRetention(
    cohortUsers: Array<{
      id: string;
      createdAt: Date;
      lastLoginAt: Date | null;
    }>,
    cohortStartDate: Date,
  ): Promise<Record<number, number>> {
    const retentionDays = [1, 3, 7, 14, 30, 60, 90];
    const retentionCurve: Record<number, number> = {};

    for (const day of retentionDays) {
      const targetDate = new Date(cohortStartDate);
      targetDate.setDate(targetDate.getDate() + day);

      const retainedUsers = cohortUsers.filter((user) => {
        return user.lastLoginAt && user.lastLoginAt >= targetDate;
      });

      const retentionRate =
        cohortUsers.length > 0
          ? (retainedUsers.length / cohortUsers.length) * 100
          : 0;

      retentionCurve[day] = retentionRate;
    }

    return retentionCurve;
  }

  // Additional helper methods
  private async getActiveUsersCount(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return prisma.user.count({
      where: {
        lastLoginAt: {
          gte: sevenDaysAgo,
        },
      },
    });
  }

  private async getNewUsersTodayCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.user.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
  }

  private async getChurnedUsersCount(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return prisma.user.count({
      where: {
        lastLoginAt: {
          lt: thirtyDaysAgo,
        },
      },
    });
  }

  private async getAverageEngagementScore(): Promise<number> {
    // This would calculate average engagement across all users
    // For now, return a placeholder
    return 65;
  }

  private async getTotalLifetimeValue(): Promise<number> {
    const result = await prisma.user.aggregate({
      _sum: {
        totalEarnings: true,
      },
    });

    return result._sum.totalEarnings || 0;
  }

  private async getSegmentUsers(
    segment: UserSegment,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Array<{ engagementScore?: number; totalEarnings?: number }>> {
    // This would filter users by segment criteria
    // For now, return empty array
    return [];
  }

  private async getSegmentStageDistribution(
    segment: UserSegment,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Record<UserLifecycleStage, number>> {
    const result: Record<UserLifecycleStage, number> = {} as any;

    Object.values(UserLifecycleStage).forEach((stage) => {
      result[stage] = 0;
    });

    return result;
  }

  private async calculateSegmentRetentionRate(
    segment: UserSegment,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<number> {
    // Calculate retention rate for specific segment
    return 0.6; // Placeholder
  }

  private async calculateSegmentConversionRate(
    segment: UserSegment,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<number> {
    // Calculate conversion rate for specific segment
    return 0.4; // Placeholder
  }
}

// Export singleton instance
export const userLifecycleAnalyticsService =
  UserLifecycleAnalyticsService.getInstance();
