"use client";

import Image from "next/image";
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
  StarIcon,
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

function formatTimeLeft(value) {
  if (!value) {
    return "Schedule pending";
  }

  const endTime = new Date(value).getTime();

  if (Number.isNaN(endTime)) {
    return "Schedule pending";
  }

  const difference = endTime - Date.now();

  if (difference <= 0) {
    return "Closed";
  }

  const hours = Math.floor(difference / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h left`;
  }

  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m left`;
}

export default function SellerDashboardPage() {
  const { data, isLoading, error } = useApiData("/dashboard/seller", {
    initialData: {
      kpis: [],
      performance: [],
      activity: [],
      auctionSummary: [],
      listingPipeline: [],
      location: {
        label: "",
        query: "",
      },
      currentListings: [],
      salesHistory: [],
    },
  });

  const stats = useMemo(
    () =>
      (data.kpis ?? []).map((item, index) => ({
        ...item,
        icon: statIcons[index] || <TrendIcon />,
      })),
    [data.kpis],
  );

  const performance = useMemo(
    () =>
      (data.performance ?? []).map((item, index) => ({
        ...item,
        icon: performanceIcons[index] || <TrendIcon />,
      })),
    [data.performance],
  );

  const activityItems = useMemo(
    () =>
      (data.activity ?? []).map((item, index) => ({
        ...item,
        icon: activityVisuals[index % activityVisuals.length].icon,
        iconClass: activityVisuals[index % activityVisuals.length].className,
      })),
    [data.activity],
  );

  const auctionSummary = data.auctionSummary ?? [];
  const listingPipeline = data.listingPipeline ?? [];
  const currentListings = data.currentListings ?? [];
  const salesHistory = data.salesHistory ?? [];
  const featuredListings = currentListings.filter((item) => item.premiumHighlight);

  return (
    <div className={shared.page}>
      <section>
        <div className={shared.sectionHeader}>
          <div>
            <h1>Seller control center</h1>
            <p>Track listings, buyer attention, payouts, and active sales from one organized workspace.</p>
          </div>
          <div className={shared.dashboardHeaderActions}>
            <Link href="/seller/auctions" className={shared.darkButton}>
              Manage Auctions
            </Link>
            <Link href="/seller/listings/new" className={shared.primaryCta}>
              <PlusIcon />
              <span>Create Listing</span>
            </Link>
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

      <section className={`${shared.panel} ${shared.analyticsPanel}`}>
        <div className={shared.sectionTop}>
          <div>
            <h2 className={shared.panelTitle}>Analytics snapshot</h2>
            <p className={shared.panelCopy}>Live seller performance across traffic, interest, bidding, and conversions.</p>
          </div>
          <Link href="/seller/analytics" className={shared.activityLink}>
            Open analytics
          </Link>
        </div>

        <div className={shared.analyticsGrid}>
          {performance.map((item) => (
            <article key={item.label} className={shared.analyticsMetric}>
              <div className={shared.analyticsMetricTop}>
                <span className={shared.analyticsMetricIcon}>{item.icon}</span>
                <span className={shared.statDelta}>{item.delta}</span>
              </div>
              <strong>{item.value}</strong>
              <p>{item.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={shared.dashboardGrid}>
        <div className={shared.page}>
          <section className={shared.productSection}>
            <div className={shared.sectionTop}>
              <h2 className={shared.panelTitle}>Auction overview</h2>
              <Link href="/seller/auctions" className={shared.activityLink}>
                View all auctions
              </Link>
            </div>

            <div className={shared.auctionGrid}>
              {!auctionSummary.length ? (
                <article className={`${shared.panel} ${shared.auctionCard}`}>
                  <div className={shared.auctionCardBody}>
                    <h3>No auction sessions yet</h3>
                    <p>Approved listings that get scheduled into auctions will appear here with timing and bid activity.</p>
                  </div>
                </article>
              ) : null}

              {auctionSummary.map((auction) => (
                <article key={auction.id} className={`${shared.panel} ${shared.auctionCard}`}>
                  <div className={shared.auctionCardBody}>
                    <div className={shared.auctionCardTop}>
                      <div>
                        <span className={shared.auctionCode}>{auction.id}</span>
                        <h3>{auction.title}</h3>
                      </div>
                      <span className={shared.statusTag}>{auction.status}</span>
                    </div>

                    <div className={shared.auctionMetrics}>
                      <div>
                        <span>Current bid</span>
                        <strong>{auction.currentBid}</strong>
                      </div>
                      <div>
                        <span>Buyers watching</span>
                        <strong>{auction.watchers}</strong>
                      </div>
                      <div>
                        <span>Bid count</span>
                        <strong>{auction.bidCount}</strong>
                      </div>
                    </div>

                    <div className={shared.detailStrip}>
                      <div className={shared.detailRow}>
                        <span>Starts</span>
                        <span>{formatEndTime(auction.startAt)}</span>
                      </div>
                      <div className={shared.detailRow}>
                        <span>Ends</span>
                        <span>{formatEndTime(auction.endAt)}</span>
                      </div>
                      <div className={shared.detailRow}>
                        <span>Time left</span>
                        <span className={shared.detailHighlight}>{formatTimeLeft(auction.endAt)}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className={shared.miniStats}>
            {listingPipeline.map((item, index) => (
              <article key={item.label} className={`${shared.panel} ${shared.miniStatCard}`}>
                <div className={shared.miniStatTop}>
                  <span className={shared.miniStatIcon}>
                    {index === 0 ? <BoxIcon /> : index === 1 ? <StarIcon /> : index === 2 ? <ClockIcon /> : <TrendIcon />}
                  </span>
                </div>
                <div className={shared.miniStatValue}>{item.value}</div>
                <p>{item.label}</p>
              </article>
            ))}
          </div>

          <section className={shared.productSection}>
            <div className={shared.sectionTop}>
              <h2 className={shared.panelTitle}>Live listing spotlight</h2>
              <Link href="/seller/listings/new" className={shared.primaryCta}>
                <PlusIcon />
                <span>Add Product</span>
              </Link>
            </div>

            <div className={shared.productGrid}>
              {!currentListings.length ? (
                <article className={`${shared.panel} ${shared.productCard}`}>
                  <div className={shared.productBody}>
                    <h3>No live listings yet</h3>
                    <p>Create a listing or submit a draft for approval to start tracking bidding performance here.</p>
                  </div>
                </article>
              ) : null}

              {currentListings.map((product) => (
                <article key={product.id} className={`${shared.panel} ${shared.productCard}`}>
                  <div className={shared.productMedia}>
                    {product.imageUrl ? (
                      <Image src={product.imageUrl} alt={product.title} fill unoptimized />
                    ) : (
                      <div className={shared.mediaPlaceholder}>
                        <span>{product.code}</span>
                      </div>
                    )}
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
              <h2 className={shared.panelTitle}>Listing spotlight</h2>
              <Link href="/seller/listings" className={shared.activityLink}>
                Open all listings
              </Link>
            </div>

            {featuredListings.length ? (
              <div className={shared.featuredRail}>
                {featuredListings.map((item) => (
                  <article key={item.id} className={shared.featuredChip}>
                    <span className={shared.featureReadyBadge}>Featured</span>
                    <strong>{item.title}</strong>
                    <span>{item.currentBid}</span>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <section className={shared.productSection}>
            <div className={shared.sectionTop}>
              <h2 className={shared.panelTitle}>Recent sales history</h2>
            </div>

            <div className={shared.productGrid}>
              {!salesHistory.length ? (
                <article className={`${shared.panel} ${shared.productCard}`}>
                  <div className={shared.productBody}>
                    <h3>No completed sales yet</h3>
                    <p>Completed and delivered orders will show up here once your current auctions close successfully.</p>
                  </div>
                </article>
              ) : null}

              {salesHistory.map((item) => (
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
          <h2>Recent seller activity</h2>
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
            Open Message Center
          </Link>
        </aside>
      </section>
    </div>
  );
}
