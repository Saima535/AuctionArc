"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ApiEmptyState, ApiErrorNotice, ApiLoadingNotice } from "@/components/feedback/ApiFeedback";
import { useApiData } from "@/hooks/useApiData";
import {
  ClockIcon,
  DollarIcon,
  EyeIcon,
  HeartIcon,
  MessageIcon,
  SparklesIcon,
  TrendIcon,
} from "@/components/seller/SellerIcons";
import styles from "./page.module.css";

const statIcons = [<TrendIcon key="trend" />, <HeartIcon key="heart" />, <SparklesIcon key="sparkles" />, <DollarIcon key="dollar" />];

function toneClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("outbid")) {
    return styles.outbid;
  }

  if (normalized.includes("won") || normalized.includes("top") || normalized.includes("active")) {
    return styles.winning;
  }

  if (normalized.includes("paid") || normalized.includes("completed")) {
    return styles.paid;
  }

  return styles.pending;
}

export default function BidderDashboardPage() {
  const { data, isLoading, error } = useApiData("/dashboard/bidder", {
    initialData: {
      kpis: [],
      activity: [],
      watchlist: [],
      messages: [],
    },
  });

  const stats = useMemo(
    () =>
      data.kpis.map((item, index) => ({
        ...item,
        icon: statIcons[index] || <TrendIcon />,
      })),
    [data.kpis],
  );

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <h2 className={styles.sectionTitle}>Buyer Hub</h2>
            <span className={styles.headingIcon}>
              <SparklesIcon />
            </span>
          </div>

          <div className={styles.infoList}>
            {stats.map((item) => (
              <article key={item.label} className={styles.infoCard}>
                <span className={styles.infoIcon}>{item.icon}</span>
                <div>
                  <p>{item.label}</p>
                  <strong>{item.value}</strong>
                </div>
              </article>
            ))}
          </div>

          {!stats.length && isLoading ? (
            <ApiLoadingNotice
              title="Loading buyer snapshot"
              message="We are gathering your bidding activity, watchlist status, and recent marketplace activity."
            />
          ) : null}
          {error ? <ApiErrorNotice title="Buyer dashboard unavailable" message={error} /> : null}

          <div className={styles.profileActions}>
            <Link href="/bidder/auctions" className={styles.primaryButton}>
              Browse Auctions
            </Link>
            <Link href="/bidder/wins" className={styles.secondaryButton}>
              Wins
            </Link>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <span className={styles.headingIcon}>
              <ClockIcon />
            </span>
          </div>

          <div className={styles.infoList}>
            {!data.activity.length && !isLoading ? (
              <ApiEmptyState
                title="No bid activity yet"
                message="Place a bid or follow an auction to start building your recent activity timeline."
              />
            ) : null}
            {data.activity.map((item) => (
              <article key={`${item.title}-${item.meta}`} className={styles.infoCard}>
                <span className={styles.infoIcon}>
                  <EyeIcon />
                </span>
                <div>
                  <p>{item.title}</p>
                  <strong>{item.meta}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      </aside>

      <main className={styles.main}>
        <section className={`${styles.panel} ${styles.spaciousPanel}`}>
          <div className={styles.disputesHeader}>
            <div className={styles.disputesCopy}>
              <span className={styles.alertBadge}>
                <HeartIcon />
              </span>
              <div>
                <h1 className={styles.sectionTitle}>Your Bidding Dashboard</h1>
                <p>Track watched auctions, active bid movement, seller messages, and winning order progress.</p>
              </div>
            </div>
            <Link href="/bidder/my-bids" className={styles.viewButton}>
              View Bids
            </Link>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.spaciousPanel}`}>
          <div className={styles.panelHeading}>
            <h2 className={styles.sectionTitle}>Watchlist</h2>
            <Link href="/bidder/watchlist" className={styles.tableButton}>
              Manage
            </Link>
          </div>

          <div className={styles.watchlist}>
            {!data.watchlist.length && !isLoading ? (
              <ApiEmptyState
                title="No watched auctions yet"
                message="Save auctions to your watchlist so you can compare sellers, prices, and closing times here."
              />
            ) : null}
            {data.watchlist.map((item) => (
              <article key={item.auctionId || item.id} className={styles.watchCard}>
                <div className={styles.watchMeta}>
                  <div className={styles.productArt}>
                    <span className={styles.alertBadge}>
                      <HeartIcon />
                    </span>
                  </div>
                  <div>
                    <h3>{item.title || "Untitled auction"}</h3>
                    <div className={styles.watchDetails}>
                      <span className={styles.bidValue}>
                        <DollarIcon />
                        <strong>{item.currentBid || "--"}</strong>
                      </span>
                      <span className={styles.timeValue}>
                        <ClockIcon />
                        {item.seller || "AuctionArc seller"}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`${styles.statusBadge} ${toneClass(item.status)}`}>{item.status || "Watching"}</span>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.panel} ${styles.spaciousPanel}`}>
          <div className={styles.panelHeading}>
            <h2 className={styles.sectionTitle}>Messages</h2>
            <Link href="/bidder/messages" className={styles.tableButton}>
              Open Inbox
            </Link>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Latest message</th>
                </tr>
              </thead>
              <tbody>
                {!data.messages.length ? (
                  <tr>
                    <td className={styles.mutedCell} colSpan="2">
                      No recent conversations.
                    </td>
                  </tr>
                ) : null}
                {data.messages.map((message) => (
                  <tr key={`${message.title}-${message.meta}`}>
                    <td>
                      <span className={styles.bidValue}>
                        <MessageIcon />
                        {message.title}
                      </span>
                    </td>
                    <td className={styles.mutedCell}>{message.meta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
