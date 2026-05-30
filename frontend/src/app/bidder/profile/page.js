"use client";

import { useMemo, useState } from "react";
import { ProfileEditor } from "@/components/account/ProfileForms";
import { SectionIntro } from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import styles from "./ProfilePage.module.css";

function initialsForName(name) {
  return String(name || "BA")
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
      label: verification.isAdultVerified ? "Adult verified" : "Adult review pending",
      className: verification.isAdultVerified ? styles.badge : styles.badgeMuted,
    },
  ];
}

function buildProfileSnapshot(data) {
  return [
    { label: "Full name", value: data.name },
    { label: "Account type", value: String(data.publicRoleLabel || data.role || "Buyer").replace(/bidder/gi, "buyer") },
    { label: "Email", value: data.email },
    { label: "Phone", value: data.contact },
    { label: "Country", value: data.country },
    { label: "Location", value: data.location },
  ].filter((item) => item.value);
}

export default function BidderProfilePage() {
  const { data, setData, error } = useApiData("/users/me/profile", {
    initialData: {
      name: "",
      role: "Buyer",
      email: "",
      location: "",
      publicRoleLabel: "",
      contact: "",
      country: "",
      profilePicture: null,
      preferences: {},
      verification: {},
      stats: [],
      sections: [],
    },
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  const verificationBadges = useMemo(
    () => buildVerificationBadges(data.verification),
    [data.verification],
  );
  const profileSnapshot = useMemo(() => buildProfileSnapshot(data), [data]);
  const profileImageUrl = data.profilePicture?.url || "";
  const identityMeta = [data.email, data.location || data.country].filter(Boolean).join(" | ");

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
      setProfileMessage("Buyer profile updated successfully.");
    } catch (submitError) {
      setProfileError(submitError.message || "Could not update buyer profile.");
    } finally {
      setIsSubmittingProfile(false);
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Buyer profile"
        description="Keep your buyer identity and contact details clear, current, and ready for every auction."
      />

      {error ? <p>{error}</p> : null}

      <section className={styles.heroCard}>
        <div className={styles.heroTop}>
          <div className={styles.identityWrap}>
            {profileImageUrl ? (
              <span
                className={styles.avatarPhoto}
                style={{ backgroundImage: `url(${profileImageUrl})` }}
                aria-label={`${data.name || "Buyer"} profile`}
              />
            ) : (
              <span className={styles.avatar}>{initialsForName(data.name)}</span>
            )}
            <div className={styles.identityBlock}>
              <span className={styles.eyebrow}>Buyer account</span>
              <h2>{data.name || "Buyer account"}</h2>
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

        <div className={styles.metricGrid}>
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
        {profileSnapshot.length ? (
          <article className={styles.infoCard}>
            <h3 className={styles.sectionTitle}>Account details</h3>
            <div className={styles.detailGrid}>
              {profileSnapshot.map((item) => (
                <div key={item.label} className={styles.detailCard}>
                  <span className={styles.detailLabel}>{item.label}</span>
                  <strong className={styles.detailValue}>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>
        ) : null}

      </section>

      <section className={styles.formGrid}>
        <ProfileEditor
          key={`bidder-profile-${data.email}-${data.location}-${data.publicRoleLabel}-${data.contact}-${data.country}`}
          title="Edit buyer details"
          description="Update the identity and contact information used across your bidder account."
          fields={[
            { name: "name", label: "Full name", defaultValue: data.name },
            { name: "publicRoleLabel", label: "Account label", defaultValue: String(data.publicRoleLabel || data.role || "").replace(/bidder/gi, "buyer") },
            { name: "email", label: "Email", type: "email", defaultValue: data.email },
            { name: "contact", label: "Phone", defaultValue: data.contact },
            { name: "country", label: "Country", defaultValue: data.country },
            { name: "location", label: "Location", defaultValue: data.location },
          ]}
          onSubmit={handleProfileSubmit}
          isSubmitting={isSubmittingProfile}
          submitMessage={profileMessage}
          submitError={profileError}
          helper="Changes here update your live buyer account details."
        />
      </section>
    </div>
  );
}
