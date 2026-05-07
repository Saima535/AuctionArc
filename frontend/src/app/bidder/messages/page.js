"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChatWorkspace,
  FilterBar,
  LiveRefreshControls,
  Panel,
  SectionIntro,
} from "@/components/admin/AdminPrimitives";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiErrorNotice } from "@/components/feedback/ApiFeedback";
import { useApiData } from "@/hooks/useApiData";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { apiRequest } from "@/lib/api";
import styles from "@/components/member/MemberDashboard.module.css";

export default function BidderMessagesPage() {
  const { user } = useAuth();
  const { data, setData, error, isRefreshing, lastUpdated, refresh } = useApiData("/messages", {
    initialData: [],
    refreshIntervalMs: 6000,
    revalidateOnWindowFocus: true,
  });
  const [activeThreadId, setActiveThreadId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const live = useLiveRefresh({
    channels: useMemo(() => ["market:messages", user?.id ? `user:${user.id}` : ""], [user?.id]),
    enabled: Boolean(user?.id),
    onEvent: useCallback(() => {
      refresh({ background: true });
    }, [refresh]),
  });

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
      refresh({ background: true });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Messages"
        description="Stay aligned with sellers and support teams on questions, proofs, and payment issues."
        action={
          <LiveRefreshControls
            onRefresh={refresh}
            isRefreshing={isRefreshing}
            lastUpdated={lastUpdated}
            label="Realtime inbox + 6s fallback"
            connectionState={live.connectionState}
          />
        }
      />

      <FilterBar items={["All", "Sellers", "Support", "Open", "Urgent"]} />

      <Panel title="Conversation workspace" description="A single inbox for seller communication and support handling.">
        {error ? (
          <ApiErrorNotice title="Messages unavailable" message={error} />
        ) : (
          <ChatWorkspace
            threads={data}
            activeThreadId={activeThreadId}
            onThreadSelect={setActiveThreadId}
            composerLabel="Reply to seller or support"
            composerPlaceholder="Write your message"
            onSendMessage={handleSendMessage}
            isSending={isSending}
            currentUserName={user?.name || ""}
            searchPlaceholder="Search seller or support conversations"
            emptyTitle="No buyer conversations available yet."
            emptyMessage="Seller and support threads will appear here once a conversation begins."
          />
        )}
      </Panel>
    </div>
  );
}
