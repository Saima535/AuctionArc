import {
  ChatWorkspace,
  FilterBar,
  Panel,
  SectionIntro,
} from "@/components/admin/AdminPrimitives";
import styles from "@/components/member/MemberDashboard.module.css";
import { memberThreads } from "@/data/member/mock-data";

export default function SellerMessagesPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Messages"
        description="Handle buyer questions, shipment updates, and support conversations tied to your auctions."
        action={<FilterBar items={["All", "Buyers", "Support", "Open", "Resolved"]} />}
      />

      <Panel title="Conversation workspace" description="Unified place for buyer communication and seller-side support.">
        <ChatWorkspace threads={memberThreads} />
      </Panel>
    </div>
  );
}
