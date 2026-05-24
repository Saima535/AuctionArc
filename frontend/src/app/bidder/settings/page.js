"use client";

import { useState } from "react";
import {
  Panel,
  SectionIntro,
  SettingsGrid,
} from "@/components/admin/AdminPrimitives";
import { SettingsEditor, ProfileEditor } from "@/components/account/ProfileForms";
import Modal from "@/components/ui/Modal";
import PasswordForm from "@/components/account/PasswordForm";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import styles from "@/components/member/MemberDashboard.module.css";

const bidderSettings = [
  {
    title: "Profile",
    description: "Personal account details and contact information.",
    items: ["Contact information", "Verification details", "Preferred country and currency"],
  },
  {
    title: "Bidding preferences",
    description: "Control category interests and bidding reminders.",
    items: ["Outbid alerts", "Category preferences", "Ending-soon reminders"],
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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState(null);
  function handleManage(sectionTitle) {
    setModalTitle(sectionTitle);

    if (sectionTitle === "Profile") {
      setModalContent(
        <ProfileEditor
          title="Edit profile"
          description="Update your contact, identity, and country settings."
          fields={[
            { name: "name", label: "Display name" },
            { name: "email", label: "Email" },
            { name: "contact", label: "Contact number" },
            { name: "country", label: "Country" },
          ]}
          onSubmit={async (values) => {
            // call profile update endpoint directly
            try {
              await apiRequest("/users/me/profile", { method: "PATCH", body: values });
              setModalOpen(false);
            } catch (err) {
              // show error inside modal component if needed
            }
          }}
        />,
      );
    } else if (sectionTitle === "Bidding preferences") {
      setModalContent(
        <SettingsEditor
          title="Bidding preferences"
          description="Manage alerts, categories, and reminders."
          fields={[
            { name: "outbidAlerts", label: "Outbid alerts", type: "select", options: ["Instant", "Hourly", "Daily"], defaultValue: data.outbidAlerts || "Instant" },
            { name: "endingAlerts", label: "Ending soon reminders", type: "select", options: ["Enabled", "Disabled"], defaultValue: data.endingAlerts || "Enabled" },
            { name: "categoryFocus", label: "Category focus", defaultValue: data.categoryFocus || "General" },
          ]}
          onSubmit={async (values) => {
            await handleSubmit(values);
            setModalOpen(false);
          }}
        />,
      );
    } else if (sectionTitle === "Security") {
      setModalContent(<PasswordForm onSaved={() => setModalOpen(false)} />);
    } else {
      setModalContent(null);
    }

    setModalOpen(true);
  }

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
      setMessage("Buyer settings updated successfully.");
    } catch (requestError) {
      setSubmitError(requestError.message || "Could not update buyer settings.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Settings"
        description="Control profile, alerts, buying preferences, and account security."
      />

      {error ? <p>{error}</p> : null}

      <Panel title="Buyer controls" description="Personal preferences and account settings ready for backend integration.">
        <SettingsGrid sections={bidderSettings} onManage={handleManage} />
      </Panel>

      <Modal open={modalOpen} title={modalTitle} onClose={() => setModalOpen(false)}>
        {modalContent}
      </Modal>

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
          key={`bidder-buying-${data.currency}-${data.categoryFocus}`}
          title="Buying preferences"
          description="Tune discovery defaults and bidding experience preferences."
          fields={[
            { name: "currency", label: "Preferred currency", defaultValue: data.currency || "USD" },
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
