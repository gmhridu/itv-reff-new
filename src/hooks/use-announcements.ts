import { useState, useEffect } from "react";

interface UserAnnouncement {
  id: string;
  userId: string;
  announcementId: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  targetType: string;
  targetId?: string;
  scheduleType: string;
  scheduledAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useAnnouncements(userId: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's unread announcements
  const fetchUnreadAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/user/announcements/unread");
      const data = await response.json();
      
      if (data.success) {
        setAnnouncements(data.data.announcements);
        setUnreadCount(data.data.count);
      } else {
        setError(data.error || "Failed to fetch announcements");
      }
    } catch (err) {
      setError("Failed to fetch announcements");
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  // Mark an announcement as read
  const markAsRead = async (announcementId: string) => {
    try {
      const response = await fetch(`/api/user/announcements/${announcementId}/read`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setUnreadCount(prev => Math.max(0, prev - 1));
        setAnnouncements(prev => 
          prev.filter(announcement => announcement.id !== announcementId)
        );
      } else {
        console.error("Error marking announcement as read:", data.error);
      }
    } catch (err) {
      console.error("Error marking announcement as read:", err);
    }
  };

  // Mark all announcements as read
  const markAllAsRead = async () => {
    try {
      // We would need a separate endpoint for this in a full implementation
      // For now, we'll just update local state
      setUnreadCount(0);
      setAnnouncements([]);
    } catch (err) {
      console.error("Error marking all announcements as read:", err);
    }
  };

  // Initialize by fetching unread announcements
  useEffect(() => {
    if (userId) {
      fetchUnreadAnnouncements();
    }
  }, [userId]);

  return {
    announcements,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchUnreadAnnouncements
  };
}