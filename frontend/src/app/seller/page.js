"use client";


import Link from "next/link";
import { useMemo } from "react";
import shared from "@/components/seller/SellerShared.module.css";
import { useApiData } from "@/hooks/useApiData";
import {
  BoxIcon,
  ClockIcon,
  CurrencyIcon,
  DollarIcon,
  EyeIcon,
  HeartIcon,
  MessageIcon,
  PlusIcon,
  SparklesIcon,
  TrendIcon,
  UsersIcon,
} from "@/components/seller/SellerIcons";

const statIcons = [<BoxIcon key="box" />, <UsersIcon key="users" />, <DollarIcon key="dollar" />, <ClockIcon key="clock" />];
const performanceIcons = [<EyeIcon key="eye" />, <UsersIcon key="users" />, <HeartIcon key="heart" />, <TrendIcon key="trend" />];
const activityVisuals = [
  { icon: <CurrencyIcon />, className: shared.activityGreen },
  { icon: <MessageIcon />, className: shared.activityBlue },
  { icon: <EyeIcon />, className: shared.activityAmber },
  { icon: <TrendIcon />, className: shared.activityAmber },
];

function formatEndTime(value) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function SellerDashboardPage() {
  const { data, isLoading, error } = useApiData("/dashboard/seller", {
    initialData: {
      kpis: [],
      performance: [],
      activity: [],
      spotlight: {
        greeting: "Welcome back!",
        message: "We are loading your seller workspace.",
      },
      currentListings: [],
      salesHistory: [],
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

  const performance = useMemo(
    () =>
      data.performance.map((item, index) => ({
        ...item,
        icon: performanceIcons[index] || <TrendIcon />,
      })),
    [data.performance],
  );

  const activityItems = useMemo(
    () =>
      data.activity.map((item, index) => ({
        ...item,
        icon: activityVisuals[index % activityVisuals.length].icon,
        iconClass: activityVisuals[index % activityVisuals.length].className,
      })),
    [data.activity],
  );

  return (
    <div className={shared.page}>
      <section className={`${shared.panel} ${shared.heroPanel}`}>
        <div className={shared.heroRow}>
          <div className={shared.heroLeft}>
            <span className={shared.heroBadge}>
              <SparklesIcon />
            </span>
            <div className={shared.heroText}>
              <h2>{data.spotlight?.greeting || "Welcome back!"}</h2>
              <p>{data.spotlight?.message || "Your seller activity will appear here shortly."}</p>
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

      {error ? <p className={shared.errorText}>{error}</p> : null}
      {isLoading ? <p className={shared.mutedText}>Loading seller performance...</p> : null}

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
            {performance.map((item) => (
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
              {!data.currentListings.length ? (
                <article className={`${shared.panel} ${shared.productCard}`}>
                  <div className={shared.productBody}>
                    <h3>No live listings yet</h3>
                    <p>Create a listing or submit a draft for approval to start tracking bidding performance here.</p>
                  </div>
                </article>
              ) : null}

              {data.currentListings.map((product) => (
                <article key={product.id} className={`${shared.panel} ${shared.productCard}`}>
                  <div className={shared.productMedia}>
                    <div className={shared.mediaPlaceholder}>
                      <span>{product.code}</span>
                    </div>
                    <span className={shared.statusTag}>{product.status}</span>
                  </div>

                  <div className={shared.productBody}>
                    <h3>{product.title}</h3>
                    <p>{product.description}</p>

                    <div className={shared.productMeta}>
                      <div>
                        <div className={shared.productMetaLabel}>Current Bid</div>
                        <div className={`${shared.productMetaValue} ${shared.moneyValue}`}>{product.currentBid}</div>
                      </div>
                      <div>
                        <div className={shared.productMetaLabel}>Watchers</div>
                        <div className={shared.productMetaValue}>{product.watchers}</div>
                      </div>
                    </div>

                    <div className={shared.detailStrip}>
                      <div className={shared.detailRow}>
                        <span>End Time:</span>
                        <span>{formatEndTime(product.endTime)}</span>
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
                        <EyeIcon />
                        <span>{product.views} views</span>
                      </span>
                      <Link href="/seller/listings" className={shared.darkButton}>
                        Manage Listing
                      </Link>
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
              {!data.salesHistory.length ? (
                <article className={`${shared.panel} ${shared.productCard}`}>
                  <div className={shared.productBody}>
                    <h3>No completed sales yet</h3>
                    <p>Completed and delivered orders will show up here once your current auctions close successfully.</p>
                  </div>
                </article>
              ) : null}

              {data.salesHistory.map((item) => (
                <article key={item.id} className={`${shared.panel} ${shared.productCard}`}>
                  <div className={shared.productMedia}>
                    <div className={shared.mediaPlaceholder}>
                      <span>{item.id}</span>
                    </div>
                    <span className={`${shared.statusTag} ${shared.soldTag}`}>{item.status}</span>
                  </div>

                  <div className={shared.productBody}>
                    <h3>{item.title}</h3>
                    <div className={shared.productFooter}>
                      <div>
                        <div className={shared.productMetaLabel}>Final Price</div>
                        <div className={`${shared.productMetaValue} ${shared.moneyValue}`}>{item.price}</div>
                      </div>
                      <span className={shared.rating}>
                        <DollarIcon />
                        <span>{item.status}</span>
                      </span>
                    </div>

                    <div style={{ marginTop: 22 }}>
                      <Link href="/seller/orders" className={shared.darkButton} style={{ width: "100%" }}>
                        View Order
                      </Link>
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
                  <p>{item.meta}</p>
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
