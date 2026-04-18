"use client";

import { useEffect, useState } from "react";
import {
  ChatWorkspace,
  FilterBar,
  Panel,
  SectionIntro,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import styles from "@/components/member/MemberDashboard.module.css";

export default function BidderMessagesPage() {
  const { data, setData, error } = useApiData("/messages", {
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
        title="Messages"
        description="Stay aligned with sellers and support teams on questions, proofs, and payment issues."
        action={<FilterBar items={["All", "Sellers", "Support", "Open", "Urgent"]} />}
      />

      <Panel title="Conversation workspace" description="A single inbox for seller communication and support handling.">
        {error ? (
          <p>{error}</p>
        ) : (
          <ChatWorkspace
            threads={data}
            activeThreadId={activeThreadId}
            onThreadSelect={setActiveThreadId}
            composerLabel="Reply to seller or support"
            composerPlaceholder="Write your message"
            onSendMessage={handleSendMessage}
            isSending={isSending}
          />
        )}
      </Panel>
    </div>
  );
}
