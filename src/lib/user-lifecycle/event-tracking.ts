import { db as prisma } from "@/lib/db";
import {
  UserLifecycleEvent,
  UserLifecycleStage,
  EventSource,
  UserEventContext,
  UserEventMetadata,
  UserStageTransition,
} from "./types";
import { DEFAULT_LIFECYCLE_CONFIG } from "./config";

export interface EventTrackingOptions {
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  adminId?: string;
  metadata?: Record<string, any>;
  skipStageTransition?: boolean;
}

export class UserLifecycleEventTracker {
  private static instance: UserLifecycleEventTracker;

  public static getInstance(): UserLifecycleEventTracker {
    if (!UserLifecycleEventTracker.instance) {
      UserLifecycleEventTracker.instance = new UserLifecycleEventTracker();
    }
    return UserLifecycleEventTracker.instance;
  }

  /**
   * Track a user lifecycle event
   */
  async trackEvent(
    userId: string,
    event: UserLifecycleEvent,
    eventData: Record<string, any> = {},
    source: EventSource = EventSource.USER_ACTION,
    options: EventTrackingOptions = {},
  ): Promise<void> {
    try {
      // Create event context
      const context: UserEventContext = {
        sessionId: options.sessionId || this.generateSessionId(),
        deviceId: options.deviceId,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      };

      // Create event metadata
      const metadata: UserEventMetadata = {
        version: "1.0",
        source,
        context,
        customProperties: options.metadata,
      };

      // Store event in activity log
      await prisma.activityLog.create({
        data: {
          userId,
          activity: event,
          description: this.getEventDescription(event, eventData),
          metadata: JSON.stringify({
            eventData,
            ...metadata,
          }),
          ipAddress: options.ipAddress,
          sessionId: context.sessionId,
          userAgent: options.userAgent,
        },
      });

      // Check for stage transitions if not skipped
      if (!options.skipStageTransition) {
        await this.checkStageTransition(userId, event, eventData);
      }

      // Check for milestone achievements
      await this.checkMilestones(userId, event, eventData);

      console.log(`Event tracked: ${event} for user ${userId}`, {
        event,
        userId,
        source,
        context,
      });
    } catch (error) {
      console.error("Failed to track lifecycle event:", error);
      // Log system error
      await prisma.systemLog.create({
        data: {
          level: "ERROR",
          component: "UserLifecycleEventTracker",
          message: `Failed to track event ${event} for user ${userId}`,
          error: error instanceof Error ? error.message : String(error),
          metadata: JSON.stringify({ userId, event, eventData, source }),
          userId,
        },
      });
    }
  }

