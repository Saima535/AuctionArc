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
  const [reasonUserId, setReasonUserId] = useState("");
  const [suspensionReason, setSuspensionReason] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

  async function handleDeleteUser(user) {
    if (!user?.userId) {
      return;
    }

    setBusyUserId(user.userId);
    setPageError("");
    setPageMessage("");

    try {
      await apiRequest(`/admin/users/${user.userId}`, {
        method: "DELETE",
      });

      setData((current) => current.filter((item) => item.userId !== user.userId));
      setExpandedUserId((current) => (current === user.userId ? "" : current));
      setReasonUserId((current) => (current === user.userId ? "" : current));
      setSuspensionReason("");
      setPageMessage(`${user.name} was deleted completely.`);
    } catch (requestError) {
      setPageError(requestError.message || "Could not delete the user.");
    } finally {
      setBusyUserId("");
    }
  }

  async function handleStatusToggle(user, reason = "") {
    const nextStatus = user.status === "Active" ? "Suspended" : "Active";
    const trimmedReason = reason.trim();

    if (nextStatus === "Suspended" && !trimmedReason) {
      setReasonUserId(user.userId);
      setPageError("A suspension reason is required before suspending a user.");
      return;
    }

    setBusyUserId(user.userId);
    setPageError("");
    setPageMessage("");

    try {
      const result = await apiRequest(`/admin/users/${user.userId}/status`, {
        method: "PATCH",
        body: {
          status: nextStatus,
          ...(trimmedReason ? { reason: trimmedReason } : {}),
        },
      });

      setData((current) =>
        current.map((item) => (item.userId === user.userId ? result.data : item)),
      );
      setReasonUserId("");
      setSuspensionReason("");
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
                {user.profilePicture?.url ? (
                  <span
                    className={`${styles.userAvatar} ${styles.userAvatarImage}`.trim()}
                    style={{ backgroundImage: `url(${user.profilePicture.url})` }}
                    aria-label={`${user.name} profile`}
                  />
                ) : (
                  <span className={styles.userAvatar}>{initialsForName(user.name)}</span>
                )}
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
              <div className={styles.helperBlock}>
                <p className={styles.helperText}>
                  Country: {user.country} | Joined: {user.joined} | Last seen: {user.lastSeen}
                </p>
                {user.suspensionReason ? (
                  <p className={styles.helperText}>
                    Suspension reason: {user.suspensionReason}
                  </p>
                ) : null}
                {user.status === "Suspended" ? (
                  <p className={styles.helperText}>
                    Suspended accounts are deleted automatically after 7 days if they remain suspended.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className={styles.userActions}>
              {user.status === "Suspended" ? (
                <button
                  type="button"
                  className={styles.activateButton}
                  disabled={busyUserId === user.userId}
                  onClick={() => handleStatusToggle(user)}
                >
                  <span>{busyUserId === user.userId ? "Updating..." : "Activate"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.suspendButton}
                  disabled={busyUserId === user.userId}
                  onClick={() => {
                    setPageError("");
                    setReasonUserId((current) => (current === user.userId ? "" : user.userId));
                    setSuspensionReason("");
                  }}
                >
                  <span>Suspend</span>
                </button>
              )}
              <button
                type="button"
                className={styles.detailsButton}
                onClick={() => setExpandedUserId((current) => (current === user.userId ? "" : user.userId))}
              >
                <span>{expandedUserId === user.userId ? "Hide" : "Details"}</span>
              </button>
              <button
                type="button"
                className={`${styles.suspendButton} ${styles.fullWidthAction}`.trim()}
                disabled={busyUserId === user.userId}
                onClick={() => handleDeleteUser(user)}
              >
                <span>{busyUserId === user.userId ? "Deleting..." : "Delete"}</span>
              </button>
            </div>

            {user.status !== "Suspended" && reasonUserId === user.userId ? (
              <div className={styles.suspensionComposer}>
                <label className={styles.composerLabel} htmlFor={`suspension-reason-${user.userId}`}>
                  Suspension reason
                </label>
                <textarea
                  id={`suspension-reason-${user.userId}`}
                  className={styles.composerTextarea}
                  value={suspensionReason}
                  onChange={(event) => setSuspensionReason(event.target.value)}
                  placeholder="Explain why this account is being suspended."
                />
                <div className={styles.composerActions}>
                  <button
                    type="button"
                    className={styles.suspendButton}
                    disabled={busyUserId === user.userId}
                    onClick={() => handleStatusToggle(user, suspensionReason)}
                  >
                    <span>{busyUserId === user.userId ? "Updating..." : "Confirm suspend"}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.detailsButton}
                    onClick={() => {
                      setReasonUserId("");
                      setSuspensionReason("");
                      setPageError("");
                    }}
                  >
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : null}
          </PanelCard>
        ))}
      </div>
    </div>
  );
}
