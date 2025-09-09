import { Server, Socket } from "socket.io";
import { NotificationService, setSocketIO } from "@/lib/notification-service";

interface ClientToServerEvents {
  join_room: (userId: string) => void;
  mark_notification_read: (notificationId: string) => void;
  mark_all_notifications_read: (userId: string) => void;
  message: (msg: { text: string; senderId: string }) => void;
}

interface ServerToClientEvents {
  message: (payload: {
    text: string;
    senderId: string;
    timestamp: string;
  }) => void;
  notification: (payload: any) => void;
  notification_read: (notificationId: string) => void;
}

export const setupSocket = (io: Server) => {
  // Set the socket IO instance in notification service
  setSocketIO(io);

  io.on(
    "connection",
    (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
      console.log("Client connected:", socket.id);

      // Handle user joining a room
      socket.on("join_room", (userId: string) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined room user_${userId}`);

        // Send confirmation that user joined the room
        socket.emit("message", {
          text: `Connected to notification system`,
          senderId: "system",
          timestamp: new Date().toISOString(),
        });
      });

      // Handle notification read events
      socket.on("mark_notification_read", (notificationId: string) => {
        console.log(`Marking notification ${notificationId} as read`);
        // Broadcast to all clients in user rooms that this notification was read
        socket.broadcast.emit("notification_read", notificationId);
      });

      // Handle mark all notifications read
      socket.on("mark_all_notifications_read", (userId: string) => {
        console.log(`Marking all notifications as read for user ${userId}`);
        // Broadcast to all clients in user room
        io.to(`user_${userId}`).emit("notification_read", "all");
      });

      // Handle messages (for testing/debugging)
      socket.on("message", (msg: { text: string; senderId: string }) => {
        // Echo: broadcast message only the client who send the message
        socket.emit("message", {
          text: `Echo: ${msg.text}`,
          senderId: "system",
          timestamp: new Date().toISOString(),
        });
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    },
  );
};
