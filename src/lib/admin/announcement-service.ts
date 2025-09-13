import { db } from "@/lib/db";
import { notificationService, NotificationType, NotificationSeverity } from "@/lib/admin/notification-service";
import { AdminUser } from "@/lib/admin-middleware";

export interface AnnouncementData {
  id?: string;
  title: string;
  message: string;
  imageUrl?: string;
  targetType?: string;
  targetId?: string;
  scheduleType?: string;
  scheduledAt?: Date;
  expiresAt?: Date;
  isActive?: boolean;
}

export interface UserAnnouncementData {
  id: string;
  userId: string;
  announcementId: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class AnnouncementService {
  /**
   * Create a new announcement
   */
  async createAnnouncement(
    admin: AdminUser,
    data: AnnouncementData
  ): Promise<any> {
    try {
      const announcement = await db.announcement.create({
        data: {
          title: data.title,
          message: data.message,
          imageUrl: data.imageUrl,
          targetType: data.targetType,
          targetId: data.targetId,
          scheduleType: data.scheduleType || "immediate",
          scheduledAt: data.scheduledAt,
          expiresAt: data.expiresAt,
          isActive: data.isActive !== undefined ? data.isActive : true,
          admin: {
            connect: {
              id: admin.id,
            },
          },
        },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // If this is an immediate announcement, send notifications to users
      if (data.scheduleType === "immediate" && data.isActive) {
        await this.sendAnnouncementNotifications(announcement);
      }

      return announcement;
    } catch (error) {
      console.error("Error creating announcement:", error);
      throw error;
    }
  }

  /**
   * Get all announcements with pagination
   */
  async getAnnouncements(
    page: number = 1,
    limit: number = 10,
    filters: { isActive?: boolean } = {}
  ): Promise<{ announcements: any[]; pagination: any }> {
    try {
      const skip = (page - 1) * limit;

      // Build where clause for filtering
      const where: any = {};
      
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      const [announcements, total] = await Promise.all([
        db.announcement.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        db.announcement.count({ where }),
      ]);

      return {
        announcements,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error fetching announcements:", error);
      throw error;
    }
  }

  /**
   * Get announcement by ID
   */
  async getAnnouncementById(id: string): Promise<any | null> {
    try {
      const announcement = await db.announcement.findUnique({
        where: { id },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return announcement;
    } catch (error) {
      console.error(`Error fetching announcement ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update an announcement
   */
  async updateAnnouncement(
    id: string,
    data: Partial<AnnouncementData>
  ): Promise<any> {
    try {
      const announcement = await db.announcement.update({
        where: { id },
        data: {
          title: data.title,
          message: data.message,
          imageUrl: data.imageUrl,
          targetType: data.targetType,
          targetId: data.targetId,
          scheduleType: data.scheduleType,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          isActive: data.isActive,
          updatedAt: new Date(),
        },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // If this is an immediate announcement and is now active, send notifications to users
      if (data.scheduleType === "immediate" && data.isActive && announcement.isActive) {
        await this.sendAnnouncementNotifications(announcement);
      }

      return announcement;
    } catch (error) {
      console.error(`Error updating announcement ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an announcement
   */
  async deleteAnnouncement(id: string): Promise<void> {
    try {
      await db.announcement.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`Error deleting announcement ${id}:`, error);
      throw error;
    }
  }

  /**
   * Send announcement notifications to users
   */
  async sendAnnouncementNotifications(announcement: any): Promise<void> {
    try {
      // Get all users
      const users = await db.user.findMany({
        select: {
          id: true,
        },
      });

      // Create notifications for each user
      const notifications = users.map((user) => ({
        type: NotificationType.SYSTEM_ALERT,
        title: announcement.title,
        message: announcement.message,
        severity: NotificationSeverity.INFO,
        targetType: "USER",
        targetId: user.id,
        actionUrl: "/announcements",
        metadata: announcement.imageUrl
          ? JSON.stringify({ imageUrl: announcement.imageUrl })
          : null,
      }));

      // Create user announcement records
      const userAnnouncements = users.map((user) => ({
        userId: user.id,
        announcementId: announcement.id,
      }));

      // Create notifications in batches
      for (let i = 0; i < notifications.length; i += 100) {
        const batch = notifications.slice(i, i + 100);
        await db.systemNotification.createMany({
          data: batch,
        });
      }

      // Create user announcement records in batches
      for (let i = 0; i < userAnnouncements.length; i += 100) {
        const batch = userAnnouncements.slice(i, i + 100);
        await db.userAnnouncement.createMany({
          data: batch,
        });
      }
    } catch (error) {
      console.error("Error sending announcement notifications:", error);
      throw error;
    }
  }

  /**
   * Mark announcement as read for a user
   */
  async markAnnouncementAsRead(userId: string, announcementId: string): Promise<UserAnnouncementData> {
    try {
      let userAnnouncement = await db.userAnnouncement.findUnique({
        where: {
          userId_announcementId: {
            userId,
            announcementId,
          },
        },
      });

      if (!userAnnouncement) {
        userAnnouncement = await db.userAnnouncement.create({
          data: {
            userId,
            announcementId,
            isRead: true,
            readAt: new Date(),
          },
        });
      } else if (!userAnnouncement.isRead) {
        userAnnouncement = await db.userAnnouncement.update({
          where: {
            id: userAnnouncement.id,
          },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });
      }

      return userAnnouncement as UserAnnouncementData;
    } catch (error) {
      console.error(`Error marking announcement ${announcementId} as read for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user has seen an announcement
   */
  async hasUserSeenAnnouncement(userId: string, announcementId: string): Promise<boolean> {
    try {
      const userAnnouncement = await db.userAnnouncement.findUnique({
        where: {
          userId_announcementId: {
            userId,
            announcementId,
          },
        },
      });

      return !!userAnnouncement && userAnnouncement.isRead;
    } catch (error) {
      console.error(`Error checking if user ${userId} has seen announcement ${announcementId}:`, error);
      return false;
    }
  }

  /**
   * Get unread announcements for a user
   */
  async getUnreadAnnouncementsForUser(userId: string): Promise<any[]> {
    try {
      // Get all active announcements
      const activeAnnouncements = await db.announcement.findMany({
        where: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
          ],
        },
      });

      // Filter out announcements the user has already seen
      const unreadAnnouncements: any[] = [];
      for (const announcement of activeAnnouncements) {
        const hasSeen = await this.hasUserSeenAnnouncement(userId, announcement.id);
        if (!hasSeen) {
          unreadAnnouncements.push(announcement);
        }
      }

      return unreadAnnouncements;
    } catch (error) {
      console.error(`Error fetching unread announcements for user ${userId}:`, error);
      throw error;
    }
  }
}

export const announcementService = new AnnouncementService();