"use client";

import { useEffect, useState } from "react";
import { useChatRoom } from "@/hooks/useChatRoom";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";
import styles from "./ConversationList.module.css";

export default function ConversationList({ onSelectConversation }) {
  const { user, token } = useAuth();
  const { conversations, fetchConversations, unreadCount, fetchUnreadCount } = useChatRoom();
  const [activeId, setActiveId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const { joinConversation } = useSocket(
    token,
    null,
    (userId) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    },
    (userId) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    },
    null,
  );

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleSelectConversation = (conversation) => {
    setActiveId(conversation.id);
    joinConversation(conversation.id);
    onSelectConversation(conversation);
  };

  const getOtherUser = (conversation) => {
    if (user?.role === "Seller") {
      return {
        name: conversation.buyerName,
        id: conversation.buyerId,
        avatar: conversation.buyerAvatar,
      };
    }
    return {
      name: conversation.sellerName,
      id: conversation.sellerId,
      avatar: conversation.sellerAvatar,
    };
  };

  const isUserOnline = (userId) => onlineUsers.has(userId);

  if (conversations.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Conversations</h2>
          {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
        </div>
        <div className={styles.empty}>
          <p>No conversations yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Conversations</h2>
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </div>

      <div className={styles.list}>
        {conversations.map((conversation) => {
          const otherUser = getOtherUser(conversation);
          const isOnline = isUserOnline(otherUser.id);

          return (
            <div
              key={conversation.id}
              className={`${styles.item} ${activeId === conversation.id ? styles.active : ""}`}
              onClick={() => handleSelectConversation(conversation)}
            >
              <div className={styles.itemHeader}>
                <div className={styles.avatar}>
                  {otherUser.avatar ? (
                    <img src={otherUser.avatar} alt={otherUser.name} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {otherUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isOnline && <div className={styles.onlineIndicator} />}
                </div>

                <div className={styles.info}>
                  <h3>{otherUser.name}</h3>
                  <p className={styles.lastMessage}>{conversation.lastMessage || "No messages yet"}</p>
                </div>

                <div className={styles.meta}>
                  <span className={styles.time}>
                    {conversation.lastMessageAt
                      ? new Date(conversation.lastMessageAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
