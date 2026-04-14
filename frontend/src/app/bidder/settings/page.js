import {
  Panel,
  SectionIntro,
  SettingsGrid,
} from "@/components/admin/AdminPrimitives";
import styles from "@/components/member/MemberDashboard.module.css";

const bidderSettings = [
  {
    title: "Profile",
    description: "Personal identity, contact details, and verification status.",
    items: ["Contact information", "Verification details", "Preferred country and currency"],
  },
  {
    title: "Bidding preferences",
    description: "Control watchlist alerts, category interests, and bidding reminders.",
    items: ["Watchlist alerts", "Category preferences", "Ending-soon reminders"],
  },
  {
    title: "Payments",
    description: "Manage wallet preferences, saved methods, and transaction visibility.",
    items: ["Wallet funding options", "Saved payment method", "Refund tracking"],
  },
  {
    title: "Security",
    description: "Protect account access and session confidence.",
    items: ["Password update", "Device review", "Recovery settings"],
  },
];

export default function BidderSettingsPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Settings"
        description="Control profile, alerts, funding preferences, and account security."
      />

      <Panel title="Bidder controls" description="Personal preferences and account settings ready for backend integration.">
        <SettingsGrid sections={bidderSettings} />
      </Panel>
    </div>
  );
}
