"use client";

import { useMemo, useState } from "react";
import { SettingsEditor } from "@/components/account/ProfileForms";
import { SectionIntro } from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import styles from "@/components/seller/SellerAccount.module.css";

function buildSettingsCards(data) {
  return [
    {
      title: "Alerts and communication",
      description: "Notification routing for bids, payouts, and buyer conversations.",
      items: [
        `Email alerts: ${data.emailAlerts || "Enabled"}`,
        `Payout reminders: ${data.payoutAlerts || "Enabled"}`,
        `Buyer message alerts: ${data.messageAlerts || "Instant"}`,
      ],
    },
    {
      title: "Listing preparation",
      description: "Defaults used when creating or refining new auction products.",
      items: [
        `Default duration: ${data.defaultAuctionDuration || "7 days"}`,
        `Shipping template: ${data.defaultShipping || "Standard insured shipping"}`,
        `Reserve reminder: ${data.reserveReminder || "Enabled"}`,
      ],
    },
    {
      title: "Storefront visibility",
      description: "How aggressively your seller profile and listings present themselves.",
      items: [
        `Featured appearance: ${data.featuredAppearance || "Enabled"}`,
        `Response window: ${data.responseWindow || "Within 1 hour"}`,
        `Message cadence: ${data.messageAlerts || "Instant"}`,
      ],
    },
    {
      title: "Buyer-facing preferences",
      description: "Settings buyers indirectly feel through your storefront behavior.",
      items: [
        `Email communication: ${data.emailAlerts || "Enabled"}`,
        `Shipping expectation: ${data.defaultShipping || "Standard insured shipping"}`,
        `Response expectation: ${data.responseWindow || "Within 1 hour"}`,
      ],
    },
  ];
}

export default function SellerSettingsPage() {
  const { data, setData, error } = useApiData("/users/me/settings", {
    initialData: {},
  });
  const [message, setMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const settingsCards = useMemo(() => buildSettingsCards(data), [data]);

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
        title="Seller settings"
        description="Tune seller alerts, listing defaults, and storefront behavior using your real account settings."
      />

      {error ? <p>{error}</p> : null}

      <section className={styles.settingsGrid}>
        {settingsCards.map((section) => (
          <article key={section.title} className={styles.settingsCard}>
            <h3>{section.title}</h3>
            <p>{section.description}</p>
            <ul className={styles.settingsItems}>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <article className={styles.timelineCard}>
        <div className={styles.timelineHeader}>
          <div>
            <h3 className={styles.sectionTitle}>What these settings control</h3>
            <p className={styles.sectionDescription}>
              These are live seller controls, not placeholder modules.
            </p>
          </div>
          <span className={styles.badgeGood}>Live preferences</span>
        </div>

        <ul className={styles.timelineList}>
          <li className={styles.timelineItem}>
            <div className={styles.timelineMeta}>
              <strong>Buyer communication</strong>
              <p>Message and email preferences affect how quickly you stay aligned with interested buyers.</p>
            </div>
            <span className={styles.timelineStatus}>{data.messageAlerts || "Instant"}</span>
          </li>
          <li className={styles.timelineItem}>
            <div className={styles.timelineMeta}>
              <strong>Listing workflow</strong>
              <p>Default duration, shipping, and reserve reminders shape how efficiently you launch new products.</p>
            </div>
            <span className={styles.timelineStatus}>{data.defaultAuctionDuration || "7 days"}</span>
          </li>
          <li className={styles.timelineItem}>
            <div className={styles.timelineMeta}>
              <strong>Storefront presentation</strong>
              <p>Featured visibility and response expectations directly affect buyer trust and engagement.</p>
            </div>
            <span className={styles.timelineStatus}>{data.featuredAppearance || "Enabled"}</span>
          </li>
        </ul>
      </article>

      <section className={styles.formGrid}>
        <SettingsEditor
          title="Notification settings"
          description="Control how AuctionArc reaches you about bids, payouts, and buyer questions."
          fields={[
            {
              name: "emailAlerts",
              label: "Email alerts",
              type: "select",
              defaultValue: data.emailAlerts || "Enabled",
              options: ["Enabled", "Disabled"],
            },
            {
              name: "payoutAlerts",
              label: "Payout reminders",
              type: "select",
              defaultValue: data.payoutAlerts || "Enabled",
              options: ["Enabled", "Disabled"],
            },
            {
              name: "messageAlerts",
              label: "Buyer message alerts",
              type: "select",
              defaultValue: data.messageAlerts || "Instant",
              options: ["Instant", "Hourly", "Daily"],
            },
            {
              name: "responseWindow",
              label: "Preferred response window",
              defaultValue: data.responseWindow || "Within 1 hour",
            },
          ]}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitMessage={message}
          submitError={submitError}
          helper="Communication settings apply to your live seller account immediately after save."
        />

        <SettingsEditor
          title="Listing defaults"
          description="Define the seller-side defaults used while preparing new auction listings."
          fields={[
            {
              name: "defaultAuctionDuration",
              label: "Default auction duration",
              defaultValue: data.defaultAuctionDuration || "7 days",
            },
            {
              name: "defaultShipping",
              label: "Shipping template",
              defaultValue: data.defaultShipping || "Standard insured shipping",
            },
            {
              name: "reserveReminder",
              label: "Reserve reminder",
              type: "select",
              defaultValue: data.reserveReminder || "Enabled",
              options: ["Enabled", "Disabled"],
            },
            {
              name: "featuredAppearance",
              label: "Featured appearance",
              type: "select",
              defaultValue: data.featuredAppearance || "Enabled",
              options: ["Enabled", "Disabled"],
            },
          ]}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitMessage={message}
          submitError={submitError}
          helper="These defaults reduce repetitive setup when you create and manage seller inventory."
        />
      </section>
    </div>
  );
}
