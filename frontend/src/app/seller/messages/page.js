"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LiveRefreshControls } from "@/components/admin/AdminPrimitives";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiErrorNotice } from "@/components/feedback/ApiFeedback";
import shared from "@/components/seller/SellerShared.module.css";
import { useApiData } from "@/hooks/useApiData";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { apiRequest } from "@/lib/api";
import { DotsIcon, SearchIcon, SendIcon } from "@/components/seller/SellerIcons";

export default function SellerMessagesPage() {
  const { user: profile } = useAuth();
  const { data, setData, error, isRefreshing, lastUpdated, refresh } = useApiData("/messages", {
    initialData: [],
    refreshIntervalMs: 6000,
    revalidateOnWindowFocus: true,
  });
  const [activeThreadId, setActiveThreadId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pageError, setPageError] = useState("");
  const live = useLiveRefresh({
    channels: useMemo(() => ["market:messages", profile?.id ? `user:${profile.id}` : ""], [profile?.id]),
    enabled: Boolean(profile?.id),
    onEvent: useCallback(() => {
      refresh({ background: true });
    }, [refresh]),
  });

  const filteredThreads = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return data;
    }

    return data.filter(
      (thread) =>
        thread.subject.toLowerCase().includes(query) ||
        thread.lastMessage.toLowerCase().includes(query) ||
        thread.participants.toLowerCase().includes(query),
    );
  }, [data, searchTerm]);

  useEffect(() => {
    if (!filteredThreads.length) {
      setActiveThreadId("");
      return;
    }

    if (!activeThreadId || !filteredThreads.some((thread) => thread.id === activeThreadId)) {
      setActiveThreadId(filteredThreads[0].id);
    }
  }, [activeThreadId, filteredThreads]);

  const activeThread = filteredThreads.find((thread) => thread.id === activeThreadId) || filteredThreads[0];

  async function handleSendMessage(event) {
    event.preventDefault();

    if (!activeThread || !messageBody.trim()) {
      return;
    }

    setPageError("");
    setIsSending(true);

    try {
      const result = await apiRequest(`/messages/${activeThread.id}/messages`, {
        method: "POST",
        body: { body: messageBody.trim() },
      });

      setData((current) =>
        current.map((thread) => (thread.id === activeThread.id ? result.data : thread)),
      );
      setMessageBody("");
      refresh({ background: true });
    } catch (requestError) {
      setPageError(requestError.message || "Could not send your message.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className={shared.page}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <LiveRefreshControls
          onRefresh={refresh}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
          label="Realtime inbox + 6s fallback"
          connectionState={live.connectionState}
        />
      </div>

      {error ? <ApiErrorNotice title="Seller inbox unavailable" message={error} /> : null}
      {pageError ? <p className={shared.errorText}>{pageError}</p> : null}

      <section className={shared.chatGrid}>
        <aside className={`${shared.panel} ${shared.chatSidebar}`}>
          <div className={shared.searchBar}>
            <div className={shared.searchInput}>
              <SearchIcon />
              <input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          <div className={shared.threadList}>
            {!filteredThreads.length ? (
              <article className={shared.threadItem}>
                <div className={shared.threadAvatar}>
                  <span>NA</span>
                </div>
                <div className={shared.threadContent}>
                  <strong>No conversations found</strong>
                  <p>Seller and buyer threads will appear here once someone starts a conversation.</p>
                </div>
              </article>
            ) : null}

            {filteredThreads.map((thread) => (
              <article
                key={thread.id}
                className={thread.id === activeThread?.id ? shared.threadItemActive : shared.threadItem}
                onClick={() => setActiveThreadId(thread.id)}
              >
                <div className={shared.threadAvatar}>
                  <span>{thread.subject.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className={shared.threadContent}>
                  <strong>{thread.subject}</strong>
                  <span>{thread.participants}</span>
                  <p>{thread.lastMessage}</p>
                </div>
                <span className={shared.threadTime}>{thread.status}</span>
              </article>
            ))}
          </div>
        </aside>

        <section className={`${shared.panel} ${shared.chatPanel}`}>
          {!activeThread ? (
            <div className={shared.emptyChatState}>
              <strong>No active conversation selected</strong>
              <p>Choose a thread from the left to review buyer questions and respond.</p>
            </div>
          ) : (
            <>
              <header className={shared.chatHeader}>
                <div className={shared.chatHeaderLeft}>
                  <div className={shared.threadAvatar} style={{ width: 56, height: 56 }}>
                    <span>{activeThread.subject.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className={shared.chatHeaderTitle}>
                    <strong>{activeThread.subject}</strong>
                    <span>{activeThread.participants}</span>
                  </div>
                </div>

                <span className={shared.chatAction}>
                  <DotsIcon />
                </span>
              </header>

              <div className={shared.messagesArea}>
                {activeThread.messages.map((message, index) => (
                  <article
                    key={`${activeThread.id}-${message.from}-${index}`}
                    className={message.from === profile?.name ? shared.messageBubbleOwn : shared.messageBubble}
                  >
                    <p>{message.body}</p>
                    <span>{message.from}</span>
                  </article>
                ))}
              </div>

              <form className={shared.chatComposer} onSubmit={handleSendMessage}>
                <div className={shared.searchInput}>
                  <input
                    placeholder="Type your message..."
                    value={messageBody}
                    onChange={(event) => setMessageBody(event.target.value)}
                  />
                </div>
                <button type="submit" className={shared.composerSend} aria-label="Send message" disabled={isSending}>
                  <SendIcon />
                </button>
              </form>
            </>
          )}
        </section>
      </section>
    </div>
  );
}
