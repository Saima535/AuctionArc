"use client";

import { useMemo, useState } from "react";
import { ProfileEditor, SettingsEditor } from "@/components/account/ProfileForms";
import { SectionIntro } from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import styles from "@/components/seller/SellerAccount.module.css";

function initialsForName(name) {
  return String(name || "AA")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function buildVerificationBadges(verification = {}) {
  return [
    {
      label: verification.isAdultVerified ? "Adult verification complete" : "Adult verification pending",
      className: verification.isAdultVerified ? styles.badge : styles.badgeMuted,
    },
  ];
}

function buildSellerSnapshot(data) {
  return [
    { label: "Store name", value: data.name },
    { label: "Seller label", value: data.publicRoleLabel || data.role },
    { label: "Email", value: data.email },
    { label: "Contact", value: data.contact },
    { label: "Country", value: data.country },
    { label: "Location", value: data.location },
  ].filter((item) => item.value);
}

function buildSellerPreferenceSnapshot(data) {
  return [
    { label: "Response window", value: data.preferences?.responseWindow },
    { label: "Message alerts", value: data.preferences?.messageAlerts },
    { label: "Featured appearance", value: data.preferences?.featuredAppearance },
    { label: "Auction duration", value: data.preferences?.defaultAuctionDuration },
    { label: "Shipping template", value: data.preferences?.defaultShipping },
    { label: "Reserve reminder", value: data.preferences?.reserveReminder },
  ].filter((item) => item.value);
}

export default function SellerProfilePage() {
  const { data, setData, error } = useApiData("/users/me/profile", {
    initialData: {
      name: "",
      role: "Seller",
      email: "",
      location: "",
      publicRoleLabel: "",
      contact: "",
      country: "",
      profilePicture: null,
      preferences: {},
      verification: {},
      stats: [],
    },
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);

  const verificationBadges = useMemo(
    () => buildVerificationBadges(data.verification),
    [data.verification],
  );
  const sellerSnapshot = useMemo(() => buildSellerSnapshot(data), [data]);
  const sellerPreferenceSnapshot = useMemo(() => buildSellerPreferenceSnapshot(data), [data]);
  const profileImageUrl = data.profilePicture?.url || "";
  const identityMeta = [data.publicRoleLabel || data.role, data.email, data.location || data.country]
    .filter(Boolean)
    .join(" | ");

  async function handleProfileSubmit(values) {
    setProfileError("");
    setProfileMessage("");
    setIsSubmittingProfile(true);

    try {
      const result = await apiRequest("/users/me/profile", {
        method: "PATCH",
        body: {
          name: values.name,
          email: values.email,
          publicRoleLabel: values.publicRoleLabel,
          location: values.location,
          contact: values.contact,
          country: values.country,
        },
      });

      setData((current) => ({ ...current, ...result.data }));
      setProfileMessage("Seller profile updated successfully.");
    } catch (submitError) {
      setProfileError(submitError.message || "Could not update seller profile.");
    } finally {
      setIsSubmittingProfile(false);
    }
  }

  async function handlePreferenceSubmit(values) {
    setSettingsError("");
    setSettingsMessage("");
    setIsSubmittingSettings(true);

    try {
      const result = await apiRequest("/users/me/settings", {
        method: "PATCH",
        body: {
          responseWindow: values.responseWindow,
          featuredAppearance: values.featuredAppearance,
          messageAlerts: values.messageAlerts,
          defaultAuctionDuration: values.defaultAuctionDuration,
          defaultShipping: values.defaultShipping,
          reserveReminder: values.reserveReminder,
        },
      });

      setData((current) => ({ ...current, preferences: result.data }));
      setSettingsMessage("Seller operating preferences updated successfully.");
    } catch (submitError) {
      setSettingsError(submitError.message || "Could not update seller preferences.");
    } finally {
      setIsSubmittingSettings(false);
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Seller profile"
        description="Keep your storefront identity, verification, contact details, and selling defaults clean and buyer-ready."
      />

      {error ? <p>{error}</p> : null}

      <section className={styles.heroCard}>
        <div className={styles.heroTop}>
          <div className={styles.identityWrap}>
            {profileImageUrl ? (
              <span
                className={styles.avatarPhoto}
                style={{ backgroundImage: `url(${profileImageUrl})` }}
                aria-label={`${data.name || "Seller"} profile`}
              />
            ) : (
              <span className={styles.avatar}>{initialsForName(data.name)}</span>
            )}
            <div className={styles.identityBlock}>
              <span className={styles.eyebrow}>Seller account</span>
              <h2>{data.name || "Seller account"}</h2>
              {identityMeta ? <p className={styles.identityMeta}>{identityMeta}</p> : null}
            </div>
          </div>

          <div className={styles.badgeRow}>
            {verificationBadges.map((badge) => (
              <span key={badge.label} className={badge.className}>
                {badge.label}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.heroGrid}>
          {data.stats.map((metric) => (
            <article key={metric.label} className={styles.metricCard}>
              <span className={styles.metricLabel}>{metric.label}</span>
              <strong className={styles.metricValue}>{metric.value}</strong>
              <span className={styles.metricDelta}>{metric.delta}</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.infoGrid}>
        {sellerSnapshot.length ? (
          <article className={styles.infoCard}>
            <h3 className={styles.sectionTitle}>Account details</h3>
            <div className={styles.detailGrid}>
              {sellerSnapshot.map((item) => (
                <div key={item.label} className={styles.detailCard}>
                  <span className={styles.detailLabel}>{item.label}</span>
                  <strong className={styles.detailValue}>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>
        ) : null}

        {sellerPreferenceSnapshot.length ? (
          <article className={styles.infoCard}>
            <h3 className={styles.sectionTitle}>Selling preferences</h3>
            <div className={styles.detailGrid}>
              {sellerPreferenceSnapshot.map((item) => (
                <div key={item.label} className={styles.detailCard}>
                  <span className={styles.detailLabel}>{item.label}</span>
                  <strong className={styles.detailValue}>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>
        ) : null}

        <article className={styles.infoCard}>
          <h3 className={styles.sectionTitle}>Verification</h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailCard}>
              <span className={styles.detailLabel}>Adult verification</span>
              <strong className={styles.detailValue}>
                {data.verification?.isAdultVerified ? "Verified" : "Pending"}
              </strong>
            </div>
          </div>
        </article>
      </section>

      <section className={styles.formGrid}>
        <ProfileEditor
          title="Edit seller identity"
          description="Update the storefront information buyers and admins rely on."
          fields={[
            { name: "name", label: "Store name", defaultValue: data.name },
            { name: "publicRoleLabel", label: "Seller label", defaultValue: data.publicRoleLabel || data.role },
            { name: "email", label: "Email", type: "email", defaultValue: data.email },
            { name: "contact", label: "Contact", defaultValue: data.contact },
            { name: "country", label: "Country", defaultValue: data.country },
            { name: "location", label: "Location", defaultValue: data.location },
          ]}
          onSubmit={handleProfileSubmit}
          isSubmitting={isSubmittingProfile}
          submitMessage={profileMessage}
          submitError={profileError}
          helper="These values update your seller-facing profile and internal marketplace records."
        />

        <SettingsEditor
          title="Storefront defaults"
          description="Control how your seller account behaves by default during listing and communication."
          fields={[
            {
              name: "responseWindow",
              label: "Preferred response window",
              defaultValue: data.preferences?.responseWindow || "Within 1 hour",
            },
            {
              name: "messageAlerts",
              label: "Buyer message alerts",
              type: "select",
              defaultValue: data.preferences?.messageAlerts || "Instant",
              options: ["Instant", "Hourly", "Daily"],
            },
            {
              name: "featuredAppearance",
              label: "Featured appearance",
              type: "select",
              defaultValue: data.preferences?.featuredAppearance || "Enabled",
              options: ["Enabled", "Disabled"],
            },
            {
              name: "defaultAuctionDuration",
              label: "Default auction duration",
              defaultValue: data.preferences?.defaultAuctionDuration || "7 days",
            },
            {
              name: "defaultShipping",
              label: "Shipping template",
              defaultValue: data.preferences?.defaultShipping || "Standard insured shipping",
            },
            {
              name: "reserveReminder",
              label: "Reserve reminder",
              type: "select",
              defaultValue: data.preferences?.reserveReminder || "Enabled",
              options: ["Enabled", "Disabled"],
            },
          ]}
          onSubmit={handlePreferenceSubmit}
          isSubmitting={isSubmittingSettings}
          submitMessage={settingsMessage}
          submitError={settingsError}
          helper="These defaults power seller operations and listing preparation, not dummy placeholders."
        />
      </section>
    </div>
  );
}
