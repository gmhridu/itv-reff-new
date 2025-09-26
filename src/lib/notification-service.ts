import { Server } from 'socket.io';
import { db } from '@/lib/db';
import { NotificationType, NotificationSeverity } from '@prisma/client';
import { CreateNotificationInput } from '@/types/notifications';

let io: Server | null = null;

export const setSocketIO = (socketIO: Server) => {
  io = socketIO;
};

export class NotificationService {
  static async createNotification(data: CreateNotificationInput, userId?: string) {
    try {
      // Save notification to database
      const notification = await db.systemNotification.create({
        data: {
          type: data.type,
          title: data.title,
          message: data.message,
          severity: data.severity || 'INFO',
          targetType: userId ? 'USER' : undefined,
          targetId: userId,
          actionUrl: data.actionUrl,
          metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
        },
      });

      // Emit real-time notification if user ID is provided
      if (userId && io) {
        const payload = {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          severity: notification.severity,
          createdAt: notification.createdAt,
          actionUrl: notification.actionUrl || undefined,
        };
        
        // Emit to specific user room
        io.to(`user_${userId}`).emit('notification', payload);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId: string, limit: number = 10) {
    try {
      const notifications = await db.systemNotification.findMany({
        where: {
          targetType: 'USER',
          targetId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      return notifications.map(notification => ({
        ...notification,
        metadata: notification.metadata ? JSON.parse(notification.metadata) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await db.systemNotification.update({
        where: {
          id: notificationId,
          targetId: userId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId: string) {
    try {
      const notifications = await db.systemNotification.updateMany({
        where: {
          targetId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return notifications;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  static async emitToUser(userId: string, data: any) {
    try {
      if (!io) {
        console.warn('Socket.IO not initialized, cannot emit to user');
        return;
      }

      io.to(`user_${userId}`).emit('notification', data);
    } catch (error) {
      console.error('Error emitting to user:', error);
      throw error;
    }
  }

  static async emitToRoom(room: string, data: any) {
    try {
      if (!io) {
        console.warn('Socket.IO not initialized, cannot emit to room');
        return;
      }

      io.to(room).emit('notification', data);
    } catch (error) {
      console.error('Error emitting to room:', error);
      throw error;
    }
  }
}