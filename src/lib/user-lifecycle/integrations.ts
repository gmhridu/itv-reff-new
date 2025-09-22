import { eventTracker } from "./event-tracking";
import { userLifecycleService } from "./service";
import {
  UserLifecycleEvent,
  EventSource,
  UserLifecycleStage,
} from "./types";
import { db as prisma } from "@/lib/db";

/**
 * Integration hooks for connecting lifecycle tracking with existing user actions
 * These functions should be called from your existing services when user actions occur
 */

export class LifecycleIntegrations {
  /**
   * Hook for user registration
   */
  static async onUserRegistered(
    userId: string,
    eventData: {
      email?: string;
      phone?: string;
      referralCode?: string;
      registrationSource?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    try {
      await eventTracker.trackEvent(
        userId,
        UserLifecycleEvent.USER_REGISTERED,
        eventData,
        EventSource.USER_ACTION,
        {
          ipAddress: eventData.ipAddress,
          userAgent: eventData.userAgent,
        }
      );

      // Initialize user lifecycle data
      await userLifecycleService.getUserLifecycleData(userId);

      console.log("User registration lifecycle tracking completed", { userId });
    } catch (error) {
      console.error("Failed to track user registration:", error);
    }
  }

  /**
   * Hook for email verification
   */
  static async onEmailVerified(userId: string, email: string) {
    try {
      await eventTracker.trackEvent(
        userId,
        UserLifecycleEvent.EMAIL_VERIFIED,
        { email },
        EventSource.USER_ACTION
      );
    } catch (error) {
      console.error("Failed to track email verification:", error);
    }
  }

  /**
   * Hook for phone verification
   */
  static async onPhoneVerified(userId: string, phone: string) {
    try {
      await eventTracker.trackEvent(
        userId,
        UserLifecycleEvent.PHONE_VERIFIED,
        { phone },
        EventSource.USER_ACTION
      );
    } catch (error) {
      console.error("Failed to track phone verification:", error);
    }
  }

  /**
   * Hook for profile updates
   */
  static async onProfileUpdated(
    userId: string,
    updatedFields: Record<string, any>,
    isComplete: boolean = false
  ) {
    try {
      const event = isComplete
        ? UserLifecycleEvent.PROFILE_COMPLETED
        : UserLifecycleEvent.PROFILE_UPDATED;

      await eventTracker.trackEvent(
        userId,
        event,
        {
          updatedFields: Object.keys(updatedFields),
          isComplete,
          ...updatedFields,
        },
        EventSource.USER_ACTION
      );
    } catch (error) {
      console.error("Failed to track profile update:", error);
    }
  }

  /**
   * Hook for bank card addition
   */
  static async onBankCardAdded(
    userId: string,
    cardData: {
      bankName: string;
      cardId: string;
    }
  ) {
    try {
      await eventTracker.trackEvent(
        userId,
        UserLifecycleEvent.BANK_CARD_ADDED,
        cardData,
        EventSource.USER_ACTION
      );
    } catch (error) {
      console.error("Failed to track bank card addition:", error);
    }
  }

  /**
   * Hook for user login
   */
  static async onUserLogin(
    userId: string,
    loginData: {
      isFirstLogin?: boolean;
      loginMethod?: string;
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
    }
  ) {
    try {
      const event = loginData.isFirstLogin
        ? UserLifecycleEvent.FIRST_LOGIN
        : UserLifecycleEvent.LOGIN;

      await eventTracker.trackEvent(
        userId,
        event,
        {
          loginMethod: loginData.loginMethod || "standard",
          deviceId: loginData.deviceId,
        },
        EventSource.USER_ACTION,
        {
          ipAddress: loginData.ipAddress,
          userAgent: loginData.userAgent,
          deviceId: loginData.deviceId,
        }
      );

      // Check if user returned after inactivity
      await this.checkInactivityReturn(userId);
    } catch (error) {
      console.error("Failed to track user login:", error);
    }
  }

  /**
   * Hook for user logout
   */
  static async onUserLogout(userId: string) {
    try {
      await eventTracker.trackEvent(
        userId,
        UserLifecycleEvent.LOGOUT,
        {},
        EventSource.USER_ACTION
      );
    } catch (error) {
      console.error("Failed to track user logout:", error);
    }
  }

  /**
   * Hook for video task completion
   */
  static async onVideoTaskCompleted(
    userId: string,
    taskData: {
      videoId: string;
      videoTitle?: string;
      rewardEarned: number;
      watchDuration: number;
      positionLevel?: string;
      isFirstVideo?: boolean;
    }
  ) {
    try {
      const event = taskData.isFirstVideo
        ? UserLifecycleEvent.FIRST_VIDEO_WATCHED
        : UserLifecycleEvent.VIDEO_TASK_COMPLETED;

      await eventTracker.trackEvent(
        userId,
        event,
        taskData,
        EventSource.USER_ACTION
      );

      // Check for daily/weekly goal achievements
      await this.checkTaskGoals(userId);

      // Check for streak milestones
      await this.checkStreakMilestones(userId);
    } catch (error) {
      console.error("Failed to track video task completion:", error);
    }
  }

  /**
   * Hook for earning events
   */
  static async onEarningReceived(
    userId: string,
    earningData: {
      amount: number;
      source: string;
      transactionId: string;
      isFirstEarning?: boolean;
    }
  ) {
    try {
      const event = earningData.isFirstEarning
        ? UserLifecycleEvent.FIRST_EARNING
        : UserLifecycleEvent.MILESTONE_EARNING;

      await eventTracker.trackEvent(
        userId,
        event,
        earningData,
        EventSource.SYSTEM_TRIGGER
      );

      // Check for earning milestones
      await this.checkEarningMilestones(userId, earningData.amount);
    } catch (error) {
      console.error("Failed to track earning received:", error);
    }
  }

  /**
   * Hook for withdrawal events
   */
  static async onWithdrawalRequested(
    userId: string,
    withdrawalData: {
      amount: number;
      withdrawalId: string;
      bankCardId: string;
      isFirstWithdrawal?: boolean;
    }
  ) {
    try {
      const event = withdrawalData.isFirstWithdrawal
        ? UserLifecycleEvent.FIRST_WITHDRAWAL
        : UserLifecycleEvent.WITHDRAWAL_COMPLETED;

      await eventTracker.trackEvent(
        userId,
        event,
        withdrawalData,
        EventSource.USER_ACTION
      );
    } catch (error) {
      console.error("Failed to track withdrawal request:", error);
    }
  }

  /**
   * Hook for deposit events
   */
  static async onDepositMade(
    userId: string,
    depositData: {
      amount: number;
      depositId: string;
      paymentMethod: string;
    }
  ) {
    try {
      await eventTracker.trackEvent(
        userId,
        UserLifecycleEvent.DEPOSIT_MADE,
        depositData,
        EventSource.USER_ACTION
      );
    } catch (error) {
      console.error("Failed to track deposit made:", error);
    }
  }

  /**
   * Hook for position upgrades
   */
  static async onPositionUpgraded(
    userId: string,
    positionData: {
      fromPosition?: string;
      toPosition: string;
      fromIntern?: boolean;
      depositAmount?: number;
    }
  ) {
    try {
      const event = positionData.fromIntern
        ? UserLifecycleEvent.INTERN_TO_PAID
        : UserLifecycleEvent.POSITION_UPGRADED;

      await eventTracker.trackEvent(
        userId,
        event,
        positionData,
        EventSource.USER_ACTION
      );
    } catch (error) {
      console.error("Failed to track position upgrade:", error);
    }
  }

  /**
   * Hook for referral events
   */
  static async onReferralMade(
    userId: string,
    referralData: {
      referredUserId: string;
      referralCode: string;
      isFirstReferral?: boolean;
    }
  ) {
    try {
      const event = referralData.isFirstReferral
        ? UserLifecycleEvent.FIRST_REFERRAL
        : UserLifecycleEvent.REFERRAL_MILESTONE;

      await eventTracker.trackEvent(
        userId,
        event,
        referralData,
        EventSource.SYSTEM_TRIGGER
      );

      // Check for referral milestones
      await this.checkReferralMilestones(userId);
    } catch (error) {
      console.error("Failed to track referral made:", error);
    }
  }

  /**
   * Hook for referral reward events
   */
  static async onReferralRewardEarned(
    userId: string,
    rewardData: {
      amount: number;
      referredUserId: string;
      level: string; // A, B, or C level referral
      transactionId: string;
    }
  ) {
    try {
      await eventTracker.trackEvent(
        userId,
        UserLifecycleEvent.REFERRAL_REWARD_EARNED,
        rewardData,
        EventSource.SYSTEM_TRIGGER
      );
    } catch (error) {
      console.error("Failed to track referral reward:", error);
    }
  }

  /**
   * Hook for password changes
   */
  static async onPasswordChanged(userId: string) {
    try {
      await eventTracker.trackEvent(
        userId,
        UserLifecycleEvent.PASSWORD_CHANGED,
        {},
        EventSource.USER_ACTION
      );
    } catch (error) {
      console.error("Failed to track password change:", error);
    }
  }

  /**
   * Hook for admin actions
   */
  static async onAdminAction(
    userId: string,
    action: string,
    actionData: Record<string, any>,
    adminId: string
  ) {
    try {
      let event: UserLifecycleEvent;

      switch (action) {
        case "account_suspended":
          event = UserLifecycleEvent.ACCOUNT_SUSPENDED;
          break;
        case "account_reactivated":
          event = UserLifecycleEvent.ACCOUNT_REACTIVATED;
          break;
        case "balance_adjusted":
          event = UserLifecycleEvent.MANUAL_BALANCE_ADJUSTMENT;
          break;
        default:
          return; // Unknown admin action
      }

      await eventTracker.trackEvent(
        userId,
        event,
        {
          ...actionData,
          adminId,
          action,
        },
        EventSource.ADMIN_ACTION
      );
    } catch (error) {
      console.error("Failed to track admin action:", error);
    }
  }

  /**
   * Hook for failed login attempts
   */
  static async onLoginFailed(
    userId: string,
    failureData: {
      reason: string;
      ipAddress?: string;
      consecutiveFailures: number;
    }
  ) {
    try {
      if (failureData.consecutiveFailures >= 3) {
        await eventTracker.trackEvent(
          userId,
          UserLifecycleEvent.MULTIPLE_LOGIN_FAILURES,
          failureData,
          EventSource.SYSTEM_TRIGGER
        );
      }
    } catch (error) {
      console.error("Failed to track login failure:", error);
    }
  }

  /**
   * Private helper methods for checking milestones and goals
   */
  private static async checkInactivityReturn(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lastLoginAt: true },
      });

      if (user?.lastLoginAt) {
        const daysSinceLastLogin = Math.floor(
          (Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastLogin >= 7) {
          await eventTracker.trackEvent(
            userId,
            UserLifecycleEvent.RETURNED_AFTER_INACTIVITY,
            { daysSinceLastLogin },
            EventSource.SYSTEM_TRIGGER
          );
        }
      }
    } catch (error) {
      console.error("Failed to check inactivity return:", error);
    }
  }

  private static async checkTaskGoals(userId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayTasks = await prisma.userVideoTask.count({
        where: {
          userId,
          isVerified: true,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      // Get user's position to determine daily target
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { currentPosition: true },
      });

      const dailyTarget = user?.currentPosition?.tasksPerDay || 5;

      if (todayTasks >= dailyTarget) {
        await eventTracker.trackEvent(
          userId,
          UserLifecycleEvent.DAILY_TASK_GOAL_ACHIEVED,
          { tasksCompleted: todayTasks, target: dailyTarget },
          EventSource.SYSTEM_TRIGGER
        );
      }

      // Check weekly goals
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - today.getDay());

      const weeklyTasks = await prisma.userVideoTask.count({
        where: {
          userId,
          isVerified: true,
          createdAt: {
            gte: weekStart,
          },
        },
      });

      const weeklyTarget = dailyTarget * 7;

      if (weeklyTasks >= weeklyTarget) {
        await eventTracker.trackEvent(
          userId,
          UserLifecycleEvent.WEEKLY_TASK_GOAL_ACHIEVED,
          { tasksCompleted: weeklyTasks, target: weeklyTarget },
          EventSource.SYSTEM_TRIGGER
        );
      }
    } catch (error) {
      console.error("Failed to check task goals:", error);
    }
  }

  private static async checkStreakMilestones(userId: string) {
    try {
      // Get consecutive days with tasks
      const tasks = await prisma.userVideoTask.findMany({
        where: {
          userId,
          isVerified: true,
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100, // Limit to recent tasks
      });

      // Calculate current streak
      const streakDays = this.calculateCurrentStreak(tasks);

      // Check for streak milestones
      const milestones = [7, 14, 30, 60, 100];
      if (milestones.includes(streakDays)) {
        await eventTracker.trackEvent(
          userId,
          UserLifecycleEvent.STREAK_MILESTONE,
          { streakDays },
          EventSource.SYSTEM_TRIGGER
        );
      }
    } catch (error) {
      console.error("Failed to check streak milestones:", error);
    }
  }

  private static async checkEarningMilestones(userId: string, newAmount: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totalEarnings: true },
      });

      if (!user) return;

      const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000];
      const previousTotal = user.totalEarnings - newAmount;

      // Check if we crossed any milestones
      for (const milestone of milestones) {
        if (previousTotal < milestone && user.totalEarnings >= milestone) {
          await eventTracker.trackEvent(
            userId,
            UserLifecycleEvent.MILESTONE_EARNING,
            { milestone, totalEarnings: user.totalEarnings },
            EventSource.SYSTEM_TRIGGER
          );
        }
      }
    } catch (error) {
      console.error("Failed to check earning milestones:", error);
    }
  }

  private static async checkReferralMilestones(userId: string) {
    try {
      const referralCount = await prisma.user.count({
        where: { referredBy: userId },
      });

      const milestones = [1, 5, 10, 25, 50, 100];
      if (milestones.includes(referralCount)) {
        await eventTracker.trackEvent(
          userId,
          UserLifecycleEvent.REFERRAL_MILESTONE,
          { referralCount },
          EventSource.SYSTEM_TRIGGER
        );
      }
    } catch (error) {
      console.error("Failed to check referral milestones:", error);
    }
  }

  private static calculateCurrentStreak(tasks: Array<{ createdAt: Date }>): number {
    if (tasks.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskDates = tasks.map(task => {
      const date = new Date(task.createdAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    });

    const uniqueDates = [...new Set(taskDates)].sort((a, b) => b - a);

    let streak = 0;
    let expectedDate = today.getTime();

    for (const taskDate of uniqueDates) {
      if (taskDate === expectedDate || taskDate === expectedDate - 86400000) {
        streak++;
        expectedDate = taskDate - 86400000;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Automated lifecycle monitoring
   */
  static async runDailyLifecycleCheck() {
    try {
      console.log("Starting daily lifecycle check...");

      // Check for inactive users
      await this.checkInactiveUsers();

      // Check for missed task targets
      await this.checkMissedTargets();

      // Update engagement scores
      await this.updateEngagementScores();

      console.log("Daily lifecycle check completed");
    } catch (error) {
      console.error("Failed to run daily lifecycle check:", error);
    }
  }

  private static async checkInactiveUsers() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Check for users inactive for 7+ days
    const inactiveUsers = await prisma.user.findMany({
      where: {
        lastLoginAt: {
          lt: sevenDaysAgo,
          gte: fourteenDaysAgo,
        },
      },
      select: { id: true, lastLoginAt: true },
    });

    for (const user of inactiveUsers) {
      await eventTracker.trackEvent(
        user.id,
        UserLifecycleEvent.LONG_INACTIVITY,
        {
          daysSinceLastLogin: user.lastLoginAt
            ? Math.floor((Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
            : null,
        },
        EventSource.SYSTEM_TRIGGER
      );
    }
  }

  private static async checkMissedTargets() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date(yesterday);
    today.setDate(today.getDate() + 1);

    // Get users who had targets yesterday but didn't meet them
    const users = await prisma.user.findMany({
      where: {
        currentPosition: {
          isNot: null,
        },
      },
      include: {
        currentPosition: true,
        videoTasks: {
          where: {
            createdAt: {
              gte: yesterday,
              lt: today,
            },
            isVerified: true,
          },
        },
      },
    });

    for (const user of users) {
      const tasksCompleted = user.videoTasks.length;
      const target = user.currentPosition?.tasksPerDay || 0;

      if (tasksCompleted < target) {
        await eventTracker.trackEvent(
          user.id,
          UserLifecycleEvent.MISSED_DAILY_TARGET,
          {
            tasksCompleted,
            target,
            date: yesterday.toISOString().split('T')[0],
          },
          EventSource.SYSTEM_TRIGGER
        );
      }
    }
  }

  private static async updateEngagementScores() {
    // This would batch update engagement scores for all users
    // Implementation would depend on your specific requirements
    console.log("Updating engagement scores...");
  }
}

// Export convenience functions
export const trackUserRegistration = LifecycleIntegrations.onUserRegistered;
export const trackUserLogin = LifecycleIntegrations.onUserLogin;
export const trackVideoTaskCompleted = LifecycleIntegrations.onVideoTaskCompleted;
export const trackEarningReceived = LifecycleIntegrations.onEarningReceived;
export const trackReferralMade = LifecycleIntegrations.onReferralMade;
export const trackPositionUpgraded = LifecycleIntegrations.onPositionUpgraded;
export const runDailyLifecycleCheck = LifecycleIntegrations.runDailyLifecycleCheck;
