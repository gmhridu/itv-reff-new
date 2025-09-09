import { prisma } from "@/lib/prisma";
import { NotificationType, NotificationSeverity } from "@prisma/client";

interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  severity?: NotificationSeverity;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export class UserNotificationService {
  /**
   * Create a notification for a specific user
   */
  static async createNotification(data: NotificationData) {
    try {
      const notification = await prisma.systemNotification.create({
        data: {
          type: data.type,
          title: data.title,
          message: data.message,
          severity: data.severity || NotificationSeverity.INFO,
          targetType: "USER",
          targetId: data.userId,
          actionUrl: data.actionUrl,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });

      return notification;
    } catch (error) {
      console.error("Error creating user notification:", error);
      throw error;
    }
  }

  /**
   * Notify user about withdrawal request status change
   */
  static async notifyWithdrawalStatusChange(
    userId: string,
    status: string,
    amount: number,
    transactionId?: string,
    adminNotes?: string
  ) {
    const notifications = {
      APPROVED: {
        title: "Withdrawal Approved! 🎉",
        message: `Your withdrawal request of PKR ${amount.toLocaleString()} has been approved and is being processed.`,
        severity: NotificationSeverity.SUCCESS,
      },
      REJECTED: {
        title: "Withdrawal Rejected",
        message: `Your withdrawal request of PKR ${amount.toLocaleString()} has been rejected. ${adminNotes ? `Reason: ${adminNotes}` : ''}`,
        severity: NotificationSeverity.ERROR,
      },
      PROCESSED: {
        title: "Money Sent! 💰",
        message: `Your withdrawal of PKR ${amount.toLocaleString()} has been successfully processed. ${transactionId ? `Transaction ID: ${transactionId}` : ''}`,
        severity: NotificationSeverity.SUCCESS,
      },
    };

    const notificationData = notifications[status as keyof typeof notifications];

    if (!notificationData) return;

    return this.createNotification({
      userId,
      type: NotificationType.WITHDRAWAL_REQUEST,
      title: notificationData.title,
      message: notificationData.message,
      severity: notificationData.severity,
      actionUrl: "/withdraw",
      metadata: {
        withdrawalAmount: amount,
        status,
        transactionId,
        adminNotes,
      },
    });
  }

  /**
   * Notify user about video completion earnings
   */
  static async notifyVideoEarnings(
    userId: string,
    videoTitle: string,
    earnings: number,
    walletType: string
  ) {
    return this.createNotification({
      userId,
      type: NotificationType.USER_ACTION,
      title: "Video Reward Earned! 🎬",
      message: `Congratulations! You earned PKR ${earnings.toLocaleString()} for completing "${videoTitle}". Amount added to your ${walletType.toLowerCase()} wallet.`,
      severity: NotificationSeverity.SUCCESS,
      actionUrl: "/dashboard",
      metadata: {
        videoTitle,
        earnings,
        walletType,
        action: "video_completion",
      },
    });
  }

  /**
   * Notify user about task completion
   */
  static async notifyTaskCompletion(
    userId: string,
    taskTitle: string,
    reward: number,
    walletType: string
  ) {
    return this.createNotification({
      userId,
      type: NotificationType.TASK_COMPLETED,
      title: "Task Completed! ✅",
      message: `Great job! You completed "${taskTitle}" and earned PKR ${reward.toLocaleString()}. Keep it up!`,
      severity: NotificationSeverity.SUCCESS,
      actionUrl: "/tasks",
      metadata: {
        taskTitle,
        reward,
        walletType,
        completedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Notify user about level upgrade
   */
  static async notifyLevelUpgrade(
    userId: string,
    newLevel: number,
    bonusAmount?: number
  ) {
    const message = bonusAmount
      ? `Awesome! You've reached Level ${newLevel} and earned a bonus of PKR ${bonusAmount.toLocaleString()}! 🎉`
      : `Congratulations! You've upgraded to Level ${newLevel}! 🚀`;

    return this.createNotification({
      userId,
      type: NotificationType.USER_ACTION,
      title: `Level ${newLevel} Unlocked! 🏆`,
      message,
      severity: NotificationSeverity.SUCCESS,
      actionUrl: "/profile",
      metadata: {
        newLevel,
        bonusAmount,
        upgradedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Notify user about daily tasks
   */
  static async notifyDailyTasks(userId: string, availableTasks: number) {
    return this.createNotification({
      userId,
      type: NotificationType.TASK_COMPLETED,
      title: "Daily Tasks Available! 📋",
      message: `You have ${availableTasks} new task${availableTasks > 1 ? 's' : ''} available for today. Start earning now!`,
      severity: NotificationSeverity.INFO,
      actionUrl: "/tasks",
      metadata: {
        availableTasks,
        date: new Date().toDateString(),
      },
    });
  }

  /**
   * Notify user about wallet balance changes
   */
  static async notifyBalanceChange(
    userId: string,
    amount: number,
    walletType: string,
    action: string,
    description: string
  ) {
    const isPositive = amount > 0;
    const title = isPositive
      ? `Balance Added! +PKR ${amount.toLocaleString()}`
      : `Balance Deducted! -PKR ${Math.abs(amount).toLocaleString()}`;

    return this.createNotification({
      userId,
      type: NotificationType.USER_ACTION,
      title,
      message: `${description} Your ${walletType.toLowerCase()} wallet has been ${isPositive ? 'credited' : 'debited'} with PKR ${Math.abs(amount).toLocaleString()}.`,
      severity: isPositive ? NotificationSeverity.SUCCESS : NotificationSeverity.INFO,
      actionUrl: "/wallet",
      metadata: {
        amount,
        walletType,
        action,
        description,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Notify user about security events
   */
  static async notifySecurityEvent(
    userId: string,
    event: string,
    details: string,
    severity: NotificationSeverity = NotificationSeverity.WARNING
  ) {
    return this.createNotification({
      userId,
      type: NotificationType.SECURITY_ALERT,
      title: `Security Alert: ${event}`,
      message: details,
      severity,
      actionUrl: "/profile/security",
      metadata: {
        event,
        timestamp: new Date().toISOString(),
        ip: "hidden", // Can be added from request context
      },
    });
  }

  /**
   * Notify user about system maintenance
   */
  static async notifyMaintenance(
    userId: string,
    maintenanceDate: Date,
    duration: string,
    affectedFeatures: string[]
  ) {
    return this.createNotification({
      userId,
      type: NotificationType.MAINTENANCE,
      title: "Scheduled Maintenance Notice",
      message: `System maintenance is scheduled for ${maintenanceDate.toLocaleDateString()} (${duration}). Some features may be temporarily unavailable.`,
      severity: NotificationSeverity.INFO,
      metadata: {
        maintenanceDate: maintenanceDate.toISOString(),
        duration,
        affectedFeatures,
      },
    });
  }

  /**
   * Create welcome notification for new users
   */
  static async createWelcomeNotification(userId: string, userName?: string) {
    const title = userName ? `Welcome ${userName}! 🎉` : "Welcome to iTV! 🎉";

    return this.createNotification({
      userId,
      type: NotificationType.USER_REGISTRATION,
      title,
      message: "Thanks for joining iTV! Start watching videos and completing tasks to earn money. Check out your first tasks below!",
      severity: NotificationSeverity.SUCCESS,
      actionUrl: "/tasks",
      metadata: {
        isWelcome: true,
        registeredAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Bulk create notifications for multiple users
   */
  static async createBulkNotification(
    userIds: string[],
    title: string,
    message: string,
    type: NotificationType,
    severity: NotificationSeverity = NotificationSeverity.INFO,
    actionUrl?: string,
    metadata?: Record<string, any>
  ) {
    try {
      const notifications = await prisma.systemNotification.createMany({
        data: userIds.map(userId => ({
          type,
          title,
          message,
          severity,
          targetType: "USER",
          targetId: userId,
          actionUrl,
          metadata: metadata ? JSON.stringify(metadata) : null,
        })),
      });

      return notifications;
    } catch (error) {
      console.error("Error creating bulk notifications:", error);
      throw error;
    }
  }

  /**
   * Get unread notification count for user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await prisma.systemNotification.count({
        where: {
          OR: [
            { targetType: "USER", targetId: userId },
            { targetType: "ALL" },
          ],
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }
}
