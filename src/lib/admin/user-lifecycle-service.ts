import { db } from "@/lib/db";

export interface UserLifecycleData {
  userId: string;
  user: {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
    referralCode: string;
    status: string;
    isIntern: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    walletBalance: number;
    commissionBalance: number;
    totalEarnings: number;
    currentPosition?: {
      id: string;
      name: string;
      level: number;
      deposit: number;
    };
  };
  signupHistory: {
    signupDate: Date;
    signupMethod: string;
    referredBy?: string;
    deviceInfo?: any;
    ipAddress?: string;
  };
  loginHistory: {
    id: string;
    loginAt: Date;
    ipAddress: string;
    userAgent: string;
    deviceType: string;
    browser: string;
    operatingSystem: string;
    location?: string;
  }[];
  deviceDetails: {
    deviceType: string;
    browser: string;
    operatingSystem: string;
    ipAddresses: string[];
    lastSeen: Date;
    firstSeen: Date;
  }[];
  topupActivity: {
    id: string;
    amount: number;
    method: string;
    status: string;
    createdAt: Date;
    processedAt: Date | null;
    paymentProof?: string;
    transactionId?: string;
    selectedWallet?: {
      walletType: string;
      walletNumber?: string;
      usdtWalletAddress?: string;
    };
  }[];
  withdrawalActivity: {
    id: string;
    amount: number;
    method: string;
    status: string;
    createdAt: Date;
    processedAt: Date | null;
    paymentDetails: any;
    adminNotes?: string;
  }[];
  promotionsParticipation: {
    id: string;
    announcementId: string;
    title: string;
    participatedAt: Date;
    offerType?: string;
    offerValue?: string;
    isRedeemed: boolean;
    redeemedAt: Date | null;
  }[];
  planSubscriptions: {
    id: string;
    planName: string;
    planLevel: number;
    startDate: Date;
    endDate: Date;
    amountPaid: number;
    status: string;
    upgradeHistory: {
      fromLevel: number;
      toLevel: number;
      upgradedAt: Date;
      amountPaid: number;
    }[];
  }[];
  securityDeposits: {
    id: string;
    fromLevel: number;
    toLevel: number;
    refundAmount: number;
    status: string;
    requestedAt: Date;
    processedAt: Date | null;
    adminNotes?: string;
  }[];
  referralActivity: {
    totalReferrals: number;
    activeReferrals: number;
    totalCommissionEarned: number;
    referralTree: {
      level1: number;
      level2: number;
      level3: number;
    };
    recentReferrals: {
      id: string;
      referredUserId: string;
      referredUserName: string;
      referredUserPhone: string;
      joinedAt: Date;
      level: number;
      commissionEarned: number;
      isActive: boolean;
    }[];
  };
  dailyTaskCompletion: {
    date: string;
    tasksCompleted: number;
    tasksAvailable: number;
    completionRate: number;
    earningsFromTasks: number;
    videoTaskDetails: {
      videoId: string;
      videoTitle: string;
      completedAt: Date;
      reward: number;
      watchDuration: number;
      isVerified: boolean;
    }[];
  }[];
  earningsBreakdown: {
    today: {
      dailyTasks: number;
      referralRewards: number;
      bonuses: number;
      total: number;
    };
    thisWeek: {
      dailyTasks: number;
      referralRewards: number;
      bonuses: number;
      total: number;
    };
    thisMonth: {
      dailyTasks: number;
      referralRewards: number;
      bonuses: number;
      total: number;
    };
    allTime: {
      dailyTasks: number;
      referralRewards: number;
      bonuses: number;
      total: number;
    };
  };
  activityTimeline: {
    id: string;
    activity: string;
    description: string;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    metadata?: any;
  }[];
  riskMetrics: {
    multipleDeviceLogins: boolean;
    suspiciousIpChanges: boolean;
    unusualActivityPatterns: boolean;
    flaggedTransactions: number;
    riskScore: number;
  };
  performanceMetrics: {
    averageSessionDuration: number;
    dailyActiveStreak: number;
    taskCompletionRate: number;
    referralSuccessRate: number;
    totalSessions: number;
    bounceRate: number;
  };
}

