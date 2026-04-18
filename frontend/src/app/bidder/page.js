"use client";

import Image from "next/image";
import Link from "next/link";
import { useApiData } from "@/hooks/useApiData";
import styles from "./page.module.css";

const watchlistItems = [
  {
    title: "Luxury Rolex Submariner",
    bid: "$15,000",
    time: "2h 34m",
    image: "/buyer-watch.svg",
  },
  {
    title: "Vintage Leica M3 Camera",
    bid: "$3,500",
    time: "5h 12m",
    image: "/buyer-camera.svg",
  },
  {
    title: "Diamond Necklace 18K",
    bid: "$8,900",
    time: "1h 45m",
    image: "/buyer-necklace.svg",
  },
];

const bidRows = [
  {
    product: "Luxury Rolex Submariner",
    currentBid: "$15,000",
    yourBid: "$15,000",
    status: "Winning",
    tone: "winning",
  },
  {
    product: "Classic Ferrari 250 GTO",
    currentBid: "$48,000",
    yourBid: "$45,000",
    status: "Outbid",
    tone: "outbid",
  },
  {
    product: "Diamond Necklace 18K",
    currentBid: "$8,900",
    yourBid: "$8,900",
    status: "Winning",
    tone: "winning",
  },
  {
    product: "Vintage Leica M3 Camera",
    currentBid: "$3,800",
    yourBid: "$3,500",
    status: "Outbid",
    tone: "outbid",
  },
];

const orderRows = [
  {
    product: "Vintage Leica M3 Camera",
    price: "$3,500",
    delivery: "Delivered",
    deliveryTone: "delivered",
    payment: "Paid",
    paymentTone: "paid",
  },
  {
    product: "Antique Porcelain Vase",
    price: "$1,200",
    delivery: "Shipped",
    deliveryTone: "shipped",
    payment: "Paid",
    paymentTone: "paid",
  },
  {
    product: "Limited Edition Print",
    price: "$850",
    delivery: "Processing",
    deliveryTone: "processing",
    payment: "Pending",
    paymentTone: "pending",
  },
];

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6S2.5 12 2.5 12Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20h9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3 5.5 5.7v5.6c0 4.2 2.6 7.9 6.5 9.7 3.9-1.8 6.5-5.5 6.5-9.7V5.7L12 3Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="m9.7 12.2 1.5 1.5 3.2-3.6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7.5h13a3 3 0 0 1 3 3v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-10Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M4 8V6.5A2.5 2.5 0 0 1 6.5 4H18"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M15.5 13H20"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m4 16 6-6 4 4 6-7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M15 7h5v5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 8v4.5l3 1.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 4h8v2.5A4 4 0 0 1 12 10.5 4 4 0 0 1 8 6.5V4Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M9 19h6M12 10.5V19M8 6H5.5A2.5 2.5 0 0 0 8 8.5M16 6h2.5A2.5 2.5 0 0 1 16 8.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function HammerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m14.5 4.5 5 5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="m3 21 7.2-7.2M11 4l9 9M8.7 6.3l4.9-4.9 4.9 4.9-4.9 4.9-4.9-4.9Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 3 7 4v10l-7 4-7-4V7l7-4Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="m5 7 7 4 7-4M12 11v10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.5 21 19a1.2 1.2 0 0 1-1 1.8H4a1.2 1.2 0 0 1-1-1.8L12 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M12 9v4.5M12 17.3h.01"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function StatBadge({ tone, children }) {
  return <span className={`${styles.statusBadge} ${styles[tone]}`}>{children}</span>;
}

