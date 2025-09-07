import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { NotificationPayload } from '@/types/notifications';

interface UseNotificationsProps {
  userId: string;
}

export function useNotifications({ userId }: UseNotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io({
      path: '/api/socketio',
    });
    
    setSocket(socketInstance);

    // Join user room
    socketInstance.emit('join_room', userId);

    // Listen for notifications
    socketInstance.on('notification', (notification: NotificationPayload) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Cleanup
    return () => {
      socketInstance.disconnect();
    };
  }, [userId]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Emit to server
    if (socket) {
      socket.emit('mark_notification_read', id);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}