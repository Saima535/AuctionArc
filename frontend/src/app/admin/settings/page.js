"use client";

import {
  FilterBar,
  Panel,
  SectionIntro,
  SettingsGrid,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import styles from "../page.module.css";

export default function AdminSettingsPage() {
  const { data, error } = useApiData("/admin/settings", {
    initialData: [],
  });

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Settings"
        description="Every major platform rule and content surface should eventually be governed from here."
        action={<FilterBar items={["Marketplace", "Auctions", "Payments", "Notifications", "Support"]} />}
      />

      <Panel title="Platform control modules" description="Structured settings areas loaded from the backend control center.">
        {error ? <p>{error}</p> : <SettingsGrid sections={data} />}
      </Panel>
    </div>
  );
}
