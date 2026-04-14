import {
  DataTable,
  DetailPanel,
  FilterBar,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { reportsData } from "@/data/admin/mock-data";
import styles from "../page.module.css";

const reportColumns = [
  { key: "id", label: "Case ID" },
  { key: "type", label: "Type" },
  { key: "target", label: "Target" },
  {
    key: "severity",
    label: "Severity",
    render: (value) => (
      <StatusBadge tone={value === "High" ? "danger" : value === "Medium" ? "warn" : "good"}>
        {value}
      </StatusBadge>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <StatusBadge tone={value === "Resolved" ? "good" : value === "Escalated" ? "danger" : "warn"}>
        {value}
      </StatusBadge>
    ),
  },
  { key: "owner", label: "Owner" },
];

export default function AdminReportsPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Reports and risk"
        description="Central queue for complaints, abuse signals, suspicious accounts, and investigation workflows."
        action={<FilterBar items={["All reports", "Fraud", "Listing complaints", "Escalated", "Resolved"]} />}
      />

      <section className={styles.mainGrid}>
        <Panel title="Report queue" description="Case management table for trust and safety.">
          <DataTable columns={reportColumns} rows={reportsData} />
        </Panel>

        <DetailPanel
          title="RPT-501"
          subtitle="Fraud case · Investigating"
          notes={[
            "Repeated bidding pattern connected to a flagged seller-bidder cluster.",
            "Wallet and IP overlap require additional backend-side validation later.",
            "Recommend temporary bidding hold until identity recheck is completed.",
          ]}
          actions={["Assign owner", "Escalate", "Suspend target", "Resolve", "Add note"]}
        />
      </section>
    </div>
  );
}
