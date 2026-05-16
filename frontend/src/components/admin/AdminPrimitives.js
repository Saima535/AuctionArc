"use client";

import { useMemo, useState } from "react";
import styles from "./AdminPrimitives.module.css";

export function SectionIntro({ title, description, action }) {
  return (
    <div className={styles.sectionIntro}>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function StatCard({ label, value, delta, tone = "neutral" }) {
  const toneClass =
    tone === "good" ? styles.deltaGood : tone === "warn" ? styles.deltaWarn : styles.deltaNeutral;

  return (
    <article className={styles.statCard}>
      <p>{label}</p>
      <h3>{value}</h3>
      <span className={toneClass}>{delta}</span>
    </article>
  );
}

export function Panel({ title, description, children, action }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}

export function StatusBadge({ children, tone = "neutral" }) {
  const className =
    tone === "good"
      ? styles.badgeGood
      : tone === "warn"
        ? styles.badgeWarn
        : tone === "danger"
          ? styles.badgeDanger
          : styles.badgeNeutral;

  return <span className={className}>{children}</span>;
}

export function FilterBar({ items }) {
  return (
    <div className={styles.filterBar}>
      {items.map((item) => (
        <button key={item} type="button" className={styles.filterChip}>
          {item}
        </button>
      ))}
    </div>
  );
}

export function LiveRefreshControls({
  onRefresh,
  isRefreshing = false,
  lastUpdated = null,
  label = "Live refresh",
  connectionState = "idle",
}) {
  const timestamp = lastUpdated
    ? new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }).format(lastUpdated)
    : "Waiting for first sync";

  return (
    <div className={styles.liveControls}>
      <span className={styles.liveBadge}>
        <span className={connectionState === "connected" || isRefreshing ? styles.liveDotActive : styles.liveDot} />
        {label}
      </span>
      <small className={styles.liveTimestamp}>
        {connectionState === "connected" ? "Realtime connected" : connectionState === "reconnecting" ? "Reconnecting..." : "Polling fallback"} | Updated {timestamp}
      </small>
      <button type="button" className={styles.filterChip} onClick={() => onRefresh?.({ background: true })}>
        {isRefreshing ? "Refreshing..." : "Refresh now"}
      </button>
    </div>
  );
}

export function DataTable({ columns, rows }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className={styles.emptyCell}>
                No records available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ActivityFeed({ items }) {
  return (
    <div className={styles.feed}>
      {items.map((item) => (
        <article key={item.title} className={styles.feedItem}>
          <strong>{item.title}</strong>
          <p>{item.meta}</p>
        </article>
      ))}
    </div>
  );
}

export function TrendChart({ data, tone = "blue" }) {
  const max = Math.max(...data, 1);
  const points = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 100;
      const y = 100 - (value / max) * 88;

      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,100 ${points} 100,100`;
  const toneClass =
    tone === "orange" ? styles.chartOrange : tone === "green" ? styles.chartGreen : styles.chartBlue;

  return (
    <div className={styles.chartFrame}>
      <svg
        viewBox="0 0 100 100"
        className={`${styles.chart} ${toneClass}`}
        preserveAspectRatio="none"
      >
        <polygon points={areaPoints} className={styles.chartArea} />
        <polyline points={points} className={styles.chartLine} />
      </svg>
    </div>
  );
}

export function BarList({ items }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className={styles.barList}>
      {items.map((item) => (
        <div key={item.label} className={styles.barRow}>
          <div className={styles.barMeta}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailPanel({ title, subtitle, notes, actions }) {
  return (
    <aside className={styles.detailPanel}>
      <div className={styles.panelHeader}>
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>

      <ul className={styles.noteList}>
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>

      <div className={styles.actionRow}>
        {actions.map((action) => (
          <button key={action} type="button" className={styles.actionButton}>
            {action}
          </button>
        ))}
      </div>
    </aside>
  );
}

export function ChatWorkspace({
  threads,
  activeThreadId,
  onThreadSelect,
  composerLabel = "Send message",
  composerPlaceholder = "Write your message",
  onSendMessage,
  isSending = false,
  currentUserName = "",
  searchPlaceholder = "Search conversations",
  emptyTitle = "No conversations available yet.",
  emptyMessage = "Once messages start coming in, they will appear here.",
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedThreads = useMemo(() => {
    const seen = new Set();
    const ordered = [];

    for (const thread of threads) {
      if (!thread?.id || seen.has(thread.id)) {
        continue;
      }

      seen.add(thread.id);
      ordered.push(thread);
    }

    return ordered;
  }, [threads]);

  const filteredThreads = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return normalizedThreads;
    }

    return normalizedThreads.filter((thread) =>
      [thread.subject, thread.lastMessage, thread.participants, thread.participantRoles]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [normalizedThreads, searchTerm]);

  const activeThread =
    filteredThreads.find((thread) => thread.id === activeThreadId) || filteredThreads[0];

  if (!activeThread) {
    return (
      <div className={styles.chatEmptyState}>
        <strong>{emptyTitle}</strong>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const body = formData.get("body");

    if (typeof body === "string" && body.trim() && onSendMessage) {
      await onSendMessage(activeThread.id, body.trim());
      event.currentTarget.reset();
    }
  }

  return (
    <div className={styles.chatLayout}>
      <div className={styles.chatList}>
        <div className={styles.chatSearch}>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={searchPlaceholder}
            className={styles.chatSearchInput}
          />
        </div>

        {filteredThreads.map((thread) => (
          <article
            key={thread.id}
            className={thread.id === activeThread.id ? styles.chatItemActive : styles.chatItem}
            onClick={() => onThreadSelect?.(thread.id)}
          >
            <div className={styles.chatItemTop}>
              <strong>{thread.subject}</strong>
              <StatusBadge tone={thread.priority === "High" ? "danger" : "warn"}>
                {thread.priority}
              </StatusBadge>
            </div>
            <span className={styles.chatParticipants}>{thread.participants}</span>
            <p>{thread.lastMessage}</p>
            <small>
              {thread.id} | {thread.status}
            </small>
          </article>
        ))}
      </div>

        <div className={styles.chatThread}>
          <div className={styles.threadHeader}>
            <div>
              <h3>{activeThread.subject}</h3>
              <p>
                {activeThread.participants} | {activeThread.status}
              </p>
            </div>
          </div>

          <div className={styles.messageList}>
            {activeThread.messages.map((message) => (
              <article
                key={`${activeThread.id}-${message.key}`}
                className={
                  message.from === currentUserName
                    ? styles.messageCardOwn
                    : styles.messageCard
                }
              >
                <strong>{message.from}</strong>
                <p>{message.body}</p>
                {message.sentAt ? (
                  <small className={styles.messageTimestamp}>
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(message.sentAt))}
                  </small>
                ) : null}
              </article>
            ))}
          </div>

        {onSendMessage ? (
          <form className={styles.noteComposer} onSubmit={handleSubmit}>
            <p>{composerLabel}</p>
            <textarea
              name="body"
              className={styles.composerInput}
              placeholder={composerPlaceholder}
              rows={4}
              required
            />
            <div className={styles.actionRow}>
              <button type="submit" className={styles.actionButton} disabled={isSending}>
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export function SettingsGrid({ sections, onManage = () => {} }) {
  return (
    <div className={styles.settingsGrid}>
      {sections.map((section) => (
        <article key={section.title} className={styles.settingCard}>
          <h3>{section.title}</h3>
          <p>{section.description}</p>
          <ul className={styles.noteList}>
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <button type="button" className={styles.actionButton} onClick={() => onManage(section.title)}>
            Manage
          </button>
        </article>
      ))}
    </div>
  );
}
