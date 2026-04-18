"use client";

import { useState } from "react";
import {
  Panel,
  SectionIntro,
  SettingsGrid,
} from "@/components/admin/AdminPrimitives";
import { SettingsEditor } from "@/components/account/ProfileForms";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
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
  const { data, setData, error } = useApiData("/users/me/settings", {
    initialData: {},
  });
  const [message, setMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values) {
    setMessage("");
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const result = await apiRequest("/users/me/settings", {
        method: "PATCH",
        body: values,
      });

      setData(result.data);
      setMessage("Bidder settings updated successfully.");
    } catch (requestError) {
      setSubmitError(requestError.message || "Could not update bidder settings.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Settings"
        description="Control profile, alerts, funding preferences, and account security."
      />

      {error ? <p>{error}</p> : null}

      <Panel title="Bidder controls" description="Personal preferences and account settings ready for backend integration.">
        <SettingsGrid sections={bidderSettings} />
      </Panel>

      <section className={styles.secondaryGrid}>
        <SettingsEditor
          key={`bidder-alerts-${data.outbidAlerts}-${data.endingAlerts}-${data.supportAlerts}`}
          title="Alert settings"
          description="Choose how quickly you want to know about outbids, ending auctions, and support replies."
          fields={[
            { name: "outbidAlerts", label: "Outbid alerts", type: "select", defaultValue: data.outbidAlerts || "Instant", options: ["Instant", "Hourly", "Daily"] },
            { name: "endingAlerts", label: "Ending soon reminders", type: "select", defaultValue: data.endingAlerts || "Enabled", options: ["Enabled", "Disabled"] },
            { name: "supportAlerts", label: "Support reply alerts", type: "select", defaultValue: data.supportAlerts || "Enabled", options: ["Enabled", "Disabled"] },
          ]}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitMessage={message}
          submitError={submitError}
        />
        <SettingsEditor
          key={`bidder-buying-${data.currency}-${data.walletMode}-${data.categoryFocus}`}
          title="Buying preferences"
          description="Tune discovery defaults, wallet behavior, and bidding experience preferences."
          fields={[
            { name: "currency", label: "Preferred currency", defaultValue: data.currency || "USD" },
            { name: "walletMode", label: "Wallet funding mode", type: "select", defaultValue: data.walletMode || "Manual", options: ["Manual", "Auto top-up"] },
            { name: "categoryFocus", label: "Category focus", defaultValue: data.categoryFocus || "Vehicles, Collectibles" },
          ]}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitMessage={message}
          submitError={submitError}
        />
      </section>
    </div>
  );
}
