import {
  ChatWorkspace,
  FilterBar,
  Panel,
  SectionIntro,
  StatCard,
} from "@/components/admin/AdminPrimitives";
import { chatThreads } from "@/data/admin/mock-data";
import styles from "../page.module.css";

export default function AdminChatsPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Chats and disputes"
        description="Support and dispute inbox for moderator-guided conversations, escalations, and internal notes."
        action={<FilterBar items={["Open", "Escalated", "Payments", "Authenticity", "Resolved"]} />}
      />

      <section className={styles.statGrid}>
        <StatCard label="Open threads" value="28" delta="+3" tone="warn" />
        <StatCard label="Escalated disputes" value="8" delta="+1" tone="warn" />
        <StatCard label="Resolved today" value="17" delta="+5" tone="good" />
        <StatCard label="Average first reply" value="11m" delta="-2m" tone="good" />
      </section>

      <Panel title="Support and dispute workspace" description="Conversation list, live thread, and admin intervention actions.">
        <ChatWorkspace threads={chatThreads} />
      </Panel>
    </div>
  );
}
