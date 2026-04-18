"use client";

import { useState } from "react";
import {
  Panel,
  SectionIntro,
  SettingsGrid,
  StatCard,
} from "@/components/admin/AdminPrimitives";
import { ProfileEditor, SettingsEditor } from "@/components/account/ProfileForms";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import styles from "../page.module.css";

export default function AdminProfilePage() {
  const { data, setData, error } = useApiData("/users/me/profile", {
    initialData: {
      name: "",
      role: "Admin",
      email: "",
      location: "",
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
        description={`Manage ${data.name || "the admin"}'s identity, security posture, and audit-facing admin preferences.`}
      />

      {error ? <p>{error}</p> : null}

      <section className={styles.statGrid}>
        {data.stats.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className={styles.secondaryGrid}>
        <Panel title="Identity summary" description="Core admin account details and contact surface.">
          <div className={styles.compactList}>
            {[`Name: ${data.name}`, `Role: ${data.role}`, `Email: ${data.email}`, `Location: ${data.location}`].map((item) => (
              <article key={item} className={styles.compactCard}>
                <div>
                  <strong>{item}</strong>
                  <p>These values are now loaded from your live admin account.</p>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Admin profile controls" description="Identity and security modules for the admin account.">
          <SettingsGrid sections={data.sections} />
        </Panel>
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
