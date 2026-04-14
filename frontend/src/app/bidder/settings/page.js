import {
  Panel,
  SectionIntro,
  SettingsGrid,
} from "@/components/admin/AdminPrimitives";
import { SettingsEditor } from "@/components/account/ProfileForms";
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

      <section className={styles.secondaryGrid}>
        <SettingsEditor
          title="Alert settings"
          description="Choose how quickly you want to know about outbids, ending auctions, and support replies."
          fields={[
            { name: "bidder-outbid-alerts", label: "Outbid alerts", type: "select", defaultValue: "Instant", options: ["Instant", "Hourly", "Daily"] },
            { name: "bidder-ending-alerts", label: "Ending soon reminders", type: "select", defaultValue: "Enabled", options: ["Enabled", "Disabled"] },
            { name: "bidder-support-alerts", label: "Support reply alerts", type: "select", defaultValue: "Enabled", options: ["Enabled", "Disabled"] },
          ]}
        />
        <SettingsEditor
          title="Buying preferences"
          description="Tune discovery defaults, wallet behavior, and bidding experience preferences."
          fields={[
            { name: "bidder-currency", label: "Preferred currency", defaultValue: "USD" },
            { name: "bidder-wallet-mode", label: "Wallet funding mode", type: "select", defaultValue: "Manual", options: ["Manual", "Auto top-up"] },
            { name: "bidder-category-focus", label: "Category focus", defaultValue: "Vehicles, Collectibles" },
          ]}
        />
      </section>
    </div>
  );
}
