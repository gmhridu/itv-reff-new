import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { NotificationPayload } from "@/types/notifications";

interface UseNotificationsProps {
  userId: string;
}

interface CachedData {
  notifications: NotificationPayload[];
  unreadCount: number;
  timestamp: number;
}

export function useNotifications({ userId }: UseNotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Cache and request management
  const cacheRef = useRef<CachedData | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRequestInProgressRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());

  // Cache configuration
  const CACHE_DURATION = 30000; // 30 seconds
  const FAST_POLL_INTERVAL = 15000; // 15 seconds when visible
  const SLOW_POLL_INTERVAL = 60000; // 60 seconds when hidden
  const ACTIVITY_THRESHOLD = 300000; // 5 minutes of inactivity

  // Check if cached data is still fresh
  const isCacheValid = useCallback(() => {
    if (!cacheRef.current) return false;
    return Date.now() - cacheRef.current.timestamp < CACHE_DURATION;
  }, []);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Check if user is active
  const isUserActive = useCallback(() => {
    return Date.now() - lastActivityRef.current < ACTIVITY_THRESHOLD;
  }, []);

  // Fetch notifications from API with caching and deduplication
  const fetchNotifications = useCallback(async (force = false) => {
    if (!userId) return;

    // Return cached data if valid and not forced
    if (!force && isCacheValid() && cacheRef.current) {
      setNotifications(cacheRef.current.notifications);
      setUnreadCount(cacheRef.current.unreadCount);
      setLoading(false);
      return;
    }

    // Prevent concurrent requests
    if (isRequestInProgressRef.current) {
      console.log("Request already in progress, skipping duplicate call");
      return;
    }

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    isRequestInProgressRef.current = true;
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      console.log("Fetching notifications from API");

      const response = await fetch("/api/user/notifications?limit=50", {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const newData = {
          notifications: data.data.notifications,
          unreadCount: data.data.unreadCount,
          timestamp: Date.now(),
        };

        // Update cache
        cacheRef.current = newData;

        setNotifications(newData.notifications);
        setUnreadCount(newData.unreadCount);

        console.log(`Loaded ${newData.notifications.length} notifications`);
      } else {
        console.error("Failed to fetch notifications:", data.error);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Error fetching notifications:", error);
      }
    } finally {
      isRequestInProgressRef.current = false;
      abortControllerRef.current = null;
      setLoading(false);
    }
  }, [userId, isCacheValid]);

  // Intelligent polling based on visibility and activity
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const poll = () => {
      if (document.visibilityState === "visible" && isUserActive()) {
        console.log("Polling for notifications (active tab)");
        fetchNotifications();
      } else {
        console.log("Skipping poll (inactive tab or user)");
      }
    };

    // Initial poll
    poll();

    // Set up interval based on visibility
    pollIntervalRef.current = setInterval(poll, FAST_POLL_INTERVAL);
  }, [fetchNotifications, isUserActive]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Fetch initial notifications
    fetchNotifications();

    // Initialize socket connection for real-time updates
    const socketInstance = io({
      path: "/api/socketio",
      transports: ["websocket", "polling"],
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
      updateActivity();

      // Update cache and state
      if (cacheRef.current) {
        cacheRef.current = {
          ...cacheRef.current,
          notifications: [notification, ...cacheRef.current.notifications],
          unreadCount: cacheRef.current.unreadCount + 1,
          timestamp: Date.now(),
        };
      }

      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    // Listen for notification updates
    socketInstance.on("notification_read", (notificationId: string) => {
      updateActivity();

      // Update cache and state
      if (cacheRef.current) {
        const updatedNotifications = cacheRef.current.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        );
        cacheRef.current = {
          ...cacheRef.current,
          notifications: updatedNotifications,
          unreadCount: Math.max(0, cacheRef.current.unreadCount - 1),
          timestamp: Date.now(),
        };
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    // Start intelligent polling
    startPolling();

    // Cleanup
    return () => {
      socketInstance.disconnect();
      stopPolling();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [userId, fetchNotifications, updateActivity, startPolling, stopPolling]);

  // Handle visibility and focus changes for intelligent polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      updateActivity();

      if (document.visibilityState === "visible") {
        console.log("Tab became visible, refreshing notifications");
        fetchNotifications(true); // Force refresh when tab becomes visible
        startPolling();
      } else {
        console.log("Tab became hidden, slowing down polling");
        // Keep polling but at a slower rate when hidden
        stopPolling();
        pollIntervalRef.current = setInterval(() => {
          if (isUserActive()) {
            fetchNotifications();
          }
        }, SLOW_POLL_INTERVAL);
      }
    };

    const handleFocus = () => {
      console.log("Window focused, updating activity");
      updateActivity();
    };

    const handleBeforeUnload = () => {
      console.log("Page unloading, cleaning up");
      stopPolling();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopPolling();
    };
  }, [fetchNotifications, updateActivity, startPolling, stopPolling, isUserActive]);

  const markAsRead = async (id: string) => {
    try {
      updateActivity();

      const response = await fetch("/api/user/notifications?action=mark-read", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId: id }),
      });

      const data = await response.json();

      if (data.success) {
        // Update cache first for immediate UI feedback
        if (cacheRef.current) {
          const updatedNotifications = cacheRef.current.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          );
          cacheRef.current = {
            ...cacheRef.current,
            notifications: updatedNotifications,
            unreadCount: Math.max(0, cacheRef.current.unreadCount - 1),
            timestamp: Date.now(),
          };
        }

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
      updateActivity();

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
        // Update cache first for immediate UI feedback
        if (cacheRef.current) {
          cacheRef.current = {
            ...cacheRef.current,
            notifications: cacheRef.current.notifications.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
            timestamp: Date.now(),
          };
        }

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
