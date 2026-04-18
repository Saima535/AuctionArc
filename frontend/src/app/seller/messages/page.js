"use client";

import Image from "next/image";
import shared from "@/components/seller/SellerShared.module.css";
import { ClipIcon, DotsIcon, SearchIcon, SendIcon } from "@/components/seller/SellerIcons";

const threads = [
  {
    name: "Sarah Johnson",
    product: 'MacBook Pro 16" M3',
    preview: "Is the laptop still available?",
    time: "2m ago",
    unread: 2,
    image: "/chat-sarah.svg",
    active: true,
  },
  {
    name: "Michael Chen",
    product: "Vintage Leica M6 Camera",
    preview: "Can you provide more photos of the camera?",
    time: "1h ago",
    unread: 0,
    image: "/chat-michael.svg",
  },
  {
    name: "Emma Wilson",
    product: "Rolex Submariner Watch",
    preview: "Do you have the original papers?",
    time: "3h ago",
    unread: 1,
    image: "/chat-emma.svg",
  },
];

const messages = [
  { body: "Hi! I'm interested in the MacBook Pro. Is it still available?", time: "10:30 AM", own: false },
  { body: "Yes, it's still available! It's in excellent condition with original box and charger.", time: "10:32 AM", own: true },
  { body: "Great! Can you tell me more about the battery health?", time: "10:35 AM", own: false },
  { body: "The battery health is at 95%. It has only been used for about 6 months. I can provide a screenshot if you need.", time: "10:38 AM", own: true },
  { body: "Is the laptop still available?", time: "11:45 AM", own: false },
];

export default function SellerMessagesPage() {
  return (
    <div className={shared.page}>
      <section className={shared.chatGrid}>
        <aside className={`${shared.panel} ${shared.chatSidebar}`}>
          <div className={shared.searchBar}>
            <div className={shared.searchInput}>
              <SearchIcon />
              <input placeholder="Search conversations..." />
            </div>
          </div>

          <div className={shared.threadList}>
            {threads.map((thread) => (
              <article key={thread.name} className={thread.active ? shared.threadItemActive : shared.threadItem}>
                <div className={shared.threadAvatar}>
                  <Image src={thread.image} alt={thread.name} fill sizes="54px" />
                  {thread.unread ? <span className={shared.threadBadge}>{thread.unread}</span> : null}
                </div>
                <div className={shared.threadContent}>
                  <strong>{thread.name}</strong>
                  <span>{thread.product}</span>
                  <p>{thread.preview}</p>
                </div>
                <span className={shared.threadTime}>{thread.time}</span>
              </article>
            ))}
          </div>
        </aside>

        <section className={`${shared.panel} ${shared.chatPanel}`}>
          <header className={shared.chatHeader}>
            <div className={shared.chatHeaderLeft}>
              <div className={shared.threadAvatar} style={{ width: 56, height: 56 }}>
                <Image src="/chat-sarah.svg" alt="Sarah Johnson" fill sizes="56px" />
              </div>
              <div className={shared.chatHeaderTitle}>
                <strong>Sarah Johnson</strong>
                <span>MacBook Pro 16&quot; M3</span>
              </div>
            </div>

            <span className={shared.chatAction}>
              <DotsIcon />
            </span>
          </header>

          <div className={shared.messagesArea}>
            {messages.map((message, index) => (
              <article key={`${message.time}-${index}`} className={message.own ? shared.messageBubbleOwn : shared.messageBubble}>
                <p>{message.body}</p>
                <span>{message.time}</span>
              </article>
            ))}
          </div>

          <footer className={shared.chatComposer}>
            <button type="button" className={shared.composerClip} aria-label="Attach file">
              <ClipIcon />
            </button>
            <div className={shared.searchInput}>
              <input placeholder="Type your message..." />
            </div>
            <button type="button" className={shared.composerSend} aria-label="Send message">
              <SendIcon />
            </button>
          </footer>
        </section>
      </section>
    </div>
  );
}
