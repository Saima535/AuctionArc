"use client";

import { useEffect, useState } from "react";
import {
  ChatWorkspace,
  FilterBar,
  Panel,
  SectionIntro,
  StatCard,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import styles from "../page.module.css";

export default function AdminChatsPage() {
  const { data, setData, error } = useApiData("/admin/chats", {
    initialData: [],
  });
  const [activeThreadId, setActiveThreadId] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!activeThreadId && data[0]?.id) {
      setActiveThreadId(data[0].id);
    }
  }, [activeThreadId, data]);

  async function handleSendMessage(threadId, body) {
    setIsSending(true);

    try {
      const result = await apiRequest(`/messages/${threadId}/messages`, {
        method: "POST",
        body: { body },
      });

      setData((current) =>
        current.map((thread) => (thread.id === threadId ? result.data : thread)),
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Chats and disputes"
        description="Support and dispute inbox for moderator-guided conversations, escalations, and internal notes."
        action={<FilterBar items={["Open", "Escalated", "Payments", "Authenticity", "Resolved"]} />}
      />

      {error ? <p>{error}</p> : null}

      <section className={styles.statGrid}>
        <StatCard label="Open threads" value={String(data.filter((thread) => thread.status === "Open").length)} delta="Live backlog" tone="warn" />
        <StatCard label="Escalated disputes" value={String(data.filter((thread) => thread.status === "Escalated").length)} delta="Needs admin action" tone="warn" />
        <StatCard label="Resolved today" value={String(data.filter((thread) => thread.status === "Resolved").length)} delta="Finished cases" tone="good" />
        <StatCard label="High priority" value={String(data.filter((thread) => thread.priority === "High").length)} delta="Urgent threads" tone="good" />
      </section>

      <Panel title="Support and dispute workspace" description="Conversation list, live thread, and admin intervention actions.">
        <ChatWorkspace
          threads={data}
          activeThreadId={activeThreadId}
          onThreadSelect={setActiveThreadId}
          composerLabel="Admin response or internal note"
          composerPlaceholder="Write an admin response"
          onSendMessage={handleSendMessage}
          isSending={isSending}
        />
      </Panel>
    </div>
  );
}
