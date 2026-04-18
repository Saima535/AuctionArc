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
      setMessage("Seller settings updated successfully.");
    } catch (requestError) {
      setSubmitError(requestError.message || "Could not update seller settings.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Settings"
        description="Control your seller identity, listing defaults, and notification preferences."
      />

      {error ? <p>{error}</p> : null}

      <Panel title="Seller controls" description="Account and storefront settings prepared for backend integration.">
        <SettingsGrid sections={sellerSettings} />
      </Panel>

      <section className={styles.secondaryGrid}>
        <SettingsEditor
          key={`seller-notifications-${data.emailAlerts}-${data.payoutAlerts}-${data.messageAlerts}`}
          title="Notification settings"
          description="Control how AuctionArc reaches you about bids, payouts, and buyer questions."
          fields={[
            { name: "emailAlerts", label: "Email alerts", type: "select", defaultValue: data.emailAlerts || "Enabled", options: ["Enabled", "Disabled"] },
            { name: "payoutAlerts", label: "Payout reminders", type: "select", defaultValue: data.payoutAlerts || "Enabled", options: ["Enabled", "Disabled"] },
            { name: "messageAlerts", label: "Buyer message alerts", type: "select", defaultValue: data.messageAlerts || "Instant", options: ["Instant", "Hourly", "Daily"] },
          ]}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitMessage={message}
          submitError={submitError}
        />
        <SettingsEditor
          key={`seller-defaults-${data.defaultAuctionDuration}-${data.defaultShipping}-${data.reserveReminder}`}
          title="Listing defaults"
          description="Define the seller-side defaults used while creating new listings."
          fields={[
            { name: "defaultAuctionDuration", label: "Default auction duration", defaultValue: data.defaultAuctionDuration || "7 days" },
            { name: "defaultShipping", label: "Shipping template", defaultValue: data.defaultShipping || "Standard insured shipping" },
            { name: "reserveReminder", label: "Reserve reminder", type: "select", defaultValue: data.reserveReminder || "Enabled", options: ["Enabled", "Disabled"] },
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
