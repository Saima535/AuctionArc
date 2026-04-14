import {
  ChatWorkspace,
  FilterBar,
  Panel,
  SectionIntro,
} from "@/components/admin/AdminPrimitives";
import styles from "@/components/member/MemberDashboard.module.css";
import { memberThreads } from "@/data/member/mock-data";

export default function BidderMessagesPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Messages"
        description="Stay aligned with sellers and support teams on questions, proofs, and payment issues."
        action={<FilterBar items={["All", "Sellers", "Support", "Open", "Urgent"]} />}
      />

      <Panel title="Conversation workspace" description="A single inbox for seller communication and support handling.">
        <ChatWorkspace threads={memberThreads} />
      </Panel>
    </div>
  );
}
