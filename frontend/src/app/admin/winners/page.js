"use client";

import Link from "next/link";
import styles from "@/components/admin-custom/AdminCustom.module.css";
import { PanelCard, StatusPill } from "@/components/admin-custom/AdminUi";
import { useApiData } from "@/hooks/useApiData";

function toneForStatus(status) {
  return /complete|delivered/i.test(status) ? "green" : /payment pending|paid|shipment/i.test(status) ? "gold" : "red";
}

export default function AdminWinnersPage() {
  const { data, error } = useApiData("/admin/winners", {
    initialData: [],
  });

  return (
    <div className={styles.page}>
      <div>
        <h2>Auction Winners</h2>
        <p className={styles.helperText}>Winning buyers, products, final values, payment progress, and fulfillment state.</p>
      </div>

      {error ? <p className={styles.inlineNotice}>{error}</p> : null}

      <section className={styles.statsTableWrap}>
        <table className={styles.statsTable}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Product</th>
              <th>Winning buyer</th>
              <th>Seller</th>
              <th>Final amount</th>
              <th>Commission</th>
              <th>Seller payout</th>
              <th>Status</th>
              <th>Closed</th>
            </tr>
          </thead>
          <tbody>
            {!data.length ? (
              <tr>
                <td colSpan={9}>No winning buyer records found.</td>
              </tr>
            ) : null}
            {data.map((row) => (
              <tr key={row.orderId}>
                <td>{row.id}</td>
                <td>
                  <div className={styles.listItemWrap}>
                    <span className={styles.itemName}>{row.product}</span>
                    <span>{row.productCode}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.listItemWrap}>
                    <span className={styles.itemName}>{row.bidder}</span>
                    <span>{row.bidderEmail}</span>
                  </div>
                </td>
                <td>{row.seller}</td>
                <td className={styles.moneyText}>{row.amount}</td>
                <td>{row.commission}</td>
                <td>{row.escrow}</td>
                <td><StatusPill tone={toneForStatus(row.status)}>{row.status}</StatusPill></td>
                <td>{row.closedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <PanelCard className={styles.userCard}>
        <h3>Winner actions</h3>
        <p className={styles.helperText}>Use orders and transactions to follow payment confirmation, shipping, and delivery progress for winners.</p>
        <div className={styles.userActions}>
          <Link href="/admin/transactions/sold" className={styles.activateButton}>Sold transactions</Link>
          <Link href="/admin/transactions" className={styles.detailsButton}>All transactions</Link>
        </div>
      </PanelCard>
    </div>
  );
}
