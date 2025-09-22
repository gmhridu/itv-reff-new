import { db as prisma } from "@/lib/db";
import {
  UserLifecycleData,
  UserLifecycleStage,
  UserLifecycleEvent,
  UserSegment,
  UserJourneyPhase,
  UserLifecycleMetrics,
  UserMilestone,
  UserStageTransition,
  UserLifecycleFilters,
  UserLifecycleReport,
  ChurnPrediction,
  LifetimeValuePrediction,
  UserJourneyAnalytics,
  PaginatedLifecycleResponse,
  UserLifecycleApiResponse,
} from "./types";
import {
  DEFAULT_LIFECYCLE_CONFIG,
  SEGMENT_RULES,
  JOURNEY_PHASE_MAPPING,
  MILESTONE_DEFINITIONS,
  RISK_FACTORS,
} from "./config";
import { eventTracker, EventTrackingOptions } from "./event-tracking";
import { EventSource } from "./types";

export class UserLifecycleService {
  private static instance: UserLifecycleService;

  public static getInstance(): UserLifecycleService {
    if (!UserLifecycleService.instance) {
      UserLifecycleService.instance = new UserLifecycleService();
    }
    return UserLifecycleService.instance;
  }

  /**
   * Get comprehensive lifecycle data for a user
   */
  async getUserLifecycleData(
    userId: string,
  ): Promise<UserLifecycleData | null> {
    try {
      // Get user with related data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          currentPosition: true,
          videoTasks: {
            where: { isVerified: true },
            select: {
              id: true,
              rewardEarned: true,
              watchedAt: true,
              createdAt: true,
            },
          },
          referrals: {
            select: { id: true, createdAt: true },
          },
          transactions: {
            where: { status: "COMPLETED" },
            select: {
              amount: true,
              type: true,
              createdAt: true,
            },
          },
          activityLogs: {
            orderBy: { createdAt: "desc" },
            take: 100,
          },
        },
      });

      if (!user) return null;

      // Calculate metrics
      const metrics = await this.calculateUserMetrics(user);

      // Get current stage and history
      const currentStage = await this.getUserCurrentStage(userId);
      const stageHistory = await this.getUserStageHistory(userId);

      // Calculate scores
      const engagementScore = await this.calculateEngagementScore(user);
      const riskScore = await this.calculateRiskScore(user);

      // Determine segment and journey phase
      const segment = await this.determineUserSegment(
        user,
        currentStage,
        engagementScore,
      );
      const journeyPhase =
        JOURNEY_PHASE_MAPPING[currentStage] || UserJourneyPhase.ACQUISITION;

      // Calculate time-based metrics
      const daysSinceRegistration = Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      const daysSinceLastActivity = user.lastLoginAt
        ? Math.floor(
            (Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24),
          )
        : daysSinceRegistration;

      // Get predictions
      const churnProbability = await this.predictChurnProbability(userId);
      const nextStageTimeline = await this.predictNextStageTimeline(
        currentStage,
        user,
      );
      const lifetimeValuePrediction = await this.predictLifetimeValue(userId);

      return {
        userId,
        currentStage,
        previousStage:
          stageHistory.length > 1 ? stageHistory[1].fromStage : undefined,
        stageEnteredAt: stageHistory[0]?.transitionDate || user.createdAt,
        daysSinceRegistration,
        daysSinceLastActivity,
        totalLifetimeValue: user.totalEarnings,
        engagementScore,
        riskScore,
        segment,
        journeyPhase,
        stageHistory,
        metrics,
        churnProbability,
        nextStageTimeline,
        lifetimeValuePrediction: lifetimeValuePrediction.predictedLTV,
      };
    } catch (error) {
      console.error("Error getting user lifecycle data:", error);
      return null;
    }
  }

  /**
   * Get multiple users' lifecycle data with pagination
   */
  async getUsersLifecycleData(
    filters: UserLifecycleFilters = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ): Promise<PaginatedLifecycleResponse<UserLifecycleData>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = this.buildUserWhereClause(filters);

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          currentPosition: true,
          videoTasks: {
            where: { isVerified: true },
            select: {
              id: true,
              rewardEarned: true,
              watchedAt: true,
              createdAt: true,
            },
          },
          referrals: {
            select: { id: true, createdAt: true },
          },
          transactions: {
            where: { status: "COMPLETED" },
            select: {
              amount: true,
              type: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    // Get lifecycle data for each user
    const lifecycleData = await Promise.all(
      users.map(async (user) => {
        const data = await this.getUserLifecycleData(user.id);
        return data!;
      }),
    );

    // Filter out null results
    const validData = lifecycleData.filter(Boolean);

    return {
      items: validData,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get user segment distribution
   */
  async getSegmentDistribution(
    filters: UserLifecycleFilters = {},
  ): Promise<Record<UserSegment, number>> {
    const whereClause = this.buildUserWhereClause(filters);

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        currentPosition: true,
        videoTasks: {
          where: { isVerified: true },
          select: { id: true, rewardEarned: true },
        },
        referrals: { select: { id: true } },
        transactions: {
          where: { status: "COMPLETED" },
          select: { amount: true, type: true },
        },
      },
    });

    const segmentCounts: Record<UserSegment, number> = Object.values(
      UserSegment,
    ).reduce(
      (acc, segment) => {
        acc[segment] = 0;
        return acc;
      },
      {} as Record<UserSegment, number>,
    );

    for (const user of users) {
      const currentStage = await this.getUserCurrentStage(user.id);
      const engagementScore = await this.calculateEngagementScore(user);
      const segment = await this.determineUserSegment(
        user,
        currentStage,
        engagementScore,
      );
      segmentCounts[segment]++;
    }

    return segmentCounts;
  }

  /**
   * Get lifecycle stage distribution
   */
  async getStageDistribution(
    filters: UserLifecycleFilters = {},
  ): Promise<Record<UserLifecycleStage, number>> {
    const whereClause = this.buildUserWhereClause(filters);

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true },
    });

    const stageCounts: Record<UserLifecycleStage, number> = Object.values(
      UserLifecycleStage,
    ).reduce(
      (acc, stage) => {
        acc[stage] = 0;
        return acc;
      },
      {} as Record<UserLifecycleStage, number>,
    );

    for (const user of users) {
      const currentStage = await this.getUserCurrentStage(user.id);
      stageCounts[currentStage]++;
    }

    return stageCounts;
  }

  /**
   * Get user journey analytics
   */
  async getUserJourneyAnalytics(
    userId: string,
  ): Promise<UserJourneyAnalytics | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) return null;

      const stageHistory = await this.getUserStageHistory(userId);
      const currentStage = await this.getUserCurrentStage(userId);
      const currentPhase = JOURNEY_PHASE_MAPPING[currentStage];

      // Calculate funnel steps
      const funnelSteps = await this.calculateFunnelSteps(stageHistory);

      // Calculate journey metrics
      const journeyStartDate = user.createdAt;
      const totalJourneyTime = Math.floor(
        (Date.now() - journeyStartDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Calculate phase transition times
      const phaseTransitionTimes =
        this.calculatePhaseTransitionTimes(stageHistory);

      // Calculate conversion rate
      const conversionRate = await this.calculateConversionRate(userId);

      return {
        userId,
        journeyStartDate,
        currentPhase,
        funnelSteps,
        conversionRate,
        totalJourneyTime,
        timeInCurrentPhase: stageHistory[0]?.daysInPreviousStage || 0,
        averagePhaseTransitionTime: phaseTransitionTimes,
        dropOffPoints: await this.getDropOffPoints(userId),
        completionRate: await this.calculateCompletionRate(userId),
        registrationCohort: `${journeyStartDate.getFullYear()}-${String(
          journeyStartDate.getMonth() + 1,
        ).padStart(2, "0")}`,
        cohortPerformance: await this.getCohortPerformance(userId),
      };
    } catch (error) {
      console.error("Error getting user journey analytics:", error);
      return null;
    }
  }

  /**
   * Generate churn prediction for user
   */
  async predictUserChurn(userId: string): Promise<ChurnPrediction | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          videoTasks: {
            where: { isVerified: true },
            orderBy: { createdAt: "desc" },
            take: 30,
          },
          referrals: { select: { id: true } },
          transactions: {
            where: { status: "COMPLETED" },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      if (!user) return null;

      // Calculate risk factors
      const riskFactors = await this.calculateRiskFactors(user);
      const churnProbability = await this.predictChurnProbability(userId);

      // Generate recommendations
      const recommendedActions =
        this.generateChurnPreventionActions(riskFactors);

      // Calculate confidence score
      const confidenceScore = this.calculatePredictionConfidence(riskFactors);

      // Estimate time to churn
      const timeToChurn = await this.estimateTimeToChurn(
        userId,
        churnProbability,
      );

      return {
        userId,
        churnProbability,
        riskFactors,
        recommendedActions,
        confidenceScore,
        predictionDate: new Date(),
        timeToChurn,
      };
    } catch (error) {
      console.error("Error predicting user churn:", error);
      return null;
    }
  }

  /**
   * Generate lifecycle report
   */
  async generateLifecycleReport(
    dateFrom: Date,
    dateTo: Date,
    filters: UserLifecycleFilters = {},
  ): Promise<UserLifecycleReport> {
    try {
      // Get all users in date range
      const whereClause = {
        ...this.buildUserWhereClause(filters),
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      };

      const [totalUsers, newUsers, activeUsers, churnedUsers] =
        await Promise.all([
          prisma.user.count({ where: whereClause }),
          prisma.user.count({
            where: {
              ...whereClause,
              createdAt: {
                gte: dateFrom,
                lte: dateTo,
              },
            },
          }),
          this.getActiveUsersCount(dateFrom, dateTo, filters),
          this.getChurnedUsersCount(dateFrom, dateTo, filters),
        ]);

      // Get distribution data
      const [stageDistribution, segmentAnalysis] = await Promise.all([
        this.getStageDistribution(filters),
        this.getSegmentAnalysisData(filters),
      ]);

      // Get funnel and cohort data
      const [journeyFunnel, cohortAnalysis] = await Promise.all([
        this.getJourneyFunnelAnalysis(dateFrom, dateTo, filters),
        this.getCohortAnalysisData(dateFrom, dateTo),
      ]);

      // Generate insights
      const insights = await this.generateLifecycleInsights(
        stageDistribution,
        segmentAnalysis,
        journeyFunnel,
      );

      return {
        reportId: `lifecycle_report_${Date.now()}`,
        generatedAt: new Date(),
        dateRange: { from: dateFrom, to: dateTo },
        overview: {
          totalUsers,
          newUsers,
          activeUsers,
          churnedUsers,
          reactivatedUsers: await this.getReactivatedUsersCount(
            dateFrom,
            dateTo,
          ),
        },
        stageDistribution,
        segmentAnalysis,
        journeyFunnel,
        cohortAnalysis,
        insights,
      };
    } catch (error) {
      console.error("Error generating lifecycle report:", error);
      throw error;
    }
  }

  /**
   * Track user lifecycle event
   */
  async trackLifecycleEvent(
    userId: string,
    event: UserLifecycleEvent,
    eventData: Record<string, any> = {},
    source: EventSource = EventSource.USER_ACTION,
    options: EventTrackingOptions = {},
  ): Promise<UserLifecycleApiResponse<void>> {
    try {
      await eventTracker.trackEvent(userId, event, eventData, source, options);

      return {
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };
    }
  }

  /**
   * Force stage transition for user
   */
  async forceStageTransition(
    userId: string,
    toStage: UserLifecycleStage,
    reason: string,
    adminId?: string,
  ): Promise<UserLifecycleApiResponse<UserStageTransition>> {
    try {
      const currentStage = await this.getUserCurrentStage(userId);

      // Create stage transition record
      const transition: UserStageTransition = {
        fromStage: currentStage,
        toStage,
        transitionDate: new Date(),
        triggerEvent: UserLifecycleEvent.MANUAL_BALANCE_ADJUSTMENT, // Using as generic admin action
        metadata: {
          reason,
          adminId,
          forced: true,
        },
      };

      // Store transition in activity log
      await prisma.activityLog.create({
        data: {
          userId,
          activity: "STAGE_TRANSITION",
          description: `Admin forced stage transition from ${currentStage} to ${toStage}: ${reason}`,
          metadata: JSON.stringify(transition),
          adminId,
        },
      });

      return {
        success: true,
        data: transition,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };
    }
  }

  /**
   * Private method to calculate user metrics
   */
  private async calculateUserMetrics(user: any): Promise<UserLifecycleMetrics> {
    // Get time-based metrics
    const firstLogin = await eventTracker.getUserFirstEvent(
      user.id,
      UserLifecycleEvent.FIRST_LOGIN,
    );
    const firstVideoTask = await eventTracker.getUserFirstEvent(
      user.id,
      UserLifecycleEvent.FIRST_VIDEO_WATCHED,
    );
    const firstEarning = await eventTracker.getUserFirstEvent(
      user.id,
      UserLifecycleEvent.FIRST_EARNING,
    );
    const firstReferral = await eventTracker.getUserFirstEvent(
      user.id,
      UserLifecycleEvent.FIRST_REFERRAL,
    );

    // Calculate time differences in hours/days
    const registrationTime = user.createdAt.getTime();

    const timeToFirstLogin = firstLogin
      ? Math.floor(
          (firstLogin.createdAt.getTime() - registrationTime) /
            (1000 * 60 * 60),
        )
      : undefined;

    const timeToFirstVideoTask = firstVideoTask
      ? Math.floor(
          (firstVideoTask.createdAt.getTime() - registrationTime) /
            (1000 * 60 * 60),
        )
      : undefined;

    const timeToFirstEarning = firstEarning
      ? Math.floor(
          (firstEarning.createdAt.getTime() - registrationTime) /
            (1000 * 60 * 60),
        )
      : undefined;

    const timeToFirstReferral = firstReferral
      ? Math.floor(
          (firstReferral.createdAt.getTime() - registrationTime) /
            (1000 * 60 * 60 * 24),
        )
      : undefined;

    // Calculate engagement metrics
    const totalVideoTasks = user.videoTasks?.length || 0;
    const totalEarnings = user.totalEarnings || 0;
    const totalReferrals = user.referrals?.length || 0;

    // Calculate daily average
    const daysSinceRegistration = Math.max(
      1,
      Math.floor((Date.now() - registrationTime) / (1000 * 60 * 60 * 24)),
    );
    const averageDailyTasks = totalVideoTasks / daysSinceRegistration;

    // Get activity streaks
    const { longestStreak, currentStreak } = await this.calculateStreaks(
      user.id,
    );

    // Get financial metrics
    const deposits =
      user.transactions?.filter((t: any) => t.type === "CREDIT") || [];
    const withdrawals =
      user.transactions?.filter((t: any) => t.type === "DEBIT") || [];

    const totalDeposits = deposits.reduce(
      (sum: number, t: any) => sum + t.amount,
      0,
    );
    const totalWithdrawals = withdrawals.reduce(
      (sum: number, t: any) => sum + t.amount,
      0,
    );

    // Get login metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalLogins = await prisma.activityLog.count({
      where: {
        userId: user.id,
        activity: UserLifecycleEvent.LOGIN,
      },
    });

    // Get milestones
    const milestones = await this.getUserMilestones(user.id);

    return {
      timeToFirstLogin,
      timeToFirstVideoTask,
      timeToFirstEarning,
      timeToFirstReferral,
      totalVideoTasks,
      totalEarnings,
      totalReferrals,
      averageDailyTasks,
      longestStreak,
      currentStreak,
      totalDeposits,
      totalWithdrawals,
      currentBalance: user.walletBalance || 0,
      lifetimeValue: totalEarnings,
      totalLogins,
      lastLoginDate: user.lastLoginAt,
      milestones,
    };
  }

  /**
   * Private method to get user's current stage
   */
  private async getUserCurrentStage(
    userId: string,
  ): Promise<UserLifecycleStage> {
    const latestTransition = await prisma.activityLog.findFirst({
      where: {
        userId,
        activity: "STAGE_TRANSITION",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        metadata: true,
      },
    });

    if (!latestTransition?.metadata) {
      return UserLifecycleStage.REGISTERED;
    }

    try {
      const metadata = JSON.parse(latestTransition.metadata);
      return metadata.toStage || UserLifecycleStage.REGISTERED;
    } catch {
      return UserLifecycleStage.REGISTERED;
    }
  }

  /**
   * Private method to get user's stage history
   */
  private async getUserStageHistory(
    userId: string,
  ): Promise<UserStageTransition[]> {
    const transitions = await prisma.activityLog.findMany({
      where: {
        userId,
        activity: "STAGE_TRANSITION",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        metadata: true,
        createdAt: true,
      },
    });

    return transitions
      .map((transition) => {
        try {
          const metadata = JSON.parse(transition.metadata || "{}");
          return {
            fromStage: metadata.fromStage || undefined,
            toStage: metadata.toStage,
            transitionDate: new Date(
              metadata.transitionDate || transition.createdAt,
            ),
            triggerEvent: metadata.triggerEvent,
            daysInPreviousStage: metadata.daysInPreviousStage,
            metadata: metadata.metadata,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as UserStageTransition[];
  }

  /**
   * Private method to calculate engagement score
   */
  private async calculateEngagementScore(user: any): Promise<number> {
    const weights = DEFAULT_LIFECYCLE_CONFIG.engagementScoreWeights;

    // Get recent activity data (30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentTaskCount, recentLoginCount] = await Promise.all([
      prisma.userVideoTask.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      prisma.activityLog.count({
        where: {
          userId: user.id,
          activity: UserLifecycleEvent.LOGIN,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
    ]);

    // Calculate component scores (0-100)
    const dailyTaskCompletion = Math.min((recentTaskCount / 30) * 100, 100);
    const loginFrequency = Math.min((recentLoginCount / 30) * 100, 100);
    const earningsGrowth =
      user.totalEarnings > 0 ? Math.min(user.totalEarnings / 10, 100) : 0;
    const referralActivity = Math.min((user.referrals?.length || 0) * 10, 100);

    // Calculate consistency bonus
    const { currentStreak } = await this.calculateStreaks(user.id);
    const consistencyBonus = Math.min(currentStreak * 5, 50);

    // Weighted average
    const score =
      dailyTaskCompletion * weights.dailyTaskCompletion +
      loginFrequency * weights.loginFrequency +
      earningsGrowth * weights.earningsGrowth +
      referralActivity * weights.referralActivity +
      consistencyBonus * weights.consistencyBonus;

    return Math.round(Math.min(score, 100));
  }

  /**
   * Private method to calculate risk score
   */
  private async calculateRiskScore(user: any): Promise<number> {
    const weights = DEFAULT_LIFECYCLE_CONFIG.riskScoreWeights;

    // Calculate inactivity penalty
    const daysSinceLastLogin = user.lastLoginAt
      ? Math.floor(
          (Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 999;

    const inactivityPenalty = Math.min((daysSinceLastLogin / 30) * 100, 100);

    // Calculate missed tasks penalty (tasks in last 7 days vs expected)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTasks = await prisma.userVideoTask.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    const expectedTasks = user.currentPosition?.tasksPerDay * 7 || 7;
    const missedTasksPenalty =
      Math.max(0, (expectedTasks - recentTasks) / expectedTasks) * 100;

    // Calculate other risk factors
    const negativeBalancePenalty =
      user.walletBalance < 0 ? Math.min(Math.abs(user.walletBalance), 100) : 0;

    // Weighted average
    const riskScore =
      inactivityPenalty * weights.inactivityPenalty +
      missedTasksPenalty * weights.missedTasksPenalty +
      negativeBalancePenalty * weights.negativeBalance;

    return Math.round(Math.min(riskScore, 100));
  }

  /**
   * Private method to determine user segment
   */
  private async determineUserSegment(
    user: any,
    currentStage: UserLifecycleStage,
    engagementScore: number,
  ): Promise<UserSegment> {
    const daysSinceRegistration = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    const daysSinceLastActivity = user.lastLoginAt
      ? Math.floor(
          (Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24),
        )
      : daysSinceRegistration;

    // Check each segment rule
    for (const [segment, rules] of Object.entries(SEGMENT_RULES)) {
      const segmentEnum = segment as UserSegment;
      const rule = rules as any;

      // Check stage requirements
      if (rule.stages && !rule.stages.includes(currentStage)) continue;

      // Check time-based requirements
      if (
        rule.maxDaysFromRegistration &&
        daysSinceRegistration > rule.maxDaysFromRegistration
      )
        continue;
      if (
        rule.maxDaysFromLastActivity &&
        daysSinceLastActivity > rule.maxDaysFromLastActivity
      )
        continue;

      // Check metric requirements
      if (rule.minEngagementScore && engagementScore < rule.minEngagementScore)
        continue;
      if (rule.maxEngagementScore && engagementScore > rule.maxEngagementScore)
        continue;
      if (rule.minLifetimeValue && user.totalEarnings < rule.minLifetimeValue)
        continue;
      if (
        rule.minReferrals &&
        (user.referrals?.length || 0) < rule.minReferrals
      )
        continue;
      if (
        rule.minVideoTasks &&
        (user.videoTasks?.length || 0) < rule.minVideoTasks
      )
        continue;

      return segmentEnum;
    }

    // Default segment
    return UserSegment.ACTIVE_USERS;
  }

  /**
   * Private method to calculate activity streaks
   */
  private async calculateStreaks(
    userId: string,
  ): Promise<{ longestStreak: number; currentStreak: number }> {
    // Get user's video task completion dates
    const tasks = await prisma.userVideoTask.findMany({
      where: {
        userId,
        isVerified: true,
      },
      select: {
        watchedAt: true,
      },
      orderBy: {
        watchedAt: "asc",
      },
    });

    if (tasks.length === 0) {
      return { longestStreak: 0, currentStreak: 0 };
    }

    // Group tasks by date
    const taskDates = tasks.map((task) => {
      const date = new Date(task.watchedAt);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    });

    const uniqueDates = [...new Set(taskDates)].sort();

    // Calculate streaks
    let longestStreak = 0;
    let currentStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const dayDiff = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate current streak
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
      // Calculate current streak from the end
      for (let i = uniqueDates.length - 1; i >= 0; i--) {
        const date = new Date(uniqueDates[i]);
        const dayDiff = Math.floor(
          (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (dayDiff <= currentStreak + 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return { longestStreak, currentStreak };
  }

  /**
   * Private method to get user milestones
   */
  private async getUserMilestones(userId: string): Promise<UserMilestone[]> {
    // This would check against MILESTONE_DEFINITIONS and return achieved milestones
    // For now, return empty array - can be implemented based on specific requirements
    return [];
  }

  /**
   * Private method to predict churn probability
   */
  private async predictChurnProbability(userId: string): Promise<number> {
    // Simple churn prediction based on activity patterns
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        lastLoginAt: true,
        totalEarnings: true,
      },
    });

    if (!user) return 1.0; // 100% churn if user not found

    const daysSinceLastLogin = user.lastLoginAt
      ? Math.floor(
          (Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 999;

    // Simple scoring: more days inactive = higher churn probability
    if (daysSinceLastLogin > 30) return 0.9;
    if (daysSinceLastLogin > 14) return 0.7;
    if (daysSinceLastLogin > 7) return 0.4;
    if (daysSinceLastLogin > 3) return 0.2;
    return 0.1;
  }

  /**
   * Private method to predict next stage timeline
   */
  private async predictNextStageTimeline(
    currentStage: UserLifecycleStage,
    user: any,
  ): Promise<number | undefined> {
    // Simple prediction based on current stage and user activity
    const activityLevel = user.videoTasks?.length || 0;

    switch (currentStage) {
      case UserLifecycleStage.REGISTERED:
        return 1; // 1 day to complete profile
      case UserLifecycleStage.PROFILE_INCOMPLETE:
        return 2; // 2 days to complete profile
      case UserLifecycleStage.PROFILE_COMPLETE:
        return 1; // 1 day for first login
      case UserLifecycleStage.FIRST_LOGIN:
        return 3; // 3 days for first video task
      case UserLifecycleStage.FIRST_VIDEO_TASK:
        return 5; // 5 days for regular user status
      case UserLifecycleStage.REGULAR_USER:
        return activityLevel > 10 ? 7 : 14; // 1-2 weeks to next stage based on activity
      default:
        return undefined;
    }
  }

  /**
   * Private method to predict lifetime value
   */
  private async predictLifetimeValue(
    userId: string,
  ): Promise<LifetimeValuePrediction> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalEarnings: true,
        createdAt: true,
        videoTasks: {
          where: { isVerified: true },
          select: { rewardEarned: true },
        },
      },
    });

    const currentLTV = user?.totalEarnings || 0;
    const daysSinceRegistration = user
      ? Math.floor(
          (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 1;

    // Simple prediction: current daily average * 365
    const dailyAverage = currentLTV / Math.max(daysSinceRegistration, 1);
    const predictedLTV = dailyAverage * 365;

    return {
      userId,
      predictedLTV: Math.max(predictedLTV, currentLTV * 1.5), // At least 50% growth
      currentLTV,
      potentialUpside: Math.max(0, predictedLTV - currentLTV),
      confidenceInterval: {
        lower: predictedLTV * 0.7,
        upper: predictedLTV * 1.3,
      },
      keyDrivers: [
        "Task completion rate",
        "Referral activity",
        "Engagement consistency",
      ],
      predictionHorizon: 365,
    };
  }

  /**
   * Private method to build user where clause from filters
   */
  private buildUserWhereClause(filters: UserLifecycleFilters): any {
    const where: any = {};

    if (filters.searchTerm) {
      where.OR = [
        { name: { contains: filters.searchTerm, mode: "insensitive" } },
        { email: { contains: filters.searchTerm, mode: "insensitive" } },
        { phone: { contains: filters.searchTerm, mode: "insensitive" } },
      ];
    }

    if (filters.registrationDateFrom || filters.registrationDateTo) {
      where.createdAt = {};
      if (filters.registrationDateFrom)
        where.createdAt.gte = filters.registrationDateFrom;
      if (filters.registrationDateTo)
        where.createdAt.lte = filters.registrationDateTo;
    }

    if (filters.lastActivityFrom || filters.lastActivityTo) {
      where.lastLoginAt = {};
      if (filters.lastActivityFrom)
        where.lastLoginAt.gte = filters.lastActivityFrom;
      if (filters.lastActivityTo)
        where.lastLoginAt.lte = filters.lastActivityTo;
    }

    if (filters.lifetimeValueMin !== undefined) {
      where.totalEarnings = {
        ...where.totalEarnings,
        gte: filters.lifetimeValueMin,
      };
    }

    if (filters.lifetimeValueMax !== undefined) {
      where.totalEarnings = {
        ...where.totalEarnings,
        lte: filters.lifetimeValueMax,
      };
    }

    if (filters.hasReferrals !== undefined) {
      if (filters.hasReferrals) {
        where.referrals = { some: {} };
      } else {
        where.referrals = { none: {} };
      }
    }

    if (filters.positionLevels && filters.positionLevels.length > 0) {
      where.currentPosition = {
        id: { in: filters.positionLevels },
      };
    }

    return where;
  }

  /**
   * Private helper methods for report generation
   */
  private async getActiveUsersCount(
    dateFrom: Date,
    dateTo: Date,
    filters: UserLifecycleFilters,
  ): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return prisma.user.count({
      where: {
        ...this.buildUserWhereClause(filters),
        lastLoginAt: {
          gte: sevenDaysAgo,
        },
      },
    });
  }

  private async getChurnedUsersCount(
    dateFrom: Date,
    dateTo: Date,
    filters: UserLifecycleFilters,
  ): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return prisma.user.count({
      where: {
        ...this.buildUserWhereClause(filters),
        lastLoginAt: {
          lt: thirtyDaysAgo,
        },
      },
    });
  }

  private async getReactivatedUsersCount(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<number> {
    // Count users who returned after being inactive for 14+ days
    return prisma.activityLog
      .groupBy({
        by: ["userId"],
        where: {
          activity: UserLifecycleEvent.RETURNED_AFTER_INACTIVITY,
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      })
      .then((result) => result.length);
  }

  // Placeholder methods for complex analytics
  private async getSegmentAnalysisData(
    filters: UserLifecycleFilters,
  ): Promise<any> {
    // Implementation would analyze each segment's performance
    return {};
  }

  private async getJourneyFunnelAnalysis(
    dateFrom: Date,
    dateTo: Date,
    filters: UserLifecycleFilters,
  ): Promise<any> {
    // Implementation would analyze the user journey funnel
    return {
      phases: [],
      overallConversionRate: 0,
      averageJourneyTime: 0,
      dropOffPoints: [],
    };
  }

  private async getCohortAnalysisData(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<any[]> {
    // Implementation would perform cohort analysis
    return [];
  }

  private async generateLifecycleInsights(
    stageDistribution: any,
    segmentAnalysis: any,
    journeyFunnel: any,
  ): Promise<any[]> {
    // Implementation would generate actionable insights
    return [];
  }

  // Additional helper methods
  private async calculateFunnelSteps(
    stageHistory: UserStageTransition[],
  ): Promise<any[]> {
    return [];
  }

  private calculatePhaseTransitionTimes(
    stageHistory: UserStageTransition[],
  ): Record<UserJourneyPhase, number> {
    return {} as Record<UserJourneyPhase, number>;
  }

  private async calculateConversionRate(userId: string): Promise<number> {
    return 0;
  }

  private async getDropOffPoints(userId: string): Promise<any[]> {
    return [];
  }

  private async calculateCompletionRate(userId: string): Promise<number> {
    return 0;
  }

  private async getCohortPerformance(userId: string): Promise<any> {
    return {};
  }

  private async calculateRiskFactors(user: any): Promise<any[]> {
    return [];
  }

  private generateChurnPreventionActions(riskFactors: any[]): string[] {
    return [];
  }

  private calculatePredictionConfidence(riskFactors: any[]): number {
    return 0.8;
  }

  private async estimateTimeToChurn(
    userId: string,
    churnProbability: number,
  ): Promise<number | undefined> {
    // Estimate based on churn probability
    if (churnProbability > 0.8) return 7; // 7 days
    if (churnProbability > 0.6) return 14; // 14 days
    if (churnProbability > 0.4) return 30; // 30 days
    return undefined;
  }
}

// Export singleton instance
export const userLifecycleService = UserLifecycleService.getInstance();
