import {
  Panel,
  SectionIntro,
  SettingsGrid,
} from "@/components/admin/AdminPrimitives";
import { SettingsEditor } from "@/components/account/ProfileForms";
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

      <section className={styles.secondaryGrid}>
        <SettingsEditor
          title="Notification settings"
          description="Control how AuctionArc reaches you about bids, payouts, and buyer questions."
          fields={[
            { name: "seller-email-alerts", label: "Email alerts", type: "select", defaultValue: "Enabled", options: ["Enabled", "Disabled"] },
            { name: "seller-payout-alerts", label: "Payout reminders", type: "select", defaultValue: "Enabled", options: ["Enabled", "Disabled"] },
            { name: "seller-message-alerts", label: "Buyer message alerts", type: "select", defaultValue: "Instant", options: ["Instant", "Hourly", "Daily"] },
          ]}
        />
        <SettingsEditor
          title="Listing defaults"
          description="Define the seller-side defaults used while creating new listings."
          fields={[
            { name: "seller-default-duration", label: "Default auction duration", defaultValue: "7 days" },
            { name: "seller-default-shipping", label: "Shipping template", defaultValue: "Standard insured shipping" },
            { name: "seller-default-reserve", label: "Reserve reminder", type: "select", defaultValue: "Enabled", options: ["Enabled", "Disabled"] },
          ]}
        />
      </section>
    </div>
  );
}
