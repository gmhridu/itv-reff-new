import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { NotificationPayload } from "@/types/notifications";

interface UseNotificationsProps {
  userId: string;
}

export function useNotifications({ userId }: UseNotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await fetch("/api/user/notifications?limit=50");
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      } else {
        console.error("Failed to fetch notifications:", data.error);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Fetch initial notifications
    fetchNotifications();

    // Initialize socket connection for real-time updates
    const socketInstance = io({
      path: "/api/socketio",
    });

    setSocket(socketInstance);

    // Add connection debugging
    socketInstance.on("connect", () => {
      console.log("Socket.IO connected:", socketInstance.id);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Socket.IO disconnected:", reason);
    });

    // Join user room
    socketInstance.emit("join_room", userId);

    // Listen for new notifications
    socketInstance.on("notification", (notification: NotificationPayload) => {
      console.log("Received real-time notification:", notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    // Listen for notification updates
    socketInstance.on("notification_read", (notificationId: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    // Set up polling fallback every 10 seconds to ensure notifications are updated
    // even if Socket.IO connection fails (shorter interval for better UX)
    const pollInterval = setInterval(() => {
      console.log("Polling for notifications (fallback)");
      fetchNotifications();
    }, 10000);

    // Cleanup
    return () => {
      socketInstance.disconnect();
      clearInterval(pollInterval);
    };
  }, [userId, fetchNotifications]);

  // Add activity-based refresh for withdrawal and other user activities
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Tab became visible, refreshing notifications");
        fetchNotifications();
      }
    };

    const handleFocus = () => {
      console.log("Window focused, refreshing notifications");
      fetchNotifications();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch("/api/user/notifications?action=mark-read", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId: id }),
      });

      const data = await response.json();

      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Emit to socket for real-time updates
        if (socket) {
          socket.emit("mark_notification_read", id);
        }
      } else {
        console.error("Failed to mark notification as read:", data.error);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        "/api/user/notifications?action=mark-all-read",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      const data = await response.json();

      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);

        // Emit to socket for real-time updates
        if (socket) {
          socket.emit("mark_all_notifications_read", userId);
        }
      } else {
        console.error("Failed to mark all notifications as read:", data.error);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
