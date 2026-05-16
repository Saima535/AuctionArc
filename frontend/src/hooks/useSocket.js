import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

/**
 * Hook for Socket.io connection and real-time messaging
 */
export function useSocket(token, onNewMessage, onUserOnline, onUserOffline, onUserTyping) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    // Initialize Socket.io connection
    socketRef.current = io(
      process.env.NEXT_PUBLIC_SOCKET_URL ||
        process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/v1$/, "") ||
        process.env.NEXT_PUBLIC_API_BASE_URL,
      {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      },
    );

    // Handle new messages
    socketRef.current.on("new-message", (message) => {
      onNewMessage && onNewMessage(message);
    });

    // Handle user online
    socketRef.current.on("user-online", (data) => {
      onUserOnline && onUserOnline(data.userId);
    });

    // Handle user offline
    socketRef.current.on("user-offline", (data) => {
      onUserOffline && onUserOffline(data.userId);
    });

    // Handle typing indicator
    socketRef.current.on("user-typing", (data) => {
      onUserTyping && onUserTyping(data.userId, data.conversationId, true);
    });

    socketRef.current.on("user-stopped-typing", (data) => {
      onUserTyping && onUserTyping(data.userId, data.conversationId, false);
    });

    // Handle connection errors
    socketRef.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token, onNewMessage, onUserOnline, onUserOffline, onUserTyping]);

  // Join conversation room
  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current) {
      socketRef.current.emit("join-conversation", conversationId);
    }
  }, []);

  // Leave conversation room
  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current) {
      socketRef.current.emit("leave-conversation", conversationId);
    }
  }, []);

  // Send message via socket
  const emitMessage = useCallback((conversationId, text) => {
    if (socketRef.current) {
      socketRef.current.emit("send-message", { conversationId, text });
    }
  }, []);

  // Mark messages as read
  const markAsRead = useCallback((conversationId) => {
    if (socketRef.current) {
      socketRef.current.emit("mark-as-read", { conversationId });
    }
  }, []);

  // Typing indicator
  const emitTyping = useCallback((conversationId) => {
    if (socketRef.current) {
      socketRef.current.emit("typing", { conversationId });
    }
  }, []);

  // Stop typing indicator
  const emitStopTyping = useCallback((conversationId) => {
    if (socketRef.current) {
      socketRef.current.emit("stop-typing", { conversationId });
    }
  }, []);

  return {
    joinConversation,
    leaveConversation,
    emitMessage,
    markAsRead,
    emitTyping,
    emitStopTyping,
  };
}
