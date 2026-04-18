"use client";

import Image from "next/image";
import Link from "next/link";
import shared from "@/components/seller/SellerShared.module.css";
import {
  BoxIcon,
  CloseIcon,
  ClockIcon,
  CurrencyIcon,
  DollarIcon,
  EyeIcon,
  HeartIcon,
  MessageIcon,
  PlusIcon,
  SparklesIcon,
  StarIcon,
  TrendIcon,
  UsersIcon,
} from "@/components/seller/SellerIcons";

const stats = [
  { value: "12", label: "Active Listings", icon: <BoxIcon /> },
  { value: "$24,580", label: "Total Sales", icon: <DollarIcon /> },
  { value: "8", label: "Pending Orders", icon: <ClockIcon /> },
  { value: "+23%", label: "Revenue", icon: <TrendIcon /> },
];

const miniStats = [
  { value: "12,546", label: "Total Views", delta: "+12.5%", icon: <EyeIcon /> },
  { value: "156", label: "Watchers", delta: "+8.2%", icon: <UsersIcon /> },
  { value: "89", label: "Favorites", delta: "+15.3%", icon: <HeartIcon /> },
  { value: "23.4%", label: "Conversion", delta: "+4.1%", icon: <TrendIcon /> },
];

const activityItems = [
  {
    icon: <CurrencyIcon />,
    iconClass: shared.activityGreen,
    title: 'New bid of $2,500 on MacBook Pro 16" M3',
    time: "5 minutes ago",
  },
  {
    icon: <MessageIcon />,
    iconClass: shared.activityBlue,
    title: "New message from Sarah Johnson",
    time: "12 minutes ago",
  },
  {
    icon: <EyeIcon />,
    iconClass: shared.activityAmber,
    title: "Vintage Leica M6 Camera viewed 15 times",
    time: "1 hour ago",
  },
  {
    icon: <StarIcon />,
    iconClass: shared.activityAmber,
    title: "You received a 5-star review",
    time: "2 hours ago",
  },
];

const activeProducts = [
  {
    title: 'MacBook Pro 16" M3',
    description: "Powerful laptop with M3 chip, 32GB RAM, 1TB SSD",
    price: "$2,400",
    time: "2 Hours",
    endTime: "Apr 17, 2026 8:00 PM",
    delivery: "AuctionArc Delivery",
    views: "156",
    rating: "4.8",
    image: "/seller-laptop.svg",
  },
  {
    title: "Vintage Leica M6 Camera",
    description: "Classic film camera in excellent condition with 50mm lens",
    price: "$1,850",
    time: "1 Day",
    endTime: "Apr 18, 2026 3:00 PM",
    delivery: "Seller Delivery",
    views: "89",
    rating: "4.9",
    image: "/seller-camera.svg",
  },
];

const salesHistory = [
  {
    title: "iPhone 15 Pro Max",
    price: "$1,200",
    rating: "4.9",
    image: "/seller-phone.svg",
  },
  {
    title: "Carbon Road Bike",
    price: "$2,850",
    rating: "5",
    image: "/seller-bike.svg",
  },
];

