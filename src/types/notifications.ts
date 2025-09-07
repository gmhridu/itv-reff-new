import { NotificationType, NotificationSeverity } from '@prisma/client';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  severity?: NotificationSeverity;
  userId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  createdAt: Date;
  actionUrl?: string;
  isRead?: boolean;
}