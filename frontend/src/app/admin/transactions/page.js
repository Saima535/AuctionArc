"use client";

import { useState } from "react";
import styles from "@/components/admin-custom/AdminCustom.module.css";
import { PanelCard, StatusPill } from "@/components/admin-custom/AdminUi";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";

function DollarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v18M16 7.5c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.5 2.6 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 16 6-6 4 4 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7h5v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 7 4v10l-7 4-7-4V7l7-4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m5 7 7 4 7-4M12 11v10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function parseCurrency(value) {
  return Number(String(value || "0").replace(/[^0-9.-]/g, "")) || 0;
}

function toneForStatus(status) {
  return /completed|paid/i.test(status)
    ? "green"
    : /pending payout|pending|hold|review|escrow/i.test(status)
      ? "gold"
      : "red";
}

export default function AdminTransactionsPage() {
  const { data, setData, error } = useApiData("/admin/transactions", {
    initialData: [],
  });
  const [busyTransactionId, setBusyTransactionId] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

  const totalValue = data.reduce((sum, item) => sum + parseCurrency(item.grossAmount || item.amount), 0);
  const completedCount = data.filter((item) => /success|complete|paid/i.test(item.paymentStatus)).length;
  const pendingPayoutCount = data.filter((item) => /pending/i.test(item.payoutStatus)).length;

  const summary = [
    { value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(totalValue), label: "Total Transaction Value", icon: <DollarIcon />, iconClass: styles.goldIcon, cardClass: styles.yellowLine },
    { value: String(completedCount), label: "Completed Payment Records", icon: <CheckIcon />, iconClass: styles.greenIcon, cardClass: styles.greenLine },
    { value: String(pendingPayoutCount), label: "Seller Payouts Pending", icon: <TrendIcon />, iconClass: styles.goldIcon, cardClass: styles.yellowLine },
  ];

  async function handleDeleteTransaction(row) {
    if (!row?.transactionId) {
      return;
    }

    setBusyTransactionId(row.transactionId);
    setPageError("");
    setPageMessage("");

    try {
      await apiRequest(`/admin/transactions/${row.transactionId}`, {
        method: "DELETE",
      });
      setData((current) => current.filter((item) => item.transactionId !== row.transactionId));
      setPageMessage(`${row.id} deleted successfully.`);
    } catch (requestError) {
      setPageError(requestError.message || "Could not delete the transaction.");
    } finally {
      setBusyTransactionId("");
    }
  }

  return (
    <div className={styles.page}>
      {error ? <p className={styles.inlineNotice}>{error}</p> : null}
      {pageError ? <p className={styles.inlineNotice}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successNotice}>{pageMessage}</p> : null}

      <div className={styles.transactionSummaryGrid}>
        {summary.map((item) => (
          <PanelCard key={item.label} className={`${styles.summaryCard} ${item.cardClass}`}>
            <div className={styles.summaryTop}>
              <span className={`${styles.summaryIcon} ${item.iconClass}`}>{item.icon}</span>
              <strong className={styles.summaryValue}>{item.value}</strong>
            </div>
            <p className={styles.summaryLabel}>{item.label}</p>
          </PanelCard>
        ))}
      </div>

      <section className={styles.statsTableWrap}>
        <table className={styles.statsTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Buyer</th>
              <th>Seller</th>
              <th>Type</th>
              <th>Gross Amount</th>
              <th>Commission</th>
              <th>Seller Payout</th>
              <th>Payment Status</th>
              <th>Payout Status</th>
              <th>Channel</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {!data.length ? (
              <tr>
                <td colSpan={13}>No transactions found.</td>
              </tr>
            ) : null}
            {data.map((row) => (
              <tr key={row.transactionId || `${row.id}-${row.date}`}>
                <td>{row.id}</td>
                <td>
                  <div className={styles.listItemWrap}>
                    <span className={styles.listIcon}>
                      <BoxIcon />
                    </span>
                    <span className={styles.itemName}>{row.product}</span>
                  </div>
                </td>
                <td>{row.buyer}</td>
                <td>{row.seller}</td>
                <td>{row.type}</td>
                <td className={styles.moneyText}>{row.grossAmount || row.amount}</td>
                <td className={styles.moneyText}>{row.commission}</td>
                <td className={styles.moneyText}>{row.payoutAmount}</td>
                <td>
                  <StatusPill tone={toneForStatus(row.paymentStatus)}>
                    {row.paymentStatus}
                  </StatusPill>
                </td>
                <td>
                  <StatusPill tone={/not applicable/i.test(row.payoutStatus) ? "gold" : toneForStatus(row.payoutStatus)}>
                    {row.payoutStatus}
                  </StatusPill>
                </td>
                <td>{row.channel}</td>
                <td>{row.date}</td>
                <td>
                  <button
                    type="button"
                    className={styles.detailsButton}
                    disabled={busyTransactionId === row.transactionId}
                    onClick={() => handleDeleteTransaction(row)}
                  >
                    {busyTransactionId === row.transactionId ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
