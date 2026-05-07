"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  DataTable,
  Panel,
  SectionIntro,
  StatCard,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import styles from "@/components/member/MemberDashboard.module.css";

const transactionColumns = [
  { key: "id", label: "Transaction ID" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "amount", label: "Amount" },
  { key: "channel", label: "Channel" },
];

export default function BidderWalletPage() {
  const searchParams = useSearchParams();
  const { data, error } = useApiData("/dashboard/wallet", {
    initialData: { stats: [], transactions: [] },
  });
  const [amount, setAmount] = useState("100");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [pageError, setPageError] = useState("");

  async function handleTopUp(event) {
    event.preventDefault();
    setPageError("");
    setIsCreatingSession(true);

    try {
      const result = await apiRequest("/payments/checkout-session", {
        method: "POST",
        body: { amount: Number(amount) },
      });

      if (result.data?.url) {
        window.location.href = result.data.url;
        return;
      }

      setPageError("The payment session could not be started.");
    } catch (requestError) {
      setPageError(requestError.message || "Could not start the payment flow.");
    } finally {
      setIsCreatingSession(false);
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Wallet"
        description="Monitor available balance, bid holds, refunds, and recent payment activity."
      />

      {error ? <p>{error}</p> : null}
      {searchParams.get("status") === "success" ? <p className={styles.successText}>Payment completed. Your wallet will refresh once the confirmation is processed.</p> : null}
      {searchParams.get("status") === "cancelled" ? <p className={styles.inlineNotice}>Payment was cancelled before completion.</p> : null}
      {pageError ? <p className={styles.errorText}>{pageError}</p> : null}

      <section className={styles.statGrid}>
        {data.stats.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className={styles.secondaryGrid}>
        <Panel title="Recent transactions" description="Latest wallet, hold, and payment activity.">
          <DataTable columns={transactionColumns} rows={data.transactions} />
        </Panel>

        <Panel title="Add funds" description="Top up your buyer wallet before entering competitive auctions.">
          <form onSubmit={handleTopUp}>
            <div className={styles.quickAmountRow}>
              {["50", "100", "250", "500"].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={amount === value ? styles.actionButton : styles.secondaryAction}
                  onClick={() => setAmount(value)}
                >
                  ${value}
                </button>
              ))}
            </div>
            <div className={styles.inlineForm}>
              <input
                className={styles.amountInput}
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
              <button type="submit" className={styles.actionButton} disabled={isCreatingSession}>
                {isCreatingSession ? "Redirecting..." : "Pay with Card"}
              </button>
            </div>
          </form>
        </Panel>
      </section>
    </div>
  );
}
