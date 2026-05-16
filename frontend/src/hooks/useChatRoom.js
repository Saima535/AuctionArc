import { useCallback, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiRequest } from "@/lib/api";

export function useChatRoom() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

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
    } catch (requestError) {
      setError(requestError.message);
      console.error("Error fetching conversations:", requestError);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (conversationId, page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiRequest(
        `/conversations/${conversationId}/messages?page=${page}&limit=50`,
      );

      setMessages(response.data?.messages || []);
      setActiveConversation(conversationId);
    } catch (requestError) {
      setError(requestError.message);
      console.error("Error fetching messages:", requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrCreateConversation = useCallback(
    async (otherUserId, auctionId = null, listingId = null) => {
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

        setConversations((current) => {
          const exists = current.find(
            (conversation) => String(conversation.id) === String(newConversation.id),
          );

          if (exists) {
            return current.map((conversation) =>
              String(conversation.id) === String(newConversation.id)
                ? newConversation
                : conversation,
            );
          }

          return [newConversation, ...current];
        });

        return newConversation;
      } catch (requestError) {
        setError(requestError.message);
        console.error("Error creating conversation:", requestError);
        return null;
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (conversationId, text) => {
      try {
        const response = await apiRequest(`/conversations/${conversationId}/messages`, {
          method: "POST",
          body: {
            text,
          },
        });

        const newMessage = response.data;
        setMessages((current) => [...current, newMessage]);

        setConversations((current) =>
          current.map((conversation) =>
            String(conversation.id) === String(conversationId)
              ? {
                  ...conversation,
                  lastMessage: text.substring(0, 100),
                  lastMessageAt: new Date().toISOString(),
                  lastMessageSenderName: user?.name,
                }
              : conversation,
          ),
        );

        return newMessage;
      } catch (requestError) {
        setError(requestError.message);
        console.error("Error sending message:", requestError);
        throw requestError;
      }
    },
    [user?.name],
  );

  const archiveConversation = useCallback(
    async (conversationId) => {
      try {
        await apiRequest(`/conversations/${conversationId}/archive`, {
          method: "PATCH",
        });

        setConversations((current) =>
          current.filter((conversation) => String(conversation.id) !== String(conversationId)),
        );

        if (String(activeConversation) === String(conversationId)) {
          setActiveConversation(null);
          setMessages([]);
        }
      } catch (requestError) {
        setError(requestError.message);
        console.error("Error archiving conversation:", requestError);
      }
    },
    [activeConversation],
  );

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const response = await apiRequest("/conversations/unread-count");
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (requestError) {
      console.error("Error fetching unread count:", requestError);
    }
  }, [user]);

  return {
    conversations,
    setConversations,
    activeConversation,
    setActiveConversation,
    messages,
    setMessages,
    loading,
    error,
    unreadCount,
    setUnreadCount,
    fetchConversations,
    fetchMessages,
    getOrCreateConversation,
    sendMessage,
    archiveConversation,
    fetchUnreadCount,
  };
}
