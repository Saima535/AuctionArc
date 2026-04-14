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
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
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

export function ChatWorkspace({ threads }) {
  const activeThread = threads[0];

  return (
    <div className={styles.chatLayout}>
      <div className={styles.chatList}>
        {threads.map((thread) => (
          <article
            key={thread.id}
            className={thread.id === activeThread.id ? styles.chatItemActive : styles.chatItem}
          >
            <div className={styles.chatItemTop}>
              <strong>{thread.subject}</strong>
              <StatusBadge tone={thread.priority === "High" ? "danger" : "warn"}>
                {thread.priority}
              </StatusBadge>
            </div>
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
          <div className={styles.actionRow}>
            <button type="button" className={styles.actionButton}>
              Mark Resolved
            </button>
            <button type="button" className={styles.actionButton}>
              Escalate
            </button>
          </div>
        </div>

        <div className={styles.messageList}>
          {activeThread.messages.map((message) => (
            <article key={`${activeThread.id}-${message.from}-${message.body}`} className={styles.messageCard}>
              <strong>{message.from}</strong>
              <p>{message.body}</p>
            </article>
          ))}
        </div>

        <div className={styles.noteComposer}>
          <p>Admin quick actions</p>
          <div className={styles.actionRow}>
            <button type="button" className={styles.actionButton}>
              Send canned response
            </button>
            <button type="button" className={styles.actionButton}>
              Add internal note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsGrid({ sections }) {
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
          <button type="button" className={styles.actionButton}>
            Manage
          </button>
        </article>
      ))}
    </div>
  );
}
