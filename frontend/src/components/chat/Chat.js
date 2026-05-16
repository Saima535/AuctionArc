"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useChatRoom } from "@/hooks/useChatRoom";
import { useSocket } from "@/hooks/useSocket";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import styles from "./Chat.module.css";

export default function Chat({ mode = "default", readOnly = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const {
    conversations,
    setConversations,
    messages,
    setMessages,
    loading,
    error,
    unreadCount,
    setUnreadCount,
    fetchConversations,
    fetchMessages,
    sendMessage,
    fetchUnreadCount,
  } = useChatRoom(mode);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const requestedConversationId = searchParams.get("conversation") || "";
  const effectiveSelectedConversationId = useMemo(() => {
    if (
      selectedConversationId &&
      conversations.some((conversation) => String(conversation.id) === String(selectedConversationId))
    ) {
      return String(selectedConversationId);
    }

    if (
      requestedConversationId &&
      conversations.some((conversation) => String(conversation.id) === String(requestedConversationId))
    ) {
      return String(requestedConversationId);
    }

    return conversations[0]?.id ? String(conversations[0].id) : "";
  }, [conversations, requestedConversationId, selectedConversationId]);

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => String(conversation.id) === String(effectiveSelectedConversationId),
      ) || null,
    [conversations, effectiveSelectedConversationId],
  );
  const activeUnreadCount = selectedConversation?.unreadCount || 0;

  const moveConversationToTop = useCallback(
    (conversationId, patch = {}) => {
      setConversations((current) => {
        const next = current.map((conversation) =>
          String(conversation.id) === String(conversationId)
            ? { ...conversation, ...patch }
            : conversation,
        );
        const activeConversation = next.find(
          (conversation) => String(conversation.id) === String(conversationId),
        );
        const rest = next.filter(
          (conversation) => String(conversation.id) !== String(conversationId),
        );

        return activeConversation ? [activeConversation, ...rest] : next;
      });
    },
    [setConversations],
  );

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
  }, [fetchConversations, fetchUnreadCount]);

  useEffect(() => {
    if (!effectiveSelectedConversationId) {
      setMessages([]);
      return;
    }

    fetchMessages(effectiveSelectedConversationId);
  }, [effectiveSelectedConversationId, fetchMessages, setMessages]);

  const { joinConversation, leaveConversation, markAsRead, emitTyping, emitStopTyping } =
    useSocket(
      token,
      useCallback(
        (message) => {
          const conversationId = String(message.conversationId);
          const hasConversation = conversations.some(
            (conversation) => String(conversation.id) === conversationId,
          );

          if (!hasConversation) {
            fetchConversations();
          }

          moveConversationToTop(conversationId, {
            lastMessage: message.text,
            lastMessageAt: message.createdAt,
            lastMessageSenderName: message.senderName,
          });

          if (conversationId === String(effectiveSelectedConversationId)) {
            setMessages((current) => {
              if (current.some((item) => String(item.id) === String(message.id))) {
                return current;
              }

              return [...current, message];
            });

            moveConversationToTop(conversationId, { unreadCount: 0 });
            return;
          }

          setConversations((current) =>
            current.map((conversation) =>
              String(conversation.id) === conversationId
                ? {
                    ...conversation,
                    unreadCount: (conversation.unreadCount || 0) + 1,
                  }
                : conversation,
            ),
          );
          setUnreadCount((current) => current + 1);
        },
        [
          conversations,
          fetchConversations,
          moveConversationToTop,
          effectiveSelectedConversationId,
          setConversations,
          setMessages,
          setUnreadCount,
        ],
      ),
      useCallback((userId) => {
        setOnlineUsers((current) => new Set([...current, String(userId)]));
      }, []),
      useCallback((userId) => {
        setOnlineUsers((current) => {
          const next = new Set(current);
          next.delete(String(userId));
          return next;
        });
      }, []),
      null,
      useCallback(() => {
        fetchConversations();
        fetchUnreadCount();
      }, [fetchConversations, fetchUnreadCount]),
    );

  useEffect(() => {
    if (!effectiveSelectedConversationId || !messages.length) {
      return;
    }

    markAsRead(effectiveSelectedConversationId);
  }, [effectiveSelectedConversationId, markAsRead, messages.length]);

  useEffect(() => {
    if (!effectiveSelectedConversationId) {
      return;
    }

    joinConversation(effectiveSelectedConversationId);
    markAsRead(effectiveSelectedConversationId);

    return () => {
      leaveConversation(effectiveSelectedConversationId);
    };
  }, [
    effectiveSelectedConversationId,
    joinConversation,
    leaveConversation,
    markAsRead,
  ]);

  useEffect(() => {
    if (!effectiveSelectedConversationId || !activeUnreadCount) {
      return;
    }

    moveConversationToTop(effectiveSelectedConversationId, { unreadCount: 0 });
    setUnreadCount((current) => Math.max(current - activeUnreadCount, 0));
  }, [
    activeUnreadCount,
    effectiveSelectedConversationId,
    moveConversationToTop,
    setUnreadCount,
  ]);

  async function handleSendMessage(conversationId, text) {
    const newMessage = await sendMessage(conversationId, text);

    moveConversationToTop(conversationId, {
      lastMessage: newMessage.text,
      lastMessageAt: newMessage.createdAt,
      lastMessageSenderName: newMessage.senderName,
      unreadCount: 0,
    });

    return newMessage;
  }

  function handleSelectConversation(conversation) {
    const nextId = String(conversation.id);
    const params = new URLSearchParams(searchParams.toString());
    params.set("conversation", nextId);
    setSelectedConversationId(nextId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <ConversationList
          conversations={conversations}
          unreadCount={unreadCount}
          activeId={effectiveSelectedConversationId}
          currentRole={user?.role}
          onlineUsers={onlineUsers}
          onSelectConversation={handleSelectConversation}
        />
      </div>
      <div className={styles.main}>
        <ChatWindow
          conversation={selectedConversation}
          messages={messages}
          loading={loading}
          error={error}
          currentUser={user}
          readOnly={readOnly}
          onSendMessage={handleSendMessage}
          onTyping={emitTyping}
          onStopTyping={emitStopTyping}
        />
      </div>
    </div>
  );
}
