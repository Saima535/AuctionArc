import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiRequest } from "@/lib/api";

/**
 * Hook for managing chat conversations and messages
 */
export function useChatRoom() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch user's conversations
  const fetchConversations = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const endpoint =
        user.role === "Seller" ? "/conversations/seller" : "/conversations/buyer";

      const response = await apiRequest(endpoint);
      setConversations(response.data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId, page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiRequest(
        `/conversations/${conversationId}/messages?page=${page}&limit=50`,
      );

      setMessages(response.data?.messages || []);
      setActiveConversation(conversationId);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get or create conversation
  const getOrCreateConversation = useCallback(async (otherUserId, auctionId = null, listingId = null) => {
    try {
      const response = await apiRequest("/conversations", {
        method: "POST",
        body: {
          otherUserId,
          auctionId,
          listingId,
        },
      });

      const newConversation = response.data;
      setActiveConversation(newConversation.id);

      setConversations((prev) => {
        const exists = prev.find((c) => c.id === newConversation.id);
        if (exists) {
          return prev.map((c) => (c.id === newConversation.id ? newConversation : c));
        }
        return [newConversation, ...prev];
      });

      return newConversation;
    } catch (err) {
      setError(err.message);
      console.error("Error creating conversation:", err);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (conversationId, text) => {
    try {
      const response = await apiRequest(`/conversations/${conversationId}/messages`, {
        method: "POST",
        body: {
          text,
        },
      });

      const newMessage = response.data;

      // Add message to local state
      setMessages((prev) => [...prev, newMessage]);

      // Update last message in conversation
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              lastMessage: text.substring(0, 100),
              lastMessageAt: new Date().toISOString(),
              lastMessageSenderName: user?.name,
            };
          }
          return conv;
        }),
      );

      return newMessage;
    } catch (err) {
      setError(err.message);
      console.error("Error sending message:", err);
      throw err;
    }
  }, [user?.name]);

  // Archive conversation
  const archiveConversation = useCallback(async (conversationId) => {
    try {
      await apiRequest(`/conversations/${conversationId}/archive`, {
        method: "PATCH",
      });

      setConversations((prev) =>
        prev.filter((c) => c.id !== conversationId),
      );

      if (activeConversation === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error archiving conversation:", err);
    }
  }, [activeConversation]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const response = await apiRequest("/conversations/unread-count");
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, [user]);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchUnreadCount();
    }
  }, [user, fetchConversations, fetchUnreadCount]);

  return {
    conversations,
    activeConversation,
    messages,
    loading,
    error,
    unreadCount,
    fetchConversations,
    fetchMessages,
    getOrCreateConversation,
    sendMessage,
    archiveConversation,
    fetchUnreadCount,
  };
}
