"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChatWorkspace,
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

export default function SellerMessagesPage() {
  const { user } = useAuth();
  const { data, setData, error, isRefreshing, lastUpdated, refresh } = useApiData("/messages", {
    initialData: [],
    refreshIntervalMs: 6000,
    revalidateOnWindowFocus: true,
  });
  const [activeThreadId, setActiveThreadId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pageError, setPageError] = useState("");
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
    setPageError("");
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
    } catch (requestError) {
      setPageError(requestError.message || "Could not send your message.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Messages"
        description="Keep seller conversations organized with buyers and support in one clean inbox."
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

      {pageError ? <p className={styles.errorText}>{pageError}</p> : null}

      <Panel title="Seller inbox" description="Review buyer questions, support follow-ups, and active conversation history.">
        {error ? (
          <ApiErrorNotice title="Seller inbox unavailable" message={error} />
        ) : (
          <ChatWorkspace
            threads={data}
            activeThreadId={activeThreadId}
            onThreadSelect={setActiveThreadId}
            composerLabel="Reply to buyer or support"
            composerPlaceholder="Write your message"
            onSendMessage={handleSendMessage}
            isSending={isSending}
            currentUserName={user?.name || ""}
            searchPlaceholder="Search buyer or support conversations"
            emptyTitle="No seller conversations available yet."
            emptyMessage="Buyer and support messages will appear here once someone starts a conversation."
          />
        )}
      </Panel>
    </div>
  );
}