  /**
   * Track multiple events in batch
   */
  async trackEvents(
    events: Array<{
      userId: string;
      event: UserLifecycleEvent;
      eventData?: Record<string, any>;
      source?: EventSource;
      options?: EventTrackingOptions;
    }>,
  ): Promise<void> {
    const promises = events.map((eventItem) =>
      this.trackEvent(
        eventItem.userId,
        eventItem.event,
        eventItem.eventData || {},
        eventItem.source || EventSource.USER_ACTION,
        eventItem.options || {},
      ),
    );

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error("Failed to track batch events:", error);
    }
  }

  /**
   * Get user's event history
   */
  async getUserEventHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      eventTypes?: UserLifecycleEvent[];
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
  ): Promise<{
    events: Array<{
      id: string;
      activity: string;
      description: string;
      metadata: any;
      createdAt: Date;
      ipAddress?: string;
      sessionId?: string;
    }>;
    total: number;
  }> {
    const { limit = 50, offset = 0, eventTypes, dateFrom, dateTo } = options;

    const whereClause: any = {
      userId,
    };

    if (eventTypes && eventTypes.length > 0) {
      whereClause.activity = {
        in: eventTypes,
      };
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = dateFrom;
      if (dateTo) whereClause.createdAt.lte = dateTo;
    }

    const [events, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          activity: true,
          description: true,
          metadata: true,
          createdAt: true,
          ipAddress: true,
          sessionId: true,
        },
      }),
      prisma.activityLog.count({ where: whereClause }),
    ]);

    return {
      events: events.map((event) => ({
        ...event,
        metadata: event.metadata ? JSON.parse(event.metadata) : null,
        ipAddress: event.ipAddress ?? undefined,
        sessionId: event.sessionId ?? undefined,
      })),
      total,
    };
  }

  /**
   * Get event counts for user
   */
  async getUserEventCounts(
    userId: string,
    eventTypes?: UserLifecycleEvent[],
    timeWindow?: { from: Date; to: Date },
  ): Promise<Record<string, number>> {
    const whereClause: any = {
      userId,
    };

    if (eventTypes && eventTypes.length > 0) {
      whereClause.activity = {
        in: eventTypes,
      };
    }

    if (timeWindow) {
      whereClause.createdAt = {
        gte: timeWindow.from,
        lte: timeWindow.to,
      };
    }

    const eventCounts = await prisma.activityLog.groupBy({
      by: ["activity"],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    return eventCounts.reduce(
      (acc, item) => {
        acc[item.activity] = item._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Check if user has triggered specific event
   */
  async hasUserTriggeredEvent(
    userId: string,
    event: UserLifecycleEvent,
    timeWindow?: { from: Date; to: Date },
  ): Promise<boolean> {
    const whereClause: any = {
      userId,
      activity: event,
    };

    if (timeWindow) {
      whereClause.createdAt = {
        gte: timeWindow.from,
        lte: timeWindow.to,
      };
    }

    const count = await prisma.activityLog.count({
      where: whereClause,
    });

    return count > 0;
  }

  /**
   * Get user's first event of a specific type
   */
  async getUserFirstEvent(
    userId: string,
    event: UserLifecycleEvent,
  ): Promise<{
    id: string;
    createdAt: Date;
    metadata: any;
  } | null> {
    const eventRecord = await prisma.activityLog.findFirst({
      where: {
        userId,
        activity: event,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        createdAt: true,
        metadata: true,
      },
    });

    if (!eventRecord) return null;

    return {
      ...eventRecord,
      metadata: eventRecord.metadata ? JSON.parse(eventRecord.metadata) : null,
    };
  }

  /**
   * Get aggregated event analytics
   */
  async getEventAnalytics(
    dateFrom: Date,
    dateTo: Date,
    filters?: {
      userIds?: string[];
      eventTypes?: UserLifecycleEvent[];
    },
  ): Promise<{
    totalEvents: number;
    uniqueUsers: number;
    eventBreakdown: Record<string, number>;
    dailyEvents: Array<{
      date: string;
      count: number;
    }>;
    topUsers: Array<{
      userId: string;
      eventCount: number;
    }>;
  }> {
    const whereClause: any = {
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    };

    if (filters?.userIds && filters.userIds.length > 0) {
      whereClause.userId = {
        in: filters.userIds,
      };
    }

    if (filters?.eventTypes && filters.eventTypes.length > 0) {
      whereClause.activity = {
        in: filters.eventTypes,
      };
    }

    const [totalEvents, uniqueUsers, eventBreakdown, dailyEvents, topUsers] =
      await Promise.all([
        // Total events
        prisma.activityLog.count({ where: whereClause }),

        // Unique users
        prisma.activityLog
          .groupBy({
            by: ["userId"],
            where: whereClause,
          })
          .then((result) => result.length),

        // Event breakdown
        prisma.activityLog
          .groupBy({
            by: ["activity"],
            where: whereClause,
            _count: {
              id: true,
            },
          })
          .then((result) =>
            result.reduce(
              (acc, item) => {
                acc[item.activity] = item._count.id;
                return acc;
              },
              {} as Record<string, number>,
            ),
          ),

        // Daily events
        prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT
          DATE(created_at) as date,
          COUNT(*)::int as count
        FROM activity_logs
        WHERE created_at >= ${dateFrom} AND created_at <= ${dateTo}
        ${filters?.userIds ? `AND user_id = ANY(${filters.userIds})` : ""}
        ${filters?.eventTypes ? `AND activity = ANY(${filters.eventTypes})` : ""}
        GROUP BY DATE(created_at)
        ORDER BY date
      `,

        // Top users by event count
        prisma.activityLog
          .groupBy({
            by: ["userId"],
            where: whereClause,
            _count: {
              id: true,
            },
            orderBy: {
              _count: {
                id: "desc",
              },
            },
            take: 10,
          })
          .then((result) =>
            result.map((item) => ({
              userId: item.userId || "",
              eventCount: item._count.id,
            })),
          ),
      ]);

    return {
      totalEvents,
      uniqueUsers,
      eventBreakdown,
      dailyEvents,
      topUsers,
    };
  }

  /**
   * Private method to check for stage transitions
   */
  private async checkStageTransition(
    userId: string,
    event: UserLifecycleEvent,
    eventData: Record<string, any>,
  ): Promise<void> {
    try {
      // Get current user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
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

      if (!user) return;

      // Get user's current lifecycle stage from metadata or calculate
      const currentStage = await this.getUserCurrentStage(userId);

      // Check transition rules
      const applicableRules = DEFAULT_LIFECYCLE_CONFIG.stageTransitionRules
        .filter(
          (rule) => rule.fromStage === currentStage || rule.fromStage === null,
        )
        .sort((a, b) => a.priority - b.priority);

      for (const rule of applicableRules) {
        if (
          await this.evaluateTransitionConditions(
            rule.conditions,
            user,
            event,
            eventData,
          )
        ) {
          await this.executeStageTransition(
            userId,
            currentStage,
            rule.toStage,
            event,
          );
          break; // Only execute first matching rule
        }
      }
    } catch (error) {
      console.error("Failed to check stage transition:", error);
    }
  }

  /**
   * Private method to evaluate transition conditions
   */
  private async evaluateTransitionConditions(
    conditions: any[],
    user: any,
    event: UserLifecycleEvent,
    eventData: Record<string, any>,
  ): Promise<boolean> {
    for (const condition of conditions) {
      if (!(await this.evaluateCondition(condition, user, event, eventData))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Private method to evaluate a single condition
   */
  private async evaluateCondition(
    condition: any,
    user: any,
    event: UserLifecycleEvent,
    eventData: Record<string, any>,
  ): Promise<boolean> {
    switch (condition.type) {
      case "EVENT_COUNT":
        const eventCount = await this.getUserEventCounts(user.id, [
          condition.field,
        ]);
        return this.compareValues(
          eventCount[condition.field] || 0,
          condition.operator,
          condition.value,
        );

      case "USER_PROPERTY":
        const userValue = this.getNestedProperty(user, condition.field);
        return this.compareValues(
          userValue,
          condition.operator,
          condition.value,
        );

      case "TIME_BASED":
        const timeValue = this.getNestedProperty(user, condition.field);
        if (!timeValue) return condition.operator === "NOT_EXISTS";
        const daysDiff = Math.floor(
          (Date.now() - new Date(timeValue).getTime()) / (1000 * 60 * 60 * 24),
        );
        return this.compareValues(
          daysDiff,
          condition.operator,
          condition.value,
        );

      case "CALCULATED_METRIC":
        const metricValue = await this.calculateMetric(condition.field, user);
        return this.compareValues(
          metricValue,
          condition.operator,
          condition.value,
        );

      default:
        return false;
    }
  }

  /**
   * Private method to compare values based on operator
   */
  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case "EQUALS":
        return actual === expected;
      case "GREATER_THAN":
        return actual > expected;
      case "LESS_THAN":
        return actual < expected;
      case "GREATER_EQUAL":
        return actual >= expected;
      case "LESS_EQUAL":
        return actual <= expected;
      case "IN":
        return Array.isArray(expected) && expected.includes(actual);
      case "NOT_IN":
        return Array.isArray(expected) && !expected.includes(actual);
      case "EXISTS":
        return actual !== null && actual !== undefined;
      case "NOT_EXISTS":
        return actual === null || actual === undefined;
      default:
        return false;
    }
  }

  /**
   * Private method to get nested property from object
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  /**
   * Private method to calculate metrics
   */
  private async calculateMetric(metric: string, user: any): Promise<number> {
    switch (metric) {
      case "totalVideoTasks":
        return user.videoTasks?.length || 0;
      case "totalReferrals":
        return user.referrals?.length || 0;
      case "totalEarnings":
        return user.totalEarnings || 0;
      case "engagementScore":
        return await this.calculateEngagementScore(user);
      default:
        return 0;
    }
  }

  /**
   * Private method to calculate engagement score
   */
  private async calculateEngagementScore(user: any): Promise<number> {
    const weights = DEFAULT_LIFECYCLE_CONFIG.engagementScoreWeights;

    // Get recent activity data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTaskCount = await prisma.userVideoTask.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const recentLoginCount = await prisma.activityLog.count({
      where: {
        userId: user.id,
        activity: UserLifecycleEvent.LOGIN,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Calculate component scores (0-100)
    const dailyTaskCompletion = Math.min((recentTaskCount / 30) * 100, 100);
    const loginFrequency = Math.min((recentLoginCount / 30) * 100, 100);
    const earningsGrowth =
      user.totalEarnings > 0 ? Math.min(user.totalEarnings / 10, 100) : 0;
    const referralActivity = Math.min((user.referrals?.length || 0) * 10, 100);

    // Weighted average
    const score =
      dailyTaskCompletion * weights.dailyTaskCompletion +
      loginFrequency * weights.loginFrequency +
      earningsGrowth * weights.earningsGrowth +
      referralActivity * weights.referralActivity;

    return Math.round(Math.min(score, 100));
  }

  /**
   * Private method to execute stage transition
   */
  private async executeStageTransition(
    userId: string,
    fromStage: UserLifecycleStage | null,
    toStage: UserLifecycleStage,
    triggerEvent: UserLifecycleEvent,
  ): Promise<void> {
    try {
      // Store stage transition in activity log
      await prisma.activityLog.create({
        data: {
          userId,
          activity: "STAGE_TRANSITION",
          description: `User transitioned from ${fromStage} to ${toStage}`,
          metadata: JSON.stringify({
            fromStage,
            toStage,
            triggerEvent,
            transitionDate: new Date(),
          }),
        },
      });

      console.log(
        `Stage transition: User ${userId} moved from ${fromStage} to ${toStage}`,
      );
    } catch (error) {
      console.error("Failed to execute stage transition:", error);
    }
  }

  /**
   * Private method to get user's current stage
   */
  private async getUserCurrentStage(
    userId: string,
  ): Promise<UserLifecycleStage | null> {
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
      return UserLifecycleStage.REGISTERED; // Default for new users
    }

    try {
      const metadata = JSON.parse(latestTransition.metadata);
      return metadata.toStage || UserLifecycleStage.REGISTERED;
    } catch {
      return UserLifecycleStage.REGISTERED;
    }
  }

  /**
   * Private method to check milestone achievements
   */
  private async checkMilestones(
    userId: string,
    event: UserLifecycleEvent,
    eventData: Record<string, any>,
  ): Promise<void> {
    // Implementation for milestone checking
    // This would check against MILESTONE_DEFINITIONS from config
    // and create milestone achievement records
  }

  /**
   * Private method to generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private method to get event description
   */
  private getEventDescription(
    event: UserLifecycleEvent,
    eventData: Record<string, any>,
  ): string {
    const descriptions: Record<UserLifecycleEvent, string> = {
      [UserLifecycleEvent.USER_REGISTERED]: "User registered for the platform",
      [UserLifecycleEvent.EMAIL_VERIFIED]: "User verified their email address",
      [UserLifecycleEvent.PHONE_VERIFIED]: "User verified their phone number",
      [UserLifecycleEvent.PROFILE_UPDATED]:
        "User updated their profile information",
      [UserLifecycleEvent.PROFILE_COMPLETED]:
        "User completed their profile setup",
      [UserLifecycleEvent.BANK_CARD_ADDED]: "User added a bank card",
      [UserLifecycleEvent.FIRST_LOGIN]: "User logged in for the first time",
      [UserLifecycleEvent.LOGIN]: "User logged into the platform",
      [UserLifecycleEvent.LOGOUT]: "User logged out of the platform",
      [UserLifecycleEvent.PASSWORD_CHANGED]: "User changed their password",
      [UserLifecycleEvent.FIRST_VIDEO_WATCHED]:
        "User watched their first video",
      [UserLifecycleEvent.VIDEO_TASK_COMPLETED]: "User completed a video task",
      [UserLifecycleEvent.DAILY_TASK_GOAL_ACHIEVED]:
        "User achieved their daily task goal",
      [UserLifecycleEvent.WEEKLY_TASK_GOAL_ACHIEVED]:
        "User achieved their weekly task goal",
      [UserLifecycleEvent.FIRST_EARNING]: "User earned their first reward",
      [UserLifecycleEvent.MILESTONE_EARNING]:
        "User reached an earnings milestone",
      [UserLifecycleEvent.FIRST_WITHDRAWAL]: "User made their first withdrawal",
      [UserLifecycleEvent.WITHDRAWAL_COMPLETED]: "User completed a withdrawal",
      [UserLifecycleEvent.DEPOSIT_MADE]: "User made a deposit",
      [UserLifecycleEvent.POSITION_UPGRADED]:
        "User upgraded their position level",
      [UserLifecycleEvent.POSITION_DOWNGRADED]:
        "User was downgraded to a lower position",
      [UserLifecycleEvent.INTERN_TO_PAID]:
        "User upgraded from intern to paid position",
      [UserLifecycleEvent.FIRST_REFERRAL]: "User made their first referral",
      [UserLifecycleEvent.REFERRAL_MILESTONE]:
        "User reached a referral milestone",
      [UserLifecycleEvent.REFERRAL_REWARD_EARNED]:
        "User earned a referral reward",
      [UserLifecycleEvent.STREAK_STARTED]:
        "User started a task completion streak",
      [UserLifecycleEvent.STREAK_BROKEN]:
        "User's task completion streak was broken",
      [UserLifecycleEvent.STREAK_MILESTONE]: "User reached a streak milestone",
      [UserLifecycleEvent.MISSED_DAILY_TARGET]:
        "User missed their daily task target",
      [UserLifecycleEvent.LONG_INACTIVITY]:
        "User has been inactive for an extended period",
      [UserLifecycleEvent.MULTIPLE_LOGIN_FAILURES]:
        "User had multiple failed login attempts",
      [UserLifecycleEvent.RETURNED_AFTER_INACTIVITY]:
        "User returned after a period of inactivity",
      [UserLifecycleEvent.RE_ENGAGEMENT_CAMPAIGN_OPENED]:
        "User opened a re-engagement campaign",
      [UserLifecycleEvent.ACCOUNT_SUSPENDED]: "User account was suspended",
      [UserLifecycleEvent.ACCOUNT_REACTIVATED]: "User account was reactivated",
      [UserLifecycleEvent.MANUAL_BALANCE_ADJUSTMENT]:
        "Admin made a manual balance adjustment",
    };

    let description = descriptions[event] || `User triggered event: ${event}`;

    // Add context from event data if available
    if (eventData.amount) {
      description += ` (Amount: ${eventData.amount})`;
    }
    if (eventData.videoTitle) {
      description += ` (Video: ${eventData.videoTitle})`;
    }
    if (eventData.referralCode) {
      description += ` (Referral: ${eventData.referralCode})`;
    }

    return description;
  }
}

// Export singleton instance
export const eventTracker = UserLifecycleEventTracker.getInstance();

// Export convenience functions
export const trackUserEvent = (
  userId: string,
  event: UserLifecycleEvent,
  eventData?: Record<string, any>,
  source?: EventSource,
  options?: EventTrackingOptions,
) => {
  return eventTracker.trackEvent(userId, event, eventData, source, options);
};

export const getUserEventHistory = (
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    eventTypes?: UserLifecycleEvent[];
    dateFrom?: Date;
    dateTo?: Date;
  },
) => {
  return eventTracker.getUserEventHistory(userId, options);
};
