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

export default function SellerProfilePage() {
  const { data, setData, error } = useApiData("/users/me/profile", {
    initialData: {
      name: "",
      role: "Seller",
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
          responseWindow: values.responseWindow,
          featuredAppearance: values.featuredAppearance,
          messageAlerts: values.messageAlerts,
        },
      });

      setData((current) => ({ ...current, preferences: result.data }));
      setSettingsMessage("Seller preferences updated successfully.");
    } catch (submitError) {
      setSettingsError(submitError.message || "Could not update preferences.");
    } finally {
      setIsSubmittingSettings(false);
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Seller profile"
        description="Control storefront identity, verification details, and how buyers experience your seller presence."
      />

      {error ? <p>{error}</p> : null}

      <section className={styles.statGrid}>
        {data.stats.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className={styles.secondaryGrid}>
        <Panel title="Profile summary" description="Key seller identity and trust information.">
          <div className={styles.compactList}>
            {[`Store: ${data.name}`, `Role: ${data.role}`, `Email: ${data.email}`, `Location: ${data.location}`].map((item) => (
              <article key={item} className={styles.compactCard}>
                <div>
                  <strong>{item}</strong>
                  <p>These values are now loaded from your live seller account.</p>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Seller profile modules" description="Profile and trust systems for your seller account.">
          <SettingsGrid sections={data.sections} />
        </Panel>
      </section>

      <section className={styles.secondaryGrid}>
        <ProfileEditor
          key={`seller-profile-${data.email}-${data.location}-${data.publicRoleLabel}`}
          title="Edit storefront profile"
          description="Maintain the seller storefront identity, business details, and public trust presentation."
          fields={[
            { name: "name", label: "Store name", defaultValue: data.name },
            { name: "email", label: "Public email", type: "email", defaultValue: data.email },
            { name: "publicRoleLabel", label: "Seller label", defaultValue: data.publicRoleLabel || data.role },
            { name: "location", label: "Location", defaultValue: data.location },
          ]}
          onSubmit={handleProfileSubmit}
          isSubmitting={isSubmittingProfile}
          submitMessage={profileMessage}
          submitError={profileError}
        />
        <SettingsEditor
          key={`seller-preferences-${data.preferences.responseWindow}-${data.preferences.featuredAppearance}-${data.preferences.messageAlerts}`}
          title="Storefront controls"
          description="Set storefront-level visibility defaults and response expectations."
          fields={[
            { name: "responseWindow", label: "Preferred response window", defaultValue: data.preferences.responseWindow || "Within 1 hour" },
            { name: "featuredAppearance", label: "Featured appearance", type: "select", defaultValue: data.preferences.featuredAppearance || "Enabled", options: ["Enabled", "Disabled"] },
            { name: "messageAlerts", label: "Bid alert mode", type: "select", defaultValue: data.preferences.messageAlerts || "Instant", options: ["Instant", "Hourly", "Daily"] },
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
