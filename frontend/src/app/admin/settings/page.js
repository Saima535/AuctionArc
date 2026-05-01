"use client";

import { useEffect, useState } from "react";
import {
  FilterBar,
  Panel,
  SectionIntro,
  SettingsGrid,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import styles from "../page.module.css";

export default function AdminSettingsPage() {
  const { data, setData, error } = useApiData("/admin/settings", {
    initialData: [],
  });
  const [draftSections, setDraftSections] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

  useEffect(() => {
    setDraftSections(
      data.map((section) => ({
        title: section.title || "",
        description: section.description || "",
        itemsText: Array.isArray(section.items) ? section.items.join("\n") : "",
      })),
    );
  }, [data]);

  function updateDraftSection(index, field, value) {
    setDraftSections((current) =>
      current.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [field]: value } : section,
      ),
    );
  }

  function addDraftSection() {
    setDraftSections((current) => [
      ...current,
      {
        title: "New control module",
        description: "Describe what this admin setting controls.",
        itemsText: "New setting item",
      },
    ]);
  }

  function removeDraftSection(index) {
    setDraftSections((current) => current.filter((_, sectionIndex) => sectionIndex !== index));
  }

  async function handleSaveSettings() {
    setIsSaving(true);
    setPageError("");
    setPageMessage("");

    const sections = draftSections
      .map((section) => ({
        title: section.title.trim(),
        description: section.description.trim(),
        items: section.itemsText
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      }))
      .filter((section) => section.title);

    try {
      const result = await apiRequest("/admin/settings", {
        method: "PATCH",
        body: { sections },
      });

      setData(result.data);
      setPageMessage("Platform settings saved successfully.");
    } catch (requestError) {
      setPageError(requestError.message || "Could not save platform settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Settings"
        description="Every major platform rule and content surface should eventually be governed from here."
        action={<FilterBar items={["Marketplace", "Auctions", "Payments", "Notifications", "Support"]} />}
      />

      {pageError ? <p className={styles.inlineNotice}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successNotice}>{pageMessage}</p> : null}

      <Panel title="Platform control modules" description="Structured settings areas loaded from the backend control center.">
        {error ? <p>{error}</p> : <SettingsGrid sections={data} />}
      </Panel>

      <Panel title="Edit platform settings" description="Update the stored marketplace control modules used by the admin backend.">
        <div className={styles.compactList}>
          {!draftSections.length ? <p className={styles.inlineNotice}>No settings modules are configured yet.</p> : null}
          {draftSections.map((section, index) => (
            <article key={`${section.title}-${index}`} className={styles.formCard}>
              <label className={styles.fieldLabel} htmlFor={`settings-title-${index}`}>Module title</label>
              <input
                id={`settings-title-${index}`}
                className={styles.textInput}
                value={section.title}
                onChange={(event) => updateDraftSection(index, "title", event.target.value)}
              />

              <label className={styles.fieldLabel} htmlFor={`settings-description-${index}`}>Description</label>
              <input
                id={`settings-description-${index}`}
                className={styles.textInput}
                value={section.description}
                onChange={(event) => updateDraftSection(index, "description", event.target.value)}
              />

              <label className={styles.fieldLabel} htmlFor={`settings-items-${index}`}>Items</label>
              <textarea
                id={`settings-items-${index}`}
                className={styles.textarea}
                value={section.itemsText}
                onChange={(event) => updateDraftSection(index, "itemsText", event.target.value)}
              />

              <div className={styles.actionRow}>
                <button type="button" className={styles.dangerButton} onClick={() => removeDraftSection(index)}>
                  Remove module
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.actionRow}>
          <button type="button" className={styles.secondaryButton} onClick={addDraftSection}>
            Add module
          </button>
          <button type="button" className={styles.actionButton} disabled={isSaving} onClick={handleSaveSettings}>
            {isSaving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </Panel>
    </div>
  );
}
