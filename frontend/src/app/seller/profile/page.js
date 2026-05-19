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
      label: verification.isIdentityVerified ? "Identity verified" : "Identity pending",
      className: verification.isIdentityVerified ? styles.badgeGood : styles.badgeWarn,
    },
    {
      label: verification.isAdultVerified ? "Adult verification complete" : "Adult verification pending",
      className: verification.isAdultVerified ? styles.badge : styles.badgeMuted,
    },
  ];
}

function buildSellerModules(data) {
  return [
    {
      title: "Store identity",
      description: "How your storefront appears to buyers across listings and messages.",
      items: [
        `Store name: ${data.name || "Not set"}`,
        `Public seller label: ${data.publicRoleLabel || "Seller"}`,
        `Location: ${data.location || "Not set"}`,
      ],
    },
    {
      title: "Communication",
      description: "The core ways AuctionArc buyers and support can reach you.",
      items: [
        `Email alerts: ${data.preferences?.emailAlerts || "Enabled"}`,
        `Buyer message alerts: ${data.preferences?.messageAlerts || "Instant"}`,
        `Preferred response window: ${data.preferences?.responseWindow || "Within 1 hour"}`,
      ],
    },
    {
      title: "Listing defaults",
      description: "The seller defaults used when you prepare new auction products.",
      items: [
        `Default auction duration: ${data.preferences?.defaultAuctionDuration || "7 days"}`,
        `Shipping template: ${data.preferences?.defaultShipping || "Standard insured shipping"}`,
        `Reserve reminder: ${data.preferences?.reserveReminder || "Enabled"}`,
      ],
    },
    {
      title: "Trust readiness",
      description: "Verification and storefront readiness for current seller activity.",
      items: [
        `Identity verification: ${data.verification?.isIdentityVerified ? "Verified" : "Pending"}`,
        `Adult verification: ${data.verification?.isAdultVerified ? "Verified" : "Pending"}`,
        `Seller rating: ${data.stats?.find?.((item) => item.label === "Verification")?.value || "Pending"}`,
      ],
    },
  ];
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
  const sellerModules = useMemo(() => buildSellerModules(data), [data]);

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
            <span className={styles.avatar}>{initialsForName(data.name)}</span>
            <div className={styles.identityBlock}>
              <span className={styles.eyebrow}>Seller account</span>
              <h2>{data.name || "Seller storefront"}</h2>
              <p className={styles.identityMeta}>
                {data.publicRoleLabel || "Seller"} | {data.email || "No email set"} |{" "}
                {data.location || data.country || "Location not set"}
              </p>
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
        <article className={styles.infoCard}>
          <h3 className={styles.sectionTitle}>Account details</h3>
          <p className={styles.sectionDescription}>
            The core seller identity values currently connected to your live account.
          </p>
          <div className={styles.detailGrid}>
            <ul className={styles.infoList}>
              <li className={styles.infoRow}>
                <span className={styles.infoKey}>Store name</span>
                <strong className={styles.infoValue}>{data.name || "Not set"}</strong>
              </li>
              <li className={styles.infoRow}>
                <span className={styles.infoKey}>Seller label</span>
                <strong className={styles.infoValue}>{data.publicRoleLabel || "Seller"}</strong>
              </li>
              <li className={styles.infoRow}>
                <span className={styles.infoKey}>Email</span>
                <strong className={styles.infoValue}>{data.email || "Not set"}</strong>
              </li>
            </ul>
            <ul className={styles.infoList}>
              <li className={styles.infoRow}>
                <span className={styles.infoKey}>Contact</span>
                <strong className={styles.infoValue}>{data.contact || "Not set"}</strong>
              </li>
              <li className={styles.infoRow}>
                <span className={styles.infoKey}>Country</span>
                <strong className={styles.infoValue}>{data.country || "Not set"}</strong>
              </li>
              <li className={styles.infoRow}>
                <span className={styles.infoKey}>Location</span>
                <strong className={styles.infoValue}>{data.location || "Not set"}</strong>
              </li>
            </ul>
          </div>
        </article>

        <article className={styles.infoCard}>
          <h3 className={styles.sectionTitle}>Verification and trust</h3>
          <p className={styles.sectionDescription}>
            A quick operational view of seller verification and marketplace trust checks.
          </p>
          <div className={styles.detailGrid}>
            <ul className={styles.infoList}>
              <li className={styles.infoRow}>
                <span className={styles.infoKey}>Identity</span>
                <strong className={styles.infoValue}>
                  {data.verification?.isIdentityVerified ? "Verified" : "Pending"}
                </strong>
              </li>
              <li className={styles.infoRow}>
                <span className={styles.infoKey}>Adult verification</span>
                <strong className={styles.infoValue}>
                  {data.verification?.isAdultVerified ? "Verified" : "Pending"}
                </strong>
              </li>
            </ul>
          </div>
        </article>
      </section>

      <section className={styles.settingsGrid}>
        {sellerModules.map((section) => (
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
            <h3 className={styles.sectionTitle}>Seller profile checklist</h3>
            <p className={styles.sectionDescription}>
              The essentials buyers and admins expect to see kept current.
            </p>
          </div>
          <span className={styles.badgeGood}>Live account data</span>
        </div>

        <ul className={styles.timelineList}>
          <li className={styles.timelineItem}>
            <div className={styles.timelineMeta}>
              <strong>Store identity</strong>
              <p>Store name, public seller label, and location should stay accurate for buyer trust.</p>
            </div>
            <span className={styles.timelineStatus}>{data.publicRoleLabel || "Seller"}</span>
          </li>
          <li className={styles.timelineItem}>
            <div className={styles.timelineMeta}>
              <strong>Buyer communication</strong>
              <p>Contact details and response window shape how buyers experience your storefront.</p>
            </div>
            <span className={styles.timelineStatus}>{data.preferences?.responseWindow || "Within 1 hour"}</span>
          </li>
          <li className={styles.timelineItem}>
            <div className={styles.timelineMeta}>
              <strong>Verification readiness</strong>
              <p>Identity checks affect trust, approvals, and buyer confidence.</p>
            </div>
            <span className={styles.timelineStatus}>
              {data.verification?.isIdentityVerified ? "Verified" : "Pending review"}
            </span>
          </li>
        </ul>
      </article>

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
