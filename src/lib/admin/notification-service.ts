import { db as prisma } from "@/lib/db";

// Define enums since they're not exported yet
export enum NotificationType {
  SYSTEM_ALERT = "SYSTEM_ALERT",
  USER_ACTION = "USER_ACTION",
  WITHDRAWAL_REQUEST = "WITHDRAWAL_REQUEST",
  VIDEO_UPLOAD = "VIDEO_UPLOAD",
  USER_REGISTRATION = "USER_REGISTRATION",
  MAINTENANCE = "MAINTENANCE",
  SECURITY_ALERT = "SECURITY_ALERT",
}

export enum NotificationSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  SUCCESS = "SUCCESS",
}

export interface SystemNotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  targetType: string | null;
  targetId: string | null;
  isRead: boolean;
  actionUrl: string | null;
  metadata: any;
  createdAt: Date;
  readAt: Date | null;
}

export interface NotificationFilters {
  type?: NotificationType;
  severity?: NotificationSeverity;
  targetType?: string;
  targetId?: string;
  isRead?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginatedNotifications {
  notifications: SystemNotificationData[];
  totalCount: number;
  unreadCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  notificationsByType: { type: NotificationType; count: number }[];
  notificationsBySeverity: { severity: NotificationSeverity; count: number }[];
  recentNotifications: SystemNotificationData[];
}

export class NotificationService {
  /**
   * Create a new system notification
   */
  async createNotification(
    type: NotificationType,
    title: string,
    message: string,
    options: {
      severity?: NotificationSeverity;
      targetType?: string;
      targetId?: string;
      actionUrl?: string;
      metadata?: any;
    } = {},
  ): Promise<SystemNotificationData> {
    const notification = await (prisma as any).systemNotification.create({
      data: {
        type,
        title,
        message,
        severity: options.severity || NotificationSeverity.INFO,
        targetType: options.targetType,
        targetId: options.targetId,
        actionUrl: options.actionUrl,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
      },
    });

    return this.mapNotification(notification);
  }

