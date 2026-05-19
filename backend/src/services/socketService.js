/**
 * Manages Socket.io presence, room membership, and realtime messaging broadcasts.
 */
import { Server } from "socket.io";
import { Message } from "../models/Message.js";
import { Conversation } from "../models/Conversation.js";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { createNotification } from "./notificationService.js";

// Store active user connections
const activeUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId

function sameId(left, right) {
  return String(left) === String(right);
}

function profileImageUrl(user) {
  return user?.profilePicture?.url || "";
}

/**
 * Initialize Socket.io server
 */
export function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, env.jwtSecret);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Connection event
  io.on("connection", (socket) => {
    const userId = socket.userId;
    
    // Track active user
    activeUsers.set(userId, socket.id);
    userSockets.set(socket.id, userId);

    console.log(`User ${userId} connected with socket ${socket.id}`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Broadcast user online status
    socket.broadcast.emit("user-online", { userId, socketId: socket.id });

    /**
     * Join a conversation room
     */
    socket.on("join-conversation", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${userId} joined conversation ${conversationId}`);

      // Notify others in conversation
      socket.to(`conversation:${conversationId}`).emit("user-joined", {
        userId,
        conversationId,
      });
    });

    /**
     * Leave a conversation room
     */
    socket.on("leave-conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);

      // Notify others in conversation
      socket.to(`conversation:${conversationId}`).emit("user-left", {
        userId,
        conversationId,
      });
    });

    /**
     * Send a real-time message
     */
    socket.on("send-message", async (data) => {
      try {
        const { conversationId, text } = data;

        if (!conversationId || !text) {
          return socket.emit("message-error", {
            error: "Conversation ID and message text are required",
          });
        }

        // Get conversation to find the other participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return socket.emit("message-error", { error: "Conversation not found" });
        }

        // Verify user is participant
        if (!conversation.participants.some((participantId) => sameId(participantId, userId))) {
          return socket.emit("message-error", {
            error: "Unauthorized: Not a conversation participant",
          });
        }

        // Determine receiver
        const receiverId = sameId(conversation.buyerId, userId)
          ? conversation.sellerId
          : conversation.buyerId;

        // Save message to database
        const message = new Message({
          conversationId,
          senderId: userId,
          receiverId,
          text: text.trim(),
          type: "text",
        });

        await message.save();

        // Update conversation
        conversation.lastMessage = text.trim().substring(0, 100);
        conversation.lastMessageAt = new Date();
        conversation.lastMessageSenderId = userId;

        // Update read timestamp for sender
        if (String(conversation.buyerId) === String(userId)) {
          conversation.buyerLastReadAt = new Date();
        } else {
          conversation.sellerLastReadAt = new Date();
        }

        await conversation.save();

        // Get sender info
        const [sender, receiver] = await Promise.all([
          User.findById(userId).select("name profilePicture role"),
          User.findById(receiverId).select("role"),
        ]);

        // Format message for broadcast
        const formattedMessage = {
          id: message._id,
          conversationId,
          senderId: userId,
          senderName: sender.name,
          senderAvatar: profileImageUrl(sender),
          senderRole: sender.role,
          receiverId,
          text: message.text,
          type: "text",
          isRead: false,
          createdAt: message.createdAt,
        };

        if (receiver) {
          await createNotification({
            userId: receiverId,
            title: `New message from ${sender.name}`,
            body: text.trim().substring(0, 100),
            type: "message",
            href: receiver.role === "Seller" ? "/seller/messages" : "/bidder/messages",
            metadata: {
              conversationId: String(conversationId),
              senderId: String(userId),
            },
          });
        }

        // Emit to all in conversation room
        io.to(`conversation:${conversationId}`).emit("new-message", formattedMessage);

        // Emit to receiver's personal room (for notification)
        io.to(`user:${receiverId}`).emit("message-received", {
          conversationId,
          senderId: userId,
          senderName: sender.name,
          text: text.substring(0, 50),
        });

        // Acknowledge to sender
        socket.emit("message-sent", { messageId: message._id });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message-error", { error: "Failed to send message" });
      }
    });

    /**
     * Mark messages as read
     */
    socket.on("mark-as-read", async (data) => {
      try {
        const { conversationId } = data;

        // Mark all messages as read for this user in this conversation
        await Message.updateMany(
          {
            conversationId,
            receiverId: userId,
            isRead: false,
          },
          {
            isRead: true,
            readAt: new Date(),
          },
        );

        const conversation = await Conversation.findById(conversationId);

        if (conversation) {
          if (sameId(conversation.buyerId, userId)) {
            conversation.buyerLastReadAt = new Date();
          } else {
            conversation.sellerLastReadAt = new Date();
          }

          await conversation.save();
        }

        // Notify conversation of read status
        io.to(`conversation:${conversationId}`).emit("messages-read", {
          conversationId,
          userId,
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    /**
     * Typing indicator
     */
    socket.on("typing", (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit("user-typing", {
        userId,
        conversationId,
      });
    });

    /**
     * Stop typing indicator
     */
    socket.on("stop-typing", (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit("user-stopped-typing", {
        userId,
        conversationId,
      });
    });

    /**
     * Disconnect event
     */
    socket.on("disconnect", () => {
      activeUsers.delete(userId);
      userSockets.delete(socket.id);

      console.log(`User ${userId} disconnected`);

      // Broadcast user offline status
      socket.broadcast.emit("user-offline", { userId });
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });
  });

  return io;
}

/**
 * Get active user's socket ID
 */
export function getActiveSocketId(userId) {
  return activeUsers.get(userId);
}

/**
 * Check if user is online
 */
export function isUserOnline(userId) {
  return activeUsers.has(userId);
}

/**
 * Get all active users
 */
export function getActiveUsers() {
  return Array.from(activeUsers.entries()).map(([userId, socketId]) => ({
    userId,
    socketId,
  }));
}

/**
 * Emit notification to specific user
 */
export function emitToUser(io, userId, eventName, data) {
  io.to(`user:${userId}`).emit(eventName, data);
}

/**
 * Emit notification to conversation
 */
export function emitToConversation(io, conversationId, eventName, data) {
  io.to(`conversation:${conversationId}`).emit(eventName, data);
}
