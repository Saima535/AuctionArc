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
import styles from "@/components/member/MemberDashboard.module.css";

export default function BidderProfilePage() {
  const { data, setData, error } = useApiData("/users/me/profile", {
    initialData: {
      name: "",
      role: "Bidder",
      email: "",
      location: "",
      publicRoleLabel: "",
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
      setProfileMessage("Profile updated successfully.");
    } catch (submitError) {
      setProfileError(submitError.message || "Could not update profile.");
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
          outbidAlerts: values.outbidAlerts,
          categoryFocus: values.categoryFocus,
          currency: values.currency,
        },
      });

      setData((current) => ({ ...current, preferences: result.data }));
      setSettingsMessage("Bidder preferences updated successfully.");
    } catch (submitError) {
      setSettingsError(submitError.message || "Could not update preferences.");
    } finally {
      setIsSubmittingSettings(false);
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Bidder profile"
        description="Manage bidder identity, verification, communication preferences, and buying profile settings."
      />

      {error ? <p>{error}</p> : null}

      <section className={styles.statGrid}>
        {data.stats.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className={styles.secondaryGrid}>
        <Panel title="Profile summary" description="Core bidder identity and account trust information.">
          <div className={styles.compactList}>
            {[`Name: ${data.name}`, `Role: ${data.role}`, `Email: ${data.email}`, `Location: ${data.location}`].map((item) => (
              <article key={item} className={styles.compactCard}>
                <div>
                  <strong>{item}</strong>
                  <p>These values are now loaded from your live bidder account.</p>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Bidder profile modules" description="Identity, communication, and preference systems for your bidder account.">
          <SettingsGrid sections={data.sections} />
        </Panel>
      </section>

      <section className={styles.secondaryGrid}>
        <ProfileEditor
          key={`bidder-profile-${data.email}-${data.location}-${data.publicRoleLabel}`}
          title="Edit bidder profile"
          description="Maintain bidder identity, profile visibility, and preference-facing account details."
          fields={[
            { name: "name", label: "Full name", defaultValue: data.name },
            { name: "email", label: "Email", type: "email", defaultValue: data.email },
            { name: "publicRoleLabel", label: "Account label", defaultValue: data.publicRoleLabel || data.role },
            { name: "location", label: "Location", defaultValue: data.location },
          ]}
          onSubmit={handleProfileSubmit}
          isSubmitting={isSubmittingProfile}
          submitMessage={profileMessage}
          submitError={profileError}
        />
        <SettingsEditor
          key={`bidder-preferences-${data.preferences.outbidAlerts}-${data.preferences.categoryFocus}-${data.preferences.currency}`}
          title="Bidding preferences"
          description="Control bidder-side communication and discovery preferences."
          fields={[
            { name: "outbidAlerts", label: "Outbid alerts", type: "select", defaultValue: data.preferences.outbidAlerts || "Instant", options: ["Instant", "Hourly", "Daily"] },
            { name: "categoryFocus", label: "Preferred categories", defaultValue: data.preferences.categoryFocus || "Vehicles, Collectibles" },
            { name: "currency", label: "Preferred currency", defaultValue: data.preferences.currency || "USD" },
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
