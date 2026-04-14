import {
  Panel,
  SectionIntro,
  SettingsGrid,
} from "@/components/admin/AdminPrimitives";
import styles from "@/components/member/MemberDashboard.module.css";

const sellerSettings = [
  {
    title: "Store profile",
    description: "Brand identity, seller bio, and public trust details.",
    items: ["Store name", "Verification badges", "Public profile summary"],
  },
  {
    title: "Listing defaults",
    description: "Reserve price habits, duration defaults, and shipping presets.",
    items: ["Default auction length", "Reserve reminder", "Shipping templates"],
  },
  {
    title: "Notifications",
    description: "Control alerts for bids, wins, buyer messages, and reviews.",
    items: ["Bid alerts", "Buyer message alerts", "Payout reminders"],
  },
  {
    title: "Security",
    description: "Seller account protection and recovery settings.",
    items: ["Password update", "Device review", "Recovery contact"],
  },
];

export default function SellerSettingsPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Settings"
        description="Control your seller identity, listing defaults, and notification preferences."
      />

      <Panel title="Seller controls" description="Account and storefront settings prepared for backend integration.">
        <SettingsGrid sections={sellerSettings} />
      </Panel>
    </div>
  );
}