export default function BidderDashboardPage() {
  const { data } = useApiData("/users/me/profile", {
    initialData: {
      name: "Michael Anderson",
      email: "michael@example.com",
      contact: "+1 (555) 123-4567",
      nid: "****-****-1234",
    },
  });

  const name = data?.name || "Michael Anderson";
  const email = data?.email || "michael@example.com";
  const contact = data?.contact || data?.phone || "+1 (555) 123-4567";
  const nid = data?.nid || data?.nationalId || "****-****-1234";

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>Profile</h2>

          <div className={styles.avatarCluster}>
            <div className={styles.avatarFrame}>
              <Image
                src="/buyer-avatar.svg"
                alt="Buyer avatar"
                width={108}
                height={108}
                className={styles.profileAvatar}
                priority
              />
            </div>
            <span className={styles.onlineDot} aria-label="Online now" />
          </div>

          <div className={styles.infoList}>
            <article className={styles.infoCard}>
              <span className={styles.infoIcon}>
                <EditIcon />
              </span>
              <div>
                <p>Name</p>
                <strong>{name}</strong>
              </div>
            </article>

            <article className={styles.infoCard}>
              <span className={styles.infoIcon}>
                <EyeIcon />
              </span>
              <div>
                <p>Email</p>
                <strong>{email}</strong>
              </div>
            </article>

            <article className={styles.infoCard}>
              <span className={styles.infoIcon}>
                <TrendIcon />
              </span>
              <div>
                <p>Contact</p>
                <strong>{contact}</strong>
              </div>
            </article>

            <article className={styles.infoCard}>
              <span className={styles.infoIcon}>
                <WalletIcon />
              </span>
              <div>
                <p>NID</p>
                <strong>{nid}</strong>
              </div>
            </article>
          </div>

          <div className={styles.profileActions}>
            <Link href="/bidder/profile" className={styles.primaryButton}>
              <EditIcon />
              <span>Edit Profile</span>
            </Link>
            <Link href="/bidder/settings" className={styles.secondaryButton}>
              <ShieldIcon />
              <span>Verify</span>
            </Link>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <h2 className={styles.sectionTitle}>Wallet</h2>
            <span className={styles.headingIcon}>
              <WalletIcon />
            </span>
          </div>

          <article className={`${styles.balanceCard} ${styles.balanceCardActive}`}>
            <div className={styles.balanceTop}>
              <p>Available Balance</p>
              <WalletIcon />
            </div>
            <strong>$200.00</strong>
          </article>

          <article className={styles.balanceCard}>
            <div className={styles.balanceTop}>
              <p>Locked in Bids</p>
              <ClockIcon />
            </div>
            <strong>$50.00</strong>
          </article>

          <Link href="/bidder/wallet" className={styles.addMoneyButton}>
            <span>+</span>
            <span>Add Money</span>
          </Link>
        </section>
      </aside>

      <section className={styles.main}>
        <section className={`${styles.panel} ${styles.spaciousPanel}`}>
          <div className={styles.panelHeading}>
            <h2 className={styles.sectionTitle}>Watchlist</h2>
            <span className={styles.headingIcon}>
              <EyeIcon />
            </span>
          </div>

          <div className={styles.watchlist}>
            {watchlistItems.map((item) => (
              <article key={item.title} className={styles.watchCard}>
                <div className={styles.watchMeta}>
                  <div className={styles.productArt}>
                    <Image src={item.image} alt={item.title} width={100} height={100} />
                  </div>

                  <div>
                    <h3>{item.title}</h3>
                    <div className={styles.watchDetails}>
                      <span className={styles.bidValue}>
                        <TrendIcon />
                        <span>
                          Current Bid: <strong>{item.bid}</strong>
                        </span>
                      </span>
                      <span className={styles.timeValue}>
                        <ClockIcon />
                        <span>{item.time}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <Link href="/bidder/watchlist" className={styles.viewButton}>
                  <EyeIcon />
                  <span>View</span>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.panel} ${styles.spaciousPanel}`}>
          <div className={styles.panelHeading}>
            <h2 className={styles.sectionTitle}>My Bids</h2>
            <span className={styles.headingIcon}>
              <HammerIcon />
            </span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Bid</th>
                  <th>Your Bid</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bidRows.map((row) => (
                  <tr key={row.product}>
                    <td>{row.product}</td>
                    <td className={styles.mutedCell}>{row.currentBid}</td>
                    <td className={styles.highlightCell}>{row.yourBid}</td>
                    <td>
                      <StatBadge tone={row.tone}>
                        {row.tone === "winning" ? <TrophyIcon /> : <ClockIcon />}
                        <span>{row.status}</span>
                      </StatBadge>
                    </td>
                    <td>
                      <Link href="/bidder/my-bids" className={styles.tableButton}>
                        <EyeIcon />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.spaciousPanel}`}>
          <div className={styles.panelHeading}>
            <h2 className={styles.sectionTitle}>Orders</h2>
            <span className={styles.headingIcon}>
              <CubeIcon />
            </span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Delivery Status</th>
                  <th>Payment Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orderRows.map((row) => (
                  <tr key={row.product}>
                    <td>{row.product}</td>
                    <td className={styles.highlightCell}>{row.price}</td>
                    <td>
                      <StatBadge tone={row.deliveryTone}>{row.delivery}</StatBadge>
                    </td>
                    <td>
                      <StatBadge tone={row.paymentTone}>{row.payment}</StatBadge>
                    </td>
                    <td>
                      <Link href="/bidder/wins" className={styles.tableButton}>
                        <EyeIcon />
                        <span>View Details</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.disputesPanel}`}>
          <div className={styles.disputesHeader}>
            <div className={styles.disputesCopy}>
              <span className={styles.alertBadge}>
                <AlertIcon />
              </span>
              <div>
                <h2 className={styles.sectionTitle}>Disputes</h2>
                <p>Manage your transaction disputes and resolutions</p>
              </div>
            </div>

            <Link href="/support" className={styles.primaryButton}>
              <span>View Disputes</span>
            </Link>
          </div>

          <div className={styles.successStrip}>
            <span className={styles.successDot} />
            <span>No active disputes</span>
          </div>
        </section>
      </section>
    </div>
  );
}