  /**
   * Get paginated notifications with filters
   */
  async getNotifications(
    filters: NotificationFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: "createdAt" | "readAt" = "createdAt",
    sortOrder: "asc" | "desc" = "desc",
  ): Promise<PaginatedNotifications> {
    const skip = (page - 1) * limit;

    // Build where clause
    const where = this.buildWhereClause(filters);

    const [notifications, totalCount, unreadCount] = await Promise.all([
      (prisma as any).systemNotification.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      (prisma as any).systemNotification.count({ where }),
      (prisma as any).systemNotification.count({
        where: { ...where, isRead: false },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      notifications: notifications.map(this.mapNotification),
      totalCount,
      unreadCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Get notifications for specific target
   */
  async getTargetNotifications(
    targetType: string,
    targetId: string,
    limit: number = 10,
  ): Promise<SystemNotificationData[]> {
    const notifications = await (prisma as any).systemNotification.findMany({
      where: {
        targetType,
        targetId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return notifications.map(this.mapNotification);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<SystemNotificationData> {
    const notification = await (prisma as any).systemNotification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return this.mapNotification(notification);
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<number> {
    const result = await (prisma as any).systemNotification.updateMany({
      where: {
        id: { in: notificationIds },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Mark all notifications as read for a target
   */
  async markAllAsReadForTarget(
    targetType?: string,
    targetId?: string,
  ): Promise<number> {
    const where: any = { isRead: false };

    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;

    const result = await (prisma as any).systemNotification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      await (prisma as any).systemNotification.delete({
        where: { id: notificationId },
      });
      return true;
    } catch (error) {
      console.error("Failed to delete notification:", error);
      return false;
    }
  }

  /**
   * Delete multiple notifications
   */
  async deleteMultipleNotifications(
    notificationIds: string[],
  ): Promise<number> {
    const result = await (prisma as any).systemNotification.deleteMany({
      where: { id: { in: notificationIds } },
    });

    return result.count;
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(
    dateFrom?: Date,
    dateTo?: Date,
    targetType?: string,
  ): Promise<NotificationStats> {
    const where: any = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    const [
      totalNotifications,
      unreadNotifications,
      notificationsByType,
      notificationsBySeverity,
      recentNotifications,
    ] = await Promise.all([
      (prisma as any).systemNotification.count({ where }),
      (prisma as any).systemNotification.count({
        where: { ...where, isRead: false },
      }),
      (prisma as any).systemNotification.groupBy({
        by: ["type"],
        where,
        _count: true,
        orderBy: { _count: { type: "desc" } },
      }),
      (prisma as any).systemNotification.groupBy({
        by: ["severity"],
        where,
        _count: true,
        orderBy: { _count: { severity: "desc" } },
      }),
      (prisma as any).systemNotification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return {
      totalNotifications,
      unreadNotifications,
      notificationsByType: notificationsByType.map((item: any) => ({
        type: item.type,
        count: item._count,
      })),
      notificationsBySeverity: notificationsBySeverity.map((item: any) => ({
        severity: item.severity,
        count: item._count,
      })),
      recentNotifications: recentNotifications.map(this.mapNotification),
    };
  }

  /**
   * Clean up old notifications
   */
  async cleanupOldNotifications(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await (prisma as any).systemNotification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        isRead: true, // Only delete read notifications
      },
    });

    return result.count;
  }

  /**
   * Convenience methods for common notification types
   */
  async notifyUserRegistration(
    userId: string,
    userName: string,
    userEmail: string,
  ): Promise<SystemNotificationData> {
    return this.createNotification(
      NotificationType.USER_REGISTRATION,
      "New User Registration",
      `New user ${userName} (${userEmail}) has registered`,
      {
        severity: NotificationSeverity.INFO,
        targetType: "user",
        targetId: userId,
        actionUrl: `/admin/users/${userId}`,
        metadata: { userName, userEmail },
      },
    );
  }

  async notifyWithdrawalRequest(
    withdrawalId: string,
    userId: string,
    amount: number,
    userName: string,
  ): Promise<SystemNotificationData> {
    return this.createNotification(
      NotificationType.WITHDRAWAL_REQUEST,
      "New Withdrawal Request",
      `${userName} has requested a withdrawal of $${amount}`,
      {
        severity: NotificationSeverity.WARNING,
        targetType: "withdrawal",
        targetId: withdrawalId,
        actionUrl: `/admin/withdrawals/${withdrawalId}`,
        metadata: { userId, amount, userName },
      },
    );
  }

  async notifyVideoUpload(
    videoId: string,
    videoTitle: string,
    uploadedBy?: string,
  ): Promise<SystemNotificationData> {
    return this.createNotification(
      NotificationType.VIDEO_UPLOAD,
      "New Video Uploaded",
      `New video "${videoTitle}" has been uploaded`,
      {
        severity: NotificationSeverity.INFO,
        targetType: "video",
        targetId: videoId,
        actionUrl: `/admin/videos/${videoId}`,
        metadata: { videoTitle, uploadedBy },
      },
    );
  }

  async notifySystemAlert(
    title: string,
    message: string,
    severity: NotificationSeverity = NotificationSeverity.WARNING,
    actionUrl?: string,
    metadata?: any,
  ): Promise<SystemNotificationData> {
    return this.createNotification(
      NotificationType.SYSTEM_ALERT,
      title,
      message,
      {
        severity,
        targetType: "system",
        actionUrl,
        metadata,
      },
    );
  }

  async notifySecurityAlert(
    title: string,
    message: string,
    targetId?: string,
    metadata?: any,
  ): Promise<SystemNotificationData> {
    return this.createNotification(
      NotificationType.SECURITY_ALERT,
      title,
      message,
      {
        severity: NotificationSeverity.ERROR,
        targetType: "security",
        targetId,
        metadata,
      },
    );
  }

  async notifyMaintenance(
    title: string,
    message: string,
    scheduledTime?: Date,
  ): Promise<SystemNotificationData> {
    return this.createNotification(
      NotificationType.MAINTENANCE,
      title,
      message,
      {
        severity: NotificationSeverity.INFO,
        targetType: "system",
        metadata: { scheduledTime },
      },
    );
  }

  /**
   * Bulk operations
   */
  async createBulkNotifications(
    notifications: Array<{
      type: NotificationType;
      title: string;
      message: string;
      severity?: NotificationSeverity;
      targetType?: string;
      targetId?: string;
      actionUrl?: string;
      metadata?: any;
    }>,
  ): Promise<number> {
    const notificationData = notifications.map((notif) => ({
      type: notif.type,
      title: notif.title,
      message: notif.message,
      severity: notif.severity || NotificationSeverity.INFO,
      targetType: notif.targetType,
      targetId: notif.targetId,
      actionUrl: notif.actionUrl,
      metadata: notif.metadata ? JSON.stringify(notif.metadata) : null,
    }));

    const result = await (prisma as any).systemNotification.createMany({
      data: notificationData,
    });

    return result.count;
  }

  /**
   * Get unread notification count for specific target
   */
  async getUnreadCount(
    targetType?: string,
    targetId?: string,
  ): Promise<number> {
    const where: any = { isRead: false };

    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;

    return (prisma as any).systemNotification.count({ where });
  }

  /**
   * Private helper methods
   */
  private buildWhereClause(filters: NotificationFilters): any {
    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.severity) {
      where.severity = filters.severity;
    }

    if (filters.targetType) {
      where.targetType = filters.targetType;
    }

    if (filters.targetId) {
      where.targetId = filters.targetId;
    }

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    return where;
  }

  private mapNotification(notification: any): SystemNotificationData {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      severity: notification.severity,
      targetType: notification.targetType,
      targetId: notification.targetId,
      isRead: notification.isRead,
      actionUrl: notification.actionUrl,
      metadata: notification.metadata
        ? JSON.parse(notification.metadata)
        : null,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
    };
  }
}

export const notificationService = new NotificationService();
