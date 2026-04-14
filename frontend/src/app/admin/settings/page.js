import {
  FilterBar,
  Panel,
  SectionIntro,
  SettingsGrid,
} from "@/components/admin/AdminPrimitives";
import { settingsSections } from "@/data/admin/mock-data";
import styles from "../page.module.css";

export default function AdminSettingsPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Settings"
        description="Every major platform rule and content surface should eventually be governed from here."
        action={<FilterBar items={["Marketplace", "Auctions", "Payments", "Notifications", "Support"]} />}
      />

      <Panel title="Platform control modules" description="Structured settings areas designed for future backend wiring and authorization rules.">
        <SettingsGrid sections={settingsSections} />
      </Panel>
    </div>
  );
}