export default function SellerDashboardPage() {
  return (
    <div className={shared.page}>
      <section className={`${shared.panel} ${shared.heroPanel}`}>
        <div className={shared.heroRow}>
          <div className={shared.heroLeft}>
            <span className={shared.heroBadge}>
              <SparklesIcon />
            </span>
            <div className={shared.heroText}>
              <h2>Welcome back, John! 👋</h2>
              <p>
                You have 2 new bids and 3 new messages waiting for you. Your active
                listings are performing well!
              </p>
              <div className={shared.heroActions}>
                <Link href="/seller/messages" className={shared.primaryCta}>
                  View Messages
                </Link>
                <Link href="/seller/listings/new" className={shared.secondaryCta}>
                  Create Listing
                </Link>
              </div>
            </div>
          </div>

          <button type="button" className={shared.closeButton} aria-label="Dismiss welcome">
            <CloseIcon />
          </button>
        </div>
      </section>

      <section>
        <div className={shared.sectionHeader}>
          <div>
            <h1>Seller Dashboard</h1>
            <p>Manage your auctions and track your performance</p>
          </div>
        </div>
      </section>

      <section className={shared.statGrid}>
        {stats.map((item) => (
          <article key={item.label} className={`${shared.panel} ${shared.statCard}`}>
            <div className={shared.statTop}>
              <span className={shared.statIcon}>{item.icon}</span>
            </div>
            <strong>{item.value}</strong>
            <p>{item.label}</p>
          </article>
        ))}
      </section>

      <section className={shared.dashboardGrid}>
        <div className={shared.page}>
          <div className={shared.miniStats}>
            {miniStats.map((item) => (
              <article key={item.label} className={`${shared.panel} ${shared.miniStatCard}`}>
                <div className={shared.miniStatTop}>
                  <span className={shared.miniStatIcon}>{item.icon}</span>
                  <span className={shared.statDelta}>{item.delta}</span>
                </div>
                <div className={shared.miniStatValue}>{item.value}</div>
                <p>{item.label}</p>
              </article>
            ))}
          </div>

          <section className={shared.productSection}>
            <div className={shared.sectionTop}>
              <h2 className={shared.panelTitle}>Current Bidding Products</h2>
              <Link href="/seller/listings/new" className={shared.primaryCta}>
                <PlusIcon />
                <span>Add Product</span>
              </Link>
            </div>

            <div className={shared.productGrid}>
              {activeProducts.map((product) => (
                <article key={product.title} className={`${shared.panel} ${shared.productCard}`}>
                  <div className={shared.productMedia}>
                    <Image src={product.image} alt={product.title} fill sizes="(max-width: 920px) 100vw, 50vw" />
                    <span className={shared.statusTag}>Active</span>
                  </div>

                  <div className={shared.productBody}>
                    <h3>{product.title}</h3>
                    <p>{product.description}</p>

                    <div className={shared.productMeta}>
                      <div>
                        <div className={shared.productMetaLabel}>Current Bid</div>
                        <div className={`${shared.productMetaValue} ${shared.moneyValue}`}>{product.price}</div>
                      </div>
                      <div>
                        <div className={shared.productMetaLabel}>Time Left</div>
                        <div className={shared.productMetaValue}>{product.time}</div>
                      </div>
                    </div>

                    <div className={shared.detailStrip}>
                      <div className={shared.detailRow}>
                        <span>End Time:</span>
                        <span>{product.endTime}</span>
                      </div>
                      <div className={shared.detailRow}>
                        <span>Delivery:</span>
                        <span className={shared.detailHighlight}>{product.delivery}</span>
                      </div>
                      <div className={shared.detailRow}>
                        <span>Views:</span>
                        <span>{product.views}</span>
                      </div>
                    </div>

                    <div className={shared.productFooter}>
                      <span className={shared.rating}>
                        <StarIcon />
                        <span>{product.rating}</span>
                      </span>
                      <button type="button" className={shared.darkButton}>
                        View History
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={shared.productSection}>
            <div className={shared.sectionTop}>
              <h2 className={shared.panelTitle}>Sales History</h2>
            </div>

            <div className={shared.productGrid}>
              {salesHistory.map((item) => (
                <article key={item.title} className={`${shared.panel} ${shared.productCard}`}>
                  <div className={shared.productMedia}>
                    <Image src={item.image} alt={item.title} fill sizes="(max-width: 920px) 100vw, 50vw" />
                    <span className={`${shared.statusTag} ${shared.soldTag}`}>Sold</span>
                  </div>

                  <div className={shared.productBody}>
                    <h3>{item.title}</h3>
                    <div className={shared.productFooter}>
                      <div>
                        <div className={shared.productMetaLabel}>Final Price</div>
                        <div className={`${shared.productMetaValue} ${shared.moneyValue}`}>{item.price}</div>
                      </div>
                      <span className={shared.rating}>
                        <StarIcon />
                        <span>{item.rating}</span>
                      </span>
                    </div>

                    <div style={{ marginTop: 22 }}>
                      <button type="button" className={shared.darkButton} style={{ width: "100%" }}>
                        View Details
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className={`${shared.panel} ${shared.activityPanel}`}>
          <h2>Recent Activity</h2>
          <div className={shared.activityList}>
            {activityItems.map((item) => (
              <article key={item.title} className={shared.activityItem}>
                <span className={`${shared.activityIcon} ${item.iconClass}`}>{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.time}</p>
                </div>
              </article>
            ))}
          </div>

          <Link href="/seller/messages" className={shared.activityLink}>
            View All Activity
          </Link>
        </aside>
      </section>
    </div>
  );
}
