"use client";

import Chat from "@/components/chat/Chat";
import { Panel, SectionIntro } from "@/components/admin/AdminPrimitives";
import styles from "../page.module.css";

export default function AdminChatsPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Chats"
        description="View live buyer and seller conversations from one admin workspace."
      />

      <Panel title="Conversation monitor" description="Real buyer and seller conversations only.">
        <Chat mode="admin" readOnly />
      </Panel>
    </div>
  );
}
