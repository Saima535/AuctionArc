import {
  DataTable,
  DetailPanel,
  FilterBar,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { featuredUser, usersData } from "@/data/admin/mock-data";
import styles from "../page.module.css";

const userColumns = [
  { key: "id", label: "User ID" },
  { key: "name", label: "Name" },
  { key: "role", label: "Role" },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <StatusBadge tone={value === "Active" ? "good" : value === "Suspended" || value === "Flagged" ? "danger" : "warn"}>
        {value}
      </StatusBadge>
    ),
  },
  { key: "country", label: "Country" },
  { key: "contact", label: "Contact" },
  { key: "joined", label: "Joined" },
  { key: "lastSeen", label: "Last seen" },
];

export default function AdminUsersPage() {
  return (
    <div className={styles.page}>
      <SectionIntro
        title="Users"
        description="Manage seller and bidder identity, verification status, flags, and intervention actions."
        action={<FilterBar items={["All users", "Sellers", "Bidders", "Pending verification", "Flagged"]} />}
      />

      <section className={styles.mainGrid}>
        <Panel title="User directory" description="Search-ready roster for marketplace participants.">
          <DataTable columns={userColumns} rows={usersData} />
        </Panel>

        <DetailPanel
          title={featuredUser.name}
          subtitle={`${featuredUser.role} · ${featuredUser.status}`}
          notes={featuredUser.notes}
          actions={["View profile", "Verify user", "Suspend", "Contact", "Flag account"]}
        />
      </section>
    </div>
  );
}
