"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DataTable,
  Panel,
  SectionIntro,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import { apiRequest } from "@/lib/api";
import styles from "@/components/member/MemberDashboard.module.css";

export default function BidderWinsPage() {
  const router = useRouter();
  const { data, error } = useApiData("/dashboard/bidder/wins", {
    initialData: [],
  });
  const [activeWinId, setActiveWinId] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [pageError, setPageError] = useState("");

  async function handleMessageSeller(row) {
    setPageError("");
    setPageMessage("");
    setActiveWinId(row.id);

    try {
      await apiRequest("/messages", {
        method: "POST",
        body: {
          recipientId: row.sellerId,
          listingId: row.listingId,
          auctionId: row.auctionId,
          subject: `${row.item} order follow-up`,
          body: `Hi, I am reaching out about my order for ${row.item}. Could you share the latest delivery or payment update?`,
        },
      });

      router.push("/bidder/messages");
    } catch (requestError) {
      setPageError(requestError.message || "Could not start the conversation.");
    } finally {
      setActiveWinId("");
    }
  }

  const winColumns = [
  { key: "id", label: "Win ID" },
  { key: "item", label: "Item" },
  { key: "seller", label: "Seller" },
  { key: "amount", label: "Amount" },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <StatusBadge tone={value === "Delivered" || value === "Paid" ? "good" : "warn"}>
        {value}
      </StatusBadge>
    ),
  },
  {
    key: "actions",
    label: "Actions",
    render: (_, row) => (
      <button
        type="button"
        className={styles.secondaryAction}
        disabled={activeWinId === row.id || !row.sellerId}
        onClick={() => handleMessageSeller(row)}
      >
        Message Seller
      </button>
    ),
  },
];

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Wins"
        description="Review auctions you have won, payment status, and fulfillment progress."
      />

      {pageError ? <p className={styles.errorText}>{pageError}</p> : null}
      {pageMessage ? <p className={styles.successText}>{pageMessage}</p> : null}

      <Panel title="Won auctions" description="Commercial follow-through after successful bidding.">
        {error ? <p>{error}</p> : <DataTable columns={winColumns} rows={data} />}
      </Panel>
    </div>
  );
}
