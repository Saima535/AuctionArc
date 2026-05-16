"use client";

import { useState } from "react";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import styles from "./Chat.module.css";

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState(null);

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <ConversationList onSelectConversation={setSelectedConversation} />
      </div>
      <div className={styles.main}>
        <ChatWindow conversation={selectedConversation} />
      </div>
    </div>
  );
}
