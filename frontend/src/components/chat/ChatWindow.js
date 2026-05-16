"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import MessageItem from "./MessageItem";
import styles from "./ChatWindow.module.css";

export default function ChatWindow({
  conversation,
  messages,
  loading,
  error,
  currentUser,
  readOnly,
  onSendMessage,
  onTyping,
  onStopTyping,
}) {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  async function handleSendMessage(event) {
    event.preventDefault();

    if (!inputValue.trim() || !conversation?.id) {
      return;
    }

    try {
      setIsSending(true);
      onStopTyping?.(conversation.id);

      await onSendMessage(conversation.id, inputValue);
      setInputValue("");
    } catch (requestError) {
      console.error("Error sending message:", requestError);
    } finally {
      setIsSending(false);
    }
  }

  function handleTyping(event) {
    const nextValue = event.target.value;
    setInputValue(nextValue);

    if (!conversation?.id) {
      return;
    }

    onTyping?.(conversation.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping?.(conversation.id);
    }, 2000);
  }

  if (!conversation) {
    return (
      <div className={styles.empty}>
        <p>Select a conversation</p>
      </div>
    );
  }

  const otherUser =
    currentUser?.role === "Admin"
      ? {
          name: `${conversation.buyerName || "Buyer"} / ${conversation.sellerName || "Seller"}`,
          avatar: "",
          status: "Buyer and seller conversation",
        }
      : currentUser?.role === "Seller"
        ? {
            name: conversation.buyerName,
            avatar: conversation.buyerAvatar,
            status: "Buyer conversation",
          }
        : {
            name: conversation.sellerName,
            avatar: conversation.sellerAvatar,
            status: "Seller conversation",
          };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.userInfo}>
          {otherUser.avatar ? (
            <Image
              src={otherUser.avatar}
              alt={otherUser.name}
              className={styles.avatar}
              width={44}
              height={44}
              unoptimized
            />
          ) : (
            <div className={styles.avatarFallback}>
              {otherUser.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
          <div>
            <h3>{otherUser.name}</h3>
            <p className={styles.status}>{otherUser.status}</p>
          </div>
        </div>
      </div>

      <div className={styles.messagesContainer}>
        {error ? (
          <div className={styles.loading}>
            <p>{error}</p>
          </div>
        ) : null}

        {loading ? (
          <div className={styles.loading}>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.noMessages}>
            <p>No messages</p>
          </div>
        ) : (
          <div className={styles.messages}>
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isOwn={String(message.senderId) === String(currentUser?.id)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {!readOnly ? (
        <form onSubmit={handleSendMessage} className={styles.inputForm}>
          <input
            type="text"
            value={inputValue}
            onChange={handleTyping}
            placeholder="Write a message"
            disabled={isSending}
            className={styles.input}
          />
          <button
            type="submit"
            disabled={isSending || !inputValue.trim()}
            className={styles.sendBtn}
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
