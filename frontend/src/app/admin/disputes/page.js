"use client";

import { useState } from "react";
import styles from "@/components/admin-custom/AdminCustom.module.css";
import { PanelCard, StatusPill } from "@/components/admin-custom/AdminUi";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 7 4v10l-7 4-7-4V7l7-4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m5 7 7 4 7-4M12 11v10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5 21 19a1.2 1.2 0 0 1-1 1.8H4a1.2 1.2 0 0 1-1-1.8L12 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 9v4.5M12 17.3h.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ResolveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8.8 12.2 2.1 2.1 4.8-5.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function toneForSeverity(severity) {
  const value = String(severity || "").toLowerCase();
  if (value.includes("high") || value.includes("critical")) {
    return "red";
  }
  if (value.includes("medium")) {
    return "orange";
  }
  return "gold";
}

function toneForStatus(status) {
  return /resolved|closed/i.test(status) ? "green" : "red";
}

export default function AdminDisputesPage() {
  const { data, setData, error } = useApiData("/admin/reports", {
    initialData: [],
  });
  const [busyReportId, setBusyReportId] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

  async function handleResolve(report) {
    setBusyReportId(report.reportId);
    setPageError("");
    setPageMessage("");

    try {
      const result = await apiRequest(`/admin/reports/${report.reportId}/status`, {
        method: "PATCH",
        body: { status: "Resolved" },
      });

      setData((current) =>
        current.map((item) => (item.reportId === report.reportId ? result.data : item)),
      );
      setPageMessage(`${report.id} marked as resolved.`);
    } catch (requestError) {
      setPageError(requestError.message || "Could not resolve the dispute.");
    } finally {
      setBusyReportId("");
    }
  }

  return (
    <div className={styles.page}>
      {error ? <p className={styles.inlineNotice}>{error}</p> : null}
      {pageError ? <p className={styles.inlineNotice}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successNotice}>{pageMessage}</p> : null}

      <div className={styles.disputesGrid}>
        {data.map((item) => (
          <PanelCard key={item.reportId} className={styles.disputeCard}>
            <div className={styles.disputeHeader}>
              <div className={styles.disputeIdentity}>
                <span className={styles.listIcon}>
                  <BoxIcon />
                </span>
                <div className={styles.disputeInfo}>
                  <h3>{item.target}</h3>
                  <p className={styles.disputeMeta}>Dispute ID: {item.id}</p>
                </div>
              </div>

              <StatusPill tone={toneForStatus(item.status)}>{item.status}</StatusPill>
            </div>

            <div className={styles.disputeReason}>
              <StatusPill tone={toneForSeverity(item.severity)}>
                <AlertIcon />
                <span style={{ marginLeft: 10 }}>{item.reason}</span>
              </StatusPill>
            </div>

            <div className={styles.disputeRows}>
              <span className={styles.labelCell}>Severity:</span>
              <span className={styles.valueCell}>{item.severity}</span>

              <span className={styles.labelCell}>Owner:</span>
              <span className={styles.valueCell}>{item.owner}</span>

              <span className={styles.labelCell}>Target:</span>
              <span className={styles.valueCell}>{item.target}</span>

              <span className={styles.labelCell}>Date:</span>
              <span className={styles.valueCell} style={{ fontWeight: 500 }}>{item.date}</span>
            </div>

            <button
              type="button"
              className={styles.disputeAction}
              disabled={busyReportId === item.reportId || /resolved|closed/i.test(item.status)}
              onClick={() => handleResolve(item)}
            >
              <ResolveIcon />
              <span>
                {busyReportId === item.reportId
                  ? "Resolving..."
                  : /resolved|closed/i.test(item.status)
                    ? "Resolved"
                    : "Resolve Dispute"}
              </span>
            </button>
          </PanelCard>
        ))}
      </div>
    </div>
  );
}
