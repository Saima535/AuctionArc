"use client";

import { useState } from "react";
import styles from "@/components/admin-custom/AdminCustom.module.css";
import { PanelCard, StatusPill } from "@/components/admin-custom/AdminUi";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";

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

function toneForStatus(status) {
  return status === "Active" ? "green" : "red";
}

function initialsForName(name) {
  return String(name || "AA")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function AdminUsersPage() {
  const { data, setData, error } = useApiData("/admin/users", {
    initialData: [],
  });
  const [expandedUserId, setExpandedUserId] = useState("");
  const [busyUserId, setBusyUserId] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

  async function handleStatusToggle(user) {
    const nextStatus = user.status === "Active" ? "Suspended" : "Active";

    setBusyUserId(user.userId);
    setPageError("");
    setPageMessage("");

    try {
      const result = await apiRequest(`/admin/users/${user.userId}/status`, {
        method: "PATCH",
        body: { status: nextStatus },
      });

      setData((current) =>
        current.map((item) => (item.userId === user.userId ? result.data : item)),
      );
      setPageMessage(`${user.name} is now ${nextStatus.toLowerCase()}.`);
    } catch (requestError) {
      setPageError(requestError.message || "Could not update the user status.");
    } finally {
      setBusyUserId("");
    }
  }

  return (
    <div className={styles.page}>
      {error ? <p className={styles.inlineNotice}>{error}</p> : null}
      {pageError ? <p className={styles.inlineNotice}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successNotice}>{pageMessage}</p> : null}

      <div className={styles.userGrid}>
        {data.map((user) => (
          <PanelCard key={user.userId} className={styles.userCard}>
            <div className={styles.userHeader}>
              <div className={styles.userIdentity}>
                <span className={styles.userAvatar}>{initialsForName(user.name)}</span>
                <div className={styles.userInfo}>
                  <h3>{user.name}</h3>
                  <span className={`${styles.roleMeta} ${user.role === "Bidder" ? styles.buyerMeta : styles.sellerMeta}`}>
                    <ShieldIcon />
                    <span>{user.role === "Bidder" ? "Buyer" : user.role}</span>
                  </span>
                </div>
              </div>

              <StatusPill tone={toneForStatus(user.status)}>{user.status}</StatusPill>
            </div>

            <div className={styles.userDetails}>
              <div className={styles.infoRow}>
                <MailIcon />
                <span>{user.contact}</span>
              </div>
              <div className={styles.infoRow}>
                <UserIcon />
                <span>User ID: {user.id}</span>
              </div>
            </div>

            {expandedUserId === user.userId ? (
              <p className={styles.helperText}>
                Country: {user.country} | Joined: {user.joined} | Last seen: {user.lastSeen}
              </p>
            ) : null}

            <div className={styles.userActions}>
              {user.status === "Suspended" ? (
                <button
                  type="button"
                  className={styles.activateButton}
                  disabled={busyUserId === user.userId}
                  onClick={() => handleStatusToggle(user)}
                >
                  <CheckIcon />
                  <span>{busyUserId === user.userId ? "Updating..." : "Activate"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.suspendButton}
                  disabled={busyUserId === user.userId}
                  onClick={() => handleStatusToggle(user)}
                >
                  <BanIcon />
                  <span>{busyUserId === user.userId ? "Updating..." : "Suspend"}</span>
                </button>
              )}
              <button
                type="button"
                className={styles.detailsButton}
                onClick={() => setExpandedUserId((current) => (current === user.userId ? "" : user.userId))}
              >
                <EyeIcon />
                <span>{expandedUserId === user.userId ? "Hide" : "Details"}</span>
              </button>
            </div>
          </PanelCard>
        ))}
      </div>
    </div>
  );
}
