"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useChatRoom } from "@/hooks/useChatRoom";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/components/auth/AuthProvider";
import MessageItem from "./MessageItem";
import styles from "./ChatWindow.module.css";

export default function ChatWindow({ conversation }) {
  const { user, token } = useAuth();
  const { messages, sendMessage, fetchMessages, loading } = useChatRoom();
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { joinConversation, leaveConversation, emitMessage, markAsRead, emitTyping, emitStopTyping } =
    useSocket(
      token,
      (message) => {
        if (message.conversationId === conversation?.id) {
          // Message will be handled by the controller
        }
      },
      null,
      null,
      (userId, conversationId, isTyping) => {
        if (conversationId === conversation?.id) {
          setTypingUsers((prev) => {
            const updated = new Set(prev);
            if (isTyping) {
              updated.add(userId);
            } else {
              updated.delete(userId);
            }
            return updated;
          });
        }
      },
    );

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation?.id) {
      fetchMessages(conversation.id);
      joinConversation(conversation.id);
      markAsRead(conversation.id);

      return () => {
        leaveConversation(conversation.id);
      };
    }
  }, [conversation?.id, fetchMessages, joinConversation, leaveConversation, markAsRead]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    try {
      setIsSending(true);
      emitStopTyping(conversation.id);

      await sendMessage(conversation.id, inputValue);
      setInputValue("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (e) => {
    setInputValue(e.target.value);

    // Emit typing indicator
    emitTyping(conversation.id);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(conversation.id);
    }, 2000);
  };

  if (!conversation) {
    return (
      <div className={styles.empty}>
        <p>Select a conversation to start messaging</p>
      </div>
    );
  }

  const otherUser = user?.role === "Seller" ? 
    { name: conversation.buyerName, avatar: conversation.buyerAvatar } :
    { name: conversation.sellerName, avatar: conversation.sellerAvatar };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.userInfo}>
          {otherUser.avatar ? (
            <Image src={otherUser.avatar} alt={otherUser.name} className={styles.avatar} width={44} height={44} unoptimized />
          ) : null}
          <div>
            <h3>{otherUser.name}</h3>
            <p className={styles.status}>Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        {loading ? (
          <div className={styles.loading}>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.noMessages}>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className={styles.messages}>
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isOwn={String(message.senderId) === String(user?.id)}
              />
            ))}
            {typingUsers.size > 0 && (
              <div className={styles.typingIndicator}>
                <span>Someone is typing</span>
                <div className={styles.dots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className={styles.inputForm}>
        <input
          type="text"
          value={inputValue}
          onChange={handleTyping}
          placeholder="Type a message..."
          disabled={isSending}
          className={styles.input}
        />
        <button type="submit" disabled={isSending || !inputValue.trim()} className={styles.sendBtn}>
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