export class UserLifecycleService {
  static async getCompleteUserLifecycle(
    userId: string,
  ): Promise<UserLifecycleData> {
    try {
      // Get basic user information
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          currentPosition: {
            select: {
              id: true,
              name: true,
              level: true,
              deposit: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Get parallel data
      const [
        loginHistory,
        topupActivity,
        withdrawalActivity,
        promotionsParticipation,
        planSubscriptions,
        securityDeposits,
        referralActivity,
        dailyTaskCompletion,
        earningsData,
        activityTimeline,
      ] = await Promise.all([
        this.getLoginHistory(userId),
        this.getTopupActivity(userId),
        this.getWithdrawalActivity(userId),
        this.getPromotionsParticipation(userId),
        this.getPlanSubscriptions(userId),
        this.getSecurityDeposits(userId),
        this.getReferralActivity(userId),
        this.getDailyTaskCompletion(userId),
        this.getEarningsBreakdown(userId),
        this.getActivityTimeline(userId),
      ]);

      // Get device details from activity logs
      const deviceDetails = await this.getDeviceDetails(userId);

      // Calculate risk and performance metrics
      const riskMetrics = await this.calculateRiskMetrics(
        userId,
        loginHistory,
        activityTimeline,
      );
      const performanceMetrics = await this.calculatePerformanceMetrics(
        userId,
        loginHistory,
        dailyTaskCompletion,
      );

      // Get signup history
      const signupHistory = await this.getSignupHistory(userId);

      const lifecycleData: UserLifecycleData = {
        userId,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          referralCode: user.referralCode,
          status: user.status,
          isIntern: user.isIntern,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLoginAt: user.lastLoginAt,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          walletBalance: user.walletBalance,
          commissionBalance: user.commissionBalance,
          totalEarnings: user.totalEarnings,
          currentPosition: user.currentPosition || undefined,
        },
        signupHistory: {
          ...signupHistory,
          ipAddress: signupHistory.ipAddress ?? undefined,
        },
        loginHistory,
        deviceDetails,
        topupActivity,
        withdrawalActivity,
        promotionsParticipation,
        planSubscriptions,
        securityDeposits,
        referralActivity,
        dailyTaskCompletion,
        earningsBreakdown: earningsData,
        activityTimeline,
        riskMetrics,
        performanceMetrics,
      };

      return lifecycleData;
    } catch (error) {
      console.error("Error fetching user lifecycle data:", error);
      throw error;
    }
  }

  static async getLoginHistory(userId: string) {
    const activityLogs = await db.activityLog.findMany({
      where: {
        userId,
        activity: { in: ["login", "logout", "session_start"] },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return activityLogs.map((log) => {
      const metadata =
        typeof log.metadata === "string"
          ? JSON.parse(log.metadata || "{}")
          : log.metadata || {};
      return {
        id: log.id,
        loginAt: log.createdAt,
        ipAddress: log.ipAddress || "Unknown",
        userAgent: log.userAgent || "Unknown",
        deviceType: UserLifecycleService.extractDeviceType(log.userAgent),
        browser: UserLifecycleService.extractBrowser(log.userAgent),
        operatingSystem: UserLifecycleService.extractOS(log.userAgent),
        location: metadata?.location,
      };
    });
  }

  static async getTopupActivity(userId: string) {
    const topupRequests = await db.topupRequest.findMany({
      where: { userId },
      include: {
        selectedWallet: {
          select: {
            walletType: true,
            walletNumber: true,
            usdtWalletAddress: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return topupRequests.map((request) => ({
      id: request.id,
      amount: request.amount,
      method: String(request.selectedWallet?.walletType || "Unknown"),
      status: String(request.status),
      createdAt: request.createdAt,
      processedAt: request.processedAt,
      paymentProof: request.paymentProof ?? undefined,
      transactionId: request.transactionId ?? undefined,
      selectedWallet: request.selectedWallet
        ? {
            walletType: request.selectedWallet.walletType,
            walletNumber: request.selectedWallet.walletNumber ?? undefined,
            usdtWalletAddress:
              request.selectedWallet.usdtWalletAddress ?? undefined,
          }
        : undefined,
    }));
  }

  static async getWithdrawalActivity(userId: string) {
    const withdrawalRequests = await db.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return withdrawalRequests.map((request) => ({
      id: request.id,
      amount: request.amount,
      method: request.paymentMethod,
      status: String(request.status),
      createdAt: request.createdAt,
      processedAt: request.processedAt,
      paymentDetails:
        typeof request.paymentDetails === "string"
          ? JSON.parse(request.paymentDetails)
          : request.paymentDetails,
      adminNotes: request.adminNotes ?? undefined,
    }));
  }

  static async getPromotionsParticipation(userId: string) {
    try {
      const userAnnouncements = await db.userAnnouncement.findMany({
        where: { userId },
        include: {
          announcement: {
            select: {
              id: true,
              title: true,
              message: true,
              metadata: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const userOffers = await (db as any).userOffer
        .findMany({
          where: { userId },
          include: {
            announcement: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
        .catch(() => []);

      const promotions = userAnnouncements.map((ua) => {
        const metadata =
          typeof ua.announcement.metadata === "string"
            ? JSON.parse(ua.announcement.metadata || "{}")
            : ua.announcement.metadata || {};

        const relatedOffer = userOffers.find(
          (o: any) => o.announcementId === ua.announcementId,
        );

        return {
          id: ua.id,
          announcementId: ua.announcementId,
          title: ua.announcement.title,
          participatedAt: ua.createdAt,
          offerType: metadata?.customOffer?.type || relatedOffer?.offerType,
          offerValue: metadata?.customOffer?.value || relatedOffer?.offerValue,
          isRedeemed: relatedOffer?.isRedeemed || false,
          redeemedAt: relatedOffer?.redeemedAt || null,
        };
      });

      return promotions;
    } catch (error) {
      console.error("Error fetching promotions participation:", error);
      return [];
    }
  }

  static async getPlanSubscriptions(userId: string) {
    const userPlans = await db.userPlan.findMany({
      where: { userId },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get upgrade history from activity logs
    const upgradeHistory = await db.activityLog.findMany({
      where: {
        userId,
        activity: { in: ["plan_upgrade", "level_upgrade", "position_upgrade"] },
      },
      orderBy: { createdAt: "asc" },
    });

    return userPlans.map((plan) => {
      const upgrades = upgradeHistory
        .filter((log) => {
          const metadata =
            typeof log.metadata === "string"
              ? JSON.parse(log.metadata || "{}")
              : log.metadata || {};
          return metadata?.planId === plan.planId;
        })
        .map((log) => {
          const metadata =
            typeof log.metadata === "string"
              ? JSON.parse(log.metadata || "{}")
              : log.metadata || {};
          return {
            fromLevel: metadata?.fromLevel || 0,
            toLevel: metadata?.toLevel || 0,
            upgradedAt: log.createdAt,
            amountPaid: metadata?.amountPaid || plan.amountPaid,
          };
        });

      return {
        id: plan.id,
        planName: plan.plan?.name || "Unknown Plan",
        planLevel: 1, // Default level since it's not in the schema
        startDate: plan.startDate,
        endDate: plan.endDate,
        amountPaid: plan.amountPaid,
        status: String(plan.status),
        upgradeHistory: upgrades,
      };
    });
  }

  static async getSecurityDeposits(userId: string) {
    try {
      const securityRefunds = await (db as any).securityRefundRequest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      return securityRefunds.map((refund: any) => ({
        id: refund.id,
        fromLevel: refund.fromLevel,
        toLevel: refund.toLevel,
        refundAmount: refund.refundAmount,
        status: refund.status,
        requestedAt: refund.createdAt,
        processedAt: refund.processedAt,
        adminNotes: refund.adminNotes,
      }));
    } catch (error) {
      console.error("Error fetching security deposits:", error);
      return [];
    }
  }

  static async getReferralActivity(userId: string) {
    const referralHierarchy = await db.referralHierarchy.findMany({
      where: { referrerId: userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get commission earnings from referrals
    const commissionTransactions = await db.walletTransaction.findMany({
      where: {
        userId,
        type: {
          in: [
            "REFERRAL_REWARD_A",
            "REFERRAL_REWARD_B",
            "REFERRAL_REWARD_C",
            "MANAGEMENT_BONUS_A",
            "MANAGEMENT_BONUS_B",
            "MANAGEMENT_BONUS_C",
          ] as any,
        },
        status: "COMPLETED",
      },
    });

    const totalCommissionEarned = commissionTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0,
    );

    const referralTree = {
      level1: referralHierarchy.filter((r) => String(r.level) === "A_LEVEL")
        .length,
      level2: referralHierarchy.filter((r) => String(r.level) === "B_LEVEL")
        .length,
      level3: referralHierarchy.filter((r) => String(r.level) === "C_LEVEL")
        .length,
    };

    const activeReferrals = referralHierarchy.filter(
      (r) => r.user.status === "ACTIVE",
    ).length;

    const recentReferrals = referralHierarchy.slice(0, 10).map((referral) => {
      const userCommissions = commissionTransactions.filter((tx) => {
        const metadata =
          typeof tx.metadata === "string"
            ? JSON.parse(tx.metadata || "{}")
            : tx.metadata || {};
        return metadata?.referredUserId === referral.userId;
      });

      const commissionEarned = userCommissions.reduce(
        (sum, tx) => sum + tx.amount,
        0,
      );

      return {
        id: referral.id,
        referredUserId: referral.userId,
        referredUserName: referral.user.name || "Unknown",
        referredUserPhone: referral.user.phone,
        joinedAt: referral.createdAt,
        level:
          String(referral.level) === "A_LEVEL"
            ? 1
            : String(referral.level) === "B_LEVEL"
              ? 2
              : 3,
        commissionEarned,
        isActive: referral.user.status === "ACTIVE",
      };
    });

    return {
      totalReferrals: referralHierarchy.length,
      activeReferrals,
      totalCommissionEarned,
      referralTree,
      recentReferrals,
    };
  }

  static async getDailyTaskCompletion(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const videoTasks = await db.userVideoTask.findMany({
      where: {
        userId,
        watchedAt: { gte: thirtyDaysAgo },
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            rewardAmount: true,
          },
        },
      },
      orderBy: { watchedAt: "desc" },
    });

    // Group by date
    const tasksByDate = new Map();

    videoTasks.forEach((task) => {
      const date = task.watchedAt.toISOString().split("T")[0];
      if (!tasksByDate.has(date)) {
        tasksByDate.set(date, []);
      }
      tasksByDate.get(date).push(task);
    });

    const dailyCompletion = Array.from(tasksByDate.entries())
      .map(([date, tasks]) => {
        const tasksCompleted = tasks.length;
        const tasksAvailable = 50; // Default task limit
        const completionRate = (tasksCompleted / tasksAvailable) * 100;
        const earningsFromTasks = tasks.reduce(
          (sum: number, task: any) => sum + (task.video?.rewardAmount || 0),
          0,
        );

        const videoTaskDetails = tasks.map((task: any) => ({
          videoId: task.videoId,
          videoTitle: task.video?.title || "Unknown",
          completedAt: task.watchedAt,
          reward: task.video?.rewardAmount || 0,
          watchDuration: task.watchDuration || 0,
          isVerified: task.isVerified,
        }));

        return {
          date,
          tasksCompleted,
          tasksAvailable,
          completionRate,
          earningsFromTasks,
          videoTaskDetails,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    return dailyCompletion;
  }

  static async getEarningsBreakdown(userId: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const transactions = await db.walletTransaction.findMany({
      where: {
        userId,
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
            "TOPUP_BONUS",
            "CREDIT",
          ] as any,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const calculateEarnings = (startDate: Date, endDate?: Date) => {
      const filtered = transactions.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        if (endDate) {
          return txDate >= startDate && txDate < endDate;
        }
        return txDate >= startDate;
      });

      const dailyTasks = filtered
        .filter((tx) => tx.type === "TASK_INCOME")
        .reduce((sum, tx) => sum + tx.amount, 0);

      const referralRewards = filtered
        .filter((tx) =>
          [
            "REFERRAL_REWARD_A",
            "REFERRAL_REWARD_B",
            "REFERRAL_REWARD_C",
            "MANAGEMENT_BONUS_A",
            "MANAGEMENT_BONUS_B",
            "MANAGEMENT_BONUS_C",
          ].includes(tx.type as any),
        )
        .reduce((sum, tx) => sum + tx.amount, 0);

      const bonuses = filtered
        .filter((tx) => ["TOPUP_BONUS", "CREDIT"].includes(tx.type as any))
        .reduce((sum, tx) => sum + tx.amount, 0);

      return {
        dailyTasks,
        referralRewards,
        bonuses,
        total: dailyTasks + referralRewards + bonuses,
      };
    };

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(weekStart);
    nextWeek.setDate(weekStart.getDate() + 7);

    const nextMonth = new Date(monthStart);
    nextMonth.setMonth(monthStart.getMonth() + 1);

    return {
      today: calculateEarnings(today, tomorrow),
      thisWeek: calculateEarnings(weekStart, nextWeek),
      thisMonth: calculateEarnings(monthStart, nextMonth),
      allTime: calculateEarnings(new Date("2020-01-01")),
    };
  }

  static async getActivityTimeline(userId: string) {
    const activities = await db.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return activities.map((activity) => ({
      id: activity.id,
      activity: activity.activity,
      description: activity.description,
      timestamp: activity.createdAt,
      ipAddress: activity.ipAddress || "Unknown",
      userAgent: activity.userAgent || "Unknown",
      metadata:
        typeof activity.metadata === "string"
          ? JSON.parse(activity.metadata || "{}")
          : activity.metadata,
    }));
  }

  static async getDeviceDetails(userId: string) {
    const activities = await db.activityLog.findMany({
      where: { userId },
      select: {
        userAgent: true,
        ipAddress: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const deviceMap = new Map();

    activities.forEach((activity) => {
      const deviceKey = `${UserLifecycleService.extractDeviceType(
        activity.userAgent,
      )}-${UserLifecycleService.extractBrowser(activity.userAgent)}-${UserLifecycleService.extractOS(activity.userAgent)}`;

      if (!deviceMap.has(deviceKey)) {
        deviceMap.set(deviceKey, {
          deviceType: UserLifecycleService.extractDeviceType(
            activity.userAgent,
          ),
          browser: UserLifecycleService.extractBrowser(activity.userAgent),
          operatingSystem: UserLifecycleService.extractOS(activity.userAgent),
          ipAddresses: new Set([activity.ipAddress || "Unknown"]),
          firstSeen: activity.createdAt,
          lastSeen: activity.createdAt,
        });
      } else {
        const device = deviceMap.get(deviceKey);
        device.ipAddresses.add(activity.ipAddress || "Unknown");
        if (activity.createdAt > device.lastSeen) {
          device.lastSeen = activity.createdAt;
        }
        if (activity.createdAt < device.firstSeen) {
          device.firstSeen = activity.createdAt;
        }
      }
    });

    return Array.from(deviceMap.values()).map((device) => ({
      ...device,
      ipAddresses: Array.from(device.ipAddresses),
    }));
  }

  static async calculateRiskMetrics(
    userId: string,
    loginHistory: any[],
    activityTimeline: any[],
  ) {
    const uniqueDevices = new Set(
      loginHistory.map((l) => `${l.deviceType}-${l.browser}`),
    );
    const uniqueIPs = new Set(loginHistory.map((l) => l.ipAddress));

    const multipleDeviceLogins = uniqueDevices.size > 3;
    const suspiciousIpChanges = uniqueIPs.size > 10;

    // Check for unusual activity patterns
    const hourlyActivity = new Map();
    activityTimeline.forEach((activity) => {
      const hour = new Date(activity.timestamp).getHours();
      hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
    });

    const mostActiveHours = Array.from(hourlyActivity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([hour]) => hour);

    const unusualActivityPatterns = mostActiveHours.some(
      (hour) => hour < 6 || hour > 23,
    );

    // Check for flagged transactions
    const flaggedTransactions = await db.walletTransaction.count({
      where: {
        userId,
        OR: [
          { description: { contains: "flagged" } },
          { description: { contains: "suspicious" } },
        ],
      },
    });

    let riskScore = 0;
    if (multipleDeviceLogins) riskScore += 20;
    if (suspiciousIpChanges) riskScore += 30;
    if (unusualActivityPatterns) riskScore += 15;
    if (flaggedTransactions > 0) riskScore += 25;
    if (uniqueIPs.size > 20) riskScore += 10;

    return {
      multipleDeviceLogins,
      suspiciousIpChanges,
      unusualActivityPatterns,
      flaggedTransactions,
      riskScore: Math.min(riskScore, 100),
    };
  }

  static async calculatePerformanceMetrics(
    userId: string,
    loginHistory: any[],
    dailyTasks: any[],
  ) {
    // Calculate average session duration (mock implementation)
    const averageSessionDuration = 45; // minutes

    // Calculate daily active streak
    const sortedTasks = dailyTasks.sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    let currentDate = new Date();

    for (const task of sortedTasks) {
      const taskDate = new Date(task.date);
      const dayDiff = Math.floor(
        (currentDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (dayDiff === streak && task.tasksCompleted > 0) {
        streak++;
        currentDate = taskDate;
      } else {
        break;
      }
    }

    // Calculate task completion rate
    const totalTasks = dailyTasks.reduce(
      (sum, day) => sum + day.tasksAvailable,
      0,
    );
    const completedTasks = dailyTasks.reduce(
      (sum, day) => sum + day.tasksCompleted,
      0,
    );
    const taskCompletionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Get referral data for success rate
    const totalReferrals = await db.referralHierarchy.count({
      where: { referrerId: userId },
    });

    const activeReferrals = await db.referralHierarchy.count({
      where: {
        referrerId: userId,
        user: {
          status: "ACTIVE",
        },
      },
    });

    const referralSuccessRate =
      totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0;

    return {
      averageSessionDuration,
      dailyActiveStreak: streak,
      taskCompletionRate,
      referralSuccessRate,
      totalSessions: loginHistory.length,
      bounceRate: 15, // Mock bounce rate
    };
  }

  static async getSignupHistory(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            phone: true,
            referralCode: true,
          },
        },
      },
    });

    if (!user) throw new Error("User not found");

    const signupActivity = await db.activityLog.findFirst({
      where: {
        userId,
        activity: { in: ["user_registration", "signup"] },
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      signupDate: user.createdAt,
      signupMethod: "phone", // Default signup method
      referredBy: user.referrer?.referralCode,
      deviceInfo: signupActivity
        ? {
            deviceType: UserLifecycleService.extractDeviceType(
              signupActivity.userAgent,
            ),
            browser: UserLifecycleService.extractBrowser(
              signupActivity.userAgent,
            ),
            operatingSystem: UserLifecycleService.extractOS(
              signupActivity.userAgent,
            ),
          }
        : undefined,
      ipAddress: signupActivity?.ipAddress ?? undefined,
    };
  }

  // Helper methods for user agent parsing
  static extractDeviceType(userAgent: string | null): string {
    if (!userAgent) return "Unknown";
    if (userAgent.includes("Mobile")) return "Mobile";
    if (userAgent.includes("Tablet")) return "Tablet";
    return "Desktop";
  }

  static extractBrowser(userAgent: string | null): string {
    if (!userAgent) return "Unknown";
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Unknown";
  }

  static extractOS(userAgent: string | null): string {
    if (!userAgent) return "Unknown";
    if (userAgent.includes("Windows")) return "Windows";
    if (userAgent.includes("Mac")) return "macOS";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("iOS")) return "iOS";
    return "Unknown";
  }
}
