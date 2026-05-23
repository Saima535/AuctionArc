"use client";

import { useMemo, useState } from "react";
import { SectionIntro, StatCard } from "@/components/admin/AdminPrimitives";
import { ProfileEditor, SettingsEditor } from "@/components/account/ProfileForms";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import styles from "../page.module.css";

function initialsForName(name) {
  return String(name || "AD")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function buildAdminSnapshot(data) {
  return [
    { label: "Full name", value: data.name },
    { label: "Role title", value: data.publicRoleLabel || data.role },
    { label: "Email", value: data.email },
    { label: "Location", value: data.location },
  ].filter((item) => item.value);
}

function buildSecuritySnapshot(data) {
  return [
    { label: "Two-factor mode", value: data.preferences?.twoFactorMode },
    { label: "Session timeout", value: data.preferences?.sessionTimeout },
    { label: "Audit email", value: data.preferences?.auditEmail || data.email },
    { label: "Status", value: data.status },
  ].filter((item) => item.value);
}

export default function AdminProfilePage() {
  const { data, setData, error } = useApiData("/users/me/profile", {
    initialData: {
      name: "",
      role: "Admin",
      email: "",
      location: "",
      status: "",
      publicRoleLabel: "",
      profilePicture: null,
      preferences: {},
      stats: [],
      sections: [],
    },
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);
  const adminSnapshot = useMemo(() => buildAdminSnapshot(data), [data]);
  const securitySnapshot = useMemo(() => buildSecuritySnapshot(data), [data]);
  const profileImageUrl = data.profilePicture?.url || "";
  const identityMeta = [data.publicRoleLabel || data.role, data.email, data.location]
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
        },
      });

      setData((current) => ({ ...current, ...result.data }));
      setProfileMessage("Admin profile updated successfully.");
    } catch (submitError) {
      setProfileError(submitError.message || "Could not update admin profile.");
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
          twoFactorMode: values.twoFactorMode,
          sessionTimeout: values.sessionTimeout,
          auditEmail: values.auditEmail,
        },
      });

      setData((current) => ({ ...current, preferences: result.data }));
      setSettingsMessage("Admin preferences updated successfully.");
    } catch (submitError) {
      setSettingsError(submitError.message || "Could not update admin preferences.");
    } finally {
      setIsSubmittingSettings(false);
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Admin profile"
        description="Manage your admin identity, security settings, and audit routing details."
      />

      {error ? <p>{error}</p> : null}

      <section className={styles.identityHero}>
        <div className={styles.identityHeroTop}>
          <div className={styles.identityWrap}>
            {profileImageUrl ? (
              <span
                className={styles.avatarPhoto}
                style={{ backgroundImage: `url(${profileImageUrl})` }}
                aria-label={`${data.name || "Admin"} profile`}
              />
            ) : (
              <span className={styles.avatarFallback}>{initialsForName(data.name)}</span>
            )}
            <div>
              <span className={styles.identityEyebrow}>Admin account</span>
              <h2 className={styles.identityTitle}>{data.name || "Admin account"}</h2>
              {identityMeta ? <p className={styles.identityMeta}>{identityMeta}</p> : null}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.statGrid}>
        {data.stats.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className={styles.secondaryGrid}>
        {adminSnapshot.length ? (
          <article className={styles.detailPanel}>
            <h3>Account details</h3>
            <div className={styles.profileDetailGrid}>
              {adminSnapshot.map((item) => (
                <div key={item.label} className={styles.profileDetailCard}>
                  <span className={styles.profileDetailLabel}>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>
        ) : null}

        {securitySnapshot.length ? (
          <article className={styles.detailPanel}>
            <h3>Security overview</h3>
            <div className={styles.profileDetailGrid}>
              {securitySnapshot.map((item) => (
                <div key={item.label} className={styles.profileDetailCard}>
                  <span className={styles.profileDetailLabel}>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>
        ) : null}
      </section>

      <section className={styles.secondaryGrid}>
        <ProfileEditor
          key={`admin-profile-${data.email}-${data.location}-${data.publicRoleLabel}`}
          title="Edit admin identity"
          description="Update the super-admin display identity, contact routing, and location details."
          fields={[
            { name: "name", label: "Full name", defaultValue: data.name },
            { name: "email", label: "Email", type: "email", defaultValue: data.email },
            { name: "publicRoleLabel", label: "Role title", defaultValue: data.publicRoleLabel || data.role },
            { name: "location", label: "Location", defaultValue: data.location },
          ]}
          onSubmit={handleProfileSubmit}
          isSubmitting={isSubmittingProfile}
          submitMessage={profileMessage}
          submitError={profileError}
        />
        <SettingsEditor
          key={`admin-preferences-${data.preferences.twoFactorMode}-${data.preferences.sessionTimeout}-${data.preferences.auditEmail}`}
          title="Security preferences"
          description="Configure admin-facing alerting and security settings."
          fields={[
            { name: "twoFactorMode", label: "Two-factor mode", type: "select", defaultValue: data.preferences.twoFactorMode || "Enabled", options: ["Enabled", "Disabled"] },
            { name: "sessionTimeout", label: "Session timeout", defaultValue: data.preferences.sessionTimeout || "30 minutes" },
            { name: "auditEmail", label: "Audit alert email", type: "email", defaultValue: data.preferences.auditEmail || data.email },
          ]}
          onSubmit={handlePreferenceSubmit}
          isSubmitting={isSubmittingSettings}
          submitMessage={settingsMessage}
          submitError={settingsError}
        />
      </section>
    </div>
  );
}
