import { Server, Socket } from 'socket.io';
import { NotificationService, setSocketIO } from '@/lib/notification-service';

interface ClientToServerEvents {
  join_room: (userId: string) => void;
  mark_notification_read: (notificationId: string) => void;
  message: (msg: { text: string; senderId: string }) => void;
}

interface ServerToClientEvents {
  message: (payload: { text: string; senderId: string; timestamp: string }) => void;
  notification: (payload: any) => void;
}

export const setupSocket = (io: Server) => {
  // Set the socket IO instance in notification service
  setSocketIO(io);
  
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log('Client connected:', socket.id);
    
    // Handle user joining a room
    socket.on('join_room', (userId: string) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined room user_${userId}`);
    });

    // Handle messages
    socket.on('message', (msg: { text: string; senderId: string }) => {
      // Echo: broadcast message only the client who send the message
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to WebSocket Echo Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};