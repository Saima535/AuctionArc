"use client";

import Image from "next/image";
import styles from "./ConversationList.module.css";

export default function ConversationList({
  conversations,
  unreadCount,
  activeId,
  currentRole,
  onlineUsers,
  onSelectConversation,
}) {
  function getOtherUser(conversation) {
    if (currentRole === "Seller") {
      return {
        name: conversation.buyerName,
        id: String(conversation.buyerId || ""),
        avatar: conversation.buyerAvatar,
      };
    }

    return {
      name: conversation.sellerName,
      id: String(conversation.sellerId || ""),
      avatar: conversation.sellerAvatar,
    };
  }

  function isUserOnline(userId) {
    return onlineUsers.has(String(userId));
  }

  if (!conversations.length) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Conversations</h2>
          {unreadCount > 0 ? <span className={styles.badge}>{unreadCount}</span> : null}
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
        {unreadCount > 0 ? <span className={styles.badge}>{unreadCount}</span> : null}
      </div>

      <div className={styles.list}>
        {conversations.map((conversation) => {
          const otherUser = getOtherUser(conversation);
          const isOnline = isUserOnline(otherUser.id);

          return (
            <button
              key={conversation.id}
              type="button"
              className={`${styles.item} ${
                activeId === String(conversation.id) ? styles.active : ""
              }`}
              onClick={() => onSelectConversation(conversation)}
            >
              <div className={styles.itemHeader}>
                <div className={styles.avatar}>
                  {otherUser.avatar ? (
                    <Image
                      src={otherUser.avatar}
                      alt={otherUser.name}
                      width={48}
                      height={48}
                      unoptimized
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {otherUser.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                  {isOnline ? <div className={styles.onlineIndicator} /> : null}
                </div>

                <div className={styles.info}>
                  <h3>{otherUser.name}</h3>
                  <p className={styles.lastMessage}>
                    {conversation.lastMessage || "No messages yet"}
                  </p>
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
                  {conversation.unreadCount ? (
                    <span className={styles.rowUnreadBadge}>
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
