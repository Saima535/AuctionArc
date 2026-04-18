"use client";

import styles from "@/components/admin-custom/AdminCustom.module.css";
import { PanelCard, StatusPill } from "@/components/admin-custom/AdminUi";

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 5.5 5.7v5.6c0 4.2 2.6 7.9 6.5 9.7 3.9-1.8 6.5-5.5 6.5-9.7V5.7L12 3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6.5h16v11H4z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m5 8 7 5 7-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6.5 18a5.5 5.5 0 0 1 11 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BanIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8.7 8.7 6.6 6.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6S2.5 12 2.5 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8.6 12.2 2.2 2.2 4.6-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const users = [
  { initials: "JA", name: "John Anderson", role: "Buyer", email: "john.anderson@email.com", id: "#1", status: "Active" },
  { initials: "SM", name: "Sarah Mitchell", role: "Seller", email: "sarah.mitchell@email.com", id: "#2", status: "Active" },
  { initials: "MC", name: "Michael Chen", role: "Buyer", email: "michael.chen@email.com", id: "#3", status: "Active" },
  { initials: "ER", name: "Emma Rodriguez", role: "Seller", email: "emma.rodriguez@email.com", id: "#4", status: "Suspended" },
  { initials: "DT", name: "David Thompson", role: "Buyer", email: "david.thompson@email.com", id: "#5", status: "Active" },
  { initials: "LW", name: "Lisa Wang", role: "Seller", email: "lisa.wang@email.com", id: "#6", status: "Active" },
];

export default function AdminUsersPage() {
  return (
    <div className={styles.page}>
      <div className={styles.userGrid}>
        {users.map((user) => (
          <PanelCard key={user.id} className={styles.userCard}>
            <div className={styles.userHeader}>
              <div className={styles.userIdentity}>
                <span className={styles.userAvatar}>{user.initials}</span>
                <div className={styles.userInfo}>
                  <h3>{user.name}</h3>
                  <span className={`${styles.roleMeta} ${user.role === "Buyer" ? styles.buyerMeta : styles.sellerMeta}`}>
                    <ShieldIcon />
                    <span>{user.role}</span>
                  </span>
                </div>
              </div>

              <StatusPill tone={user.status === "Active" ? "green" : "red"}>{user.status}</StatusPill>
            </div>

            <div className={styles.userDetails}>
              <div className={styles.infoRow}>
                <MailIcon />
                <span>{user.email}</span>
              </div>
              <div className={styles.infoRow}>
                <UserIcon />
                <span>User ID: {user.id}</span>
              </div>
            </div>

            <div className={styles.userActions}>
              {user.status === "Suspended" ? (
                <button type="button" className={styles.activateButton}>
                  <CheckIcon />
                  <span>Activate</span>
                </button>
              ) : (
                <button type="button" className={styles.suspendButton}>
                  <BanIcon />
                  <span>Suspend</span>
                </button>
              )}
              <button type="button" className={styles.detailsButton}>
                <EyeIcon />
                <span>Details</span>
              </button>
            </div>
          </PanelCard>
        ))}
      </div>
    </div>
  );
}
