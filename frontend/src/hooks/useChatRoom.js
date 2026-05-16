import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

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
  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint =
        user?.role === "Seller" ? "/conversations/seller" : "/conversations/buyer";

      const response = await api.get(endpoint);
      setConversations(response.data.data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId, page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/conversations/${conversationId}/messages`, {
        params: { page, limit: 50 },
      });

      setMessages(response.data.data.messages);
      setActiveConversation(conversationId);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get or create conversation
  const getOrCreateConversation = async (otherUserId, auctionId = null) => {
    try {
      const response = await api.post("/conversations", {
        otherUserId,
        auctionId,
      });

      const newConversation = response.data.data;
      setActiveConversation(newConversation.id);

      // Add to conversations list if not already there
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
  };

  // Send message
  const sendMessage = async (conversationId, text) => {
    try {
      const response = await api.post(`/conversations/${conversationId}/messages`, {
        text,
      });

      const newMessage = response.data.data;

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
  };

  // Archive conversation
  const archiveConversation = async (conversationId) => {
    try {
      await api.patch(`/conversations/${conversationId}/archive`);

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
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/conversations/unread-count");
      setUnreadCount(response.data.data.unreadCount);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchUnreadCount();
    }
  }, [user]);

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
