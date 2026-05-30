"use client";

import { useState } from "react";
import Link from "next/link";
import shared from "@/components/seller/SellerShared.module.css";
import { useApiData } from "@/hooks/useApiData";
import { apiDownload } from "@/lib/api";
import {
  BoxIcon,
  DollarIcon,
  PlusIcon,
  TrendIcon,
} from "@/components/seller/SellerIcons";

const statIcons = [<BoxIcon key="box" />, <DollarIcon key="dollar" />];
const reportRanges = [
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

function formatChartValue(value) {
  if (value >= 1000) {
    return `${Math.round(value / 100) / 10}k`;
  }

  return `${Math.round(value)}`;
}

function buildChartTicks(maxValue) {
  if (!maxValue) {
    return [0];
  }

  return [maxValue, maxValue / 2, 0];
}

function formatXAxisLabel(label, range) {
  if (range === "monthly") {
    const parts = String(label || "").split(" ");
    return parts.at(-1) || label;
  }

  return label;
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

function statusClass(status) {
  return status === "Live" || status === "Featured" || status === "Extended" || status === "Sold"
    ? shared.badgeActive
    : status === "Pending approval" || status === "Pending review" || status === "Scheduled"
      ? shared.badgePending
      : shared.badgeMuted;
}

export default function SellerDashboardPage() {
  const [reportRange, setReportRange] = useState("weekly");
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [reportDownloadError, setReportDownloadError] = useState("");
  const { data, isLoading, error } = useApiData("/dashboard/seller", {
    initialData: {
      kpis: [],
      auctionSummary: [],
    },
  });
  const {
    data: reportData,
    isLoading: isReportLoading,
    error: reportError,
  } = useApiData(`/dashboard/seller/report?range=${reportRange}`, {
    initialData: {
      title: "Weekly report",
      periodLabel: "",
      generatedAt: "",
      summaryCards: [],
      sections: [],
      trend: [],
    },
  });

  const auctionSummary = data.auctionSummary ?? [];
  const reportSummary = reportData.summaryCards ?? [];
  const reportTrend = reportData.trend ?? [];
  const reportSection = reportData.sections?.[0] ?? null;
  const reportPeakRevenue = reportTrend.reduce((maxValue, item) => Math.max(maxValue, item.revenue || 0), 0);
  const reportTicks = buildChartTicks(reportPeakRevenue);
  const reportLabelStep =
    reportTrend.length > 20 ? Math.ceil(reportTrend.length / 6) : reportTrend.length > 10 ? 2 : 1;

  async function handleDownloadReport() {
    setIsDownloadingReport(true);
    setReportDownloadError("");

    try {
      const { blob, fileName } = await apiDownload(`/dashboard/seller/report/export?range=${reportRange}`, {
        fallbackName: `auctionarc-seller-${reportRange}-report.pdf`,
      });
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setReportDownloadError(downloadError.message || "Could not download the report.");
    } finally {
      setIsDownloadingReport(false);
    }
  }

  return (
    <div className={shared.page}>
      <section>
        <div className={shared.sectionHeader}>
          <div>
            <h1>Seller control center</h1>
            <p>Track listings, bidding activity, payouts, and active sales from one organized workspace.</p>
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
        {(data.kpis ?? []).map((item, index) => (
          <article key={item.label} className={`${shared.panel} ${shared.statCard}`}>
            <div className={shared.statTop}>
              <span className={shared.statIcon}>{statIcons[index] || <TrendIcon />}</span>
            </div>
            <strong>{item.value}</strong>
            <p>{item.label}</p>
          </article>
        ))}
      </section>

      <section className={shared.dashboardGrid}>
        <section className={`${shared.panel} ${shared.reportPanel}`}>
          <div className={shared.reportHeader}>
            <div>
              <h2 className={shared.panelTitle}>Report</h2>
              <p className={shared.panelCopy}>
                Review seller performance by period and export the current snapshot as a PDF report.
              </p>
            </div>
            <div className={shared.reportToolbar}>
              <div className={shared.reportRangeGroup}>
                {reportRanges.map((range) => (
                  <button
                    key={range.id}
                    type="button"
                    className={range.id === reportRange ? shared.reportRangeButtonActive : shared.reportRangeButton}
                    onClick={() => setReportRange(range.id)}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={shared.darkButton}
                onClick={handleDownloadReport}
                disabled={isDownloadingReport}
              >
                {isDownloadingReport ? "Preparing PDF..." : "Download PDF"}
              </button>
            </div>
          </div>

          {reportError ? <p className={shared.errorText}>{reportError}</p> : null}
          {reportDownloadError ? <p className={shared.errorText}>{reportDownloadError}</p> : null}
          {isReportLoading ? <p className={shared.mutedText}>Loading report snapshot...</p> : null}

          <div className={shared.reportMetaRow}>
            <span>{reportData.title}</span>
            <span>{reportData.periodLabel}</span>
          </div>

          <div className={shared.reportSummaryGrid}>
            {reportSummary.map((card) => (
              <article key={card.label} className={shared.reportSummaryCard}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <p>{card.delta}</p>
              </article>
            ))}
          </div>

          <div className={shared.reportTrendPanel}>
            <div className={shared.sectionTop}>
              <div>
                <h3 className={shared.reportSubheading}>Revenue trend</h3>
                <p className={shared.panelCopy}>A bar chart view of seller revenue for the selected reporting window.</p>
              </div>
            </div>
            <div className={shared.reportChartWrap}>
              <div className={shared.reportAxis}>
                {reportTicks.map((tick) => (
                  <span key={`tick-${tick}`}>{formatChartValue(tick)}</span>
                ))}
              </div>
              <div className={shared.reportChartShell}>
                <div className={shared.reportChart}>
                  <div className={shared.reportGridLineTop} />
                  <div className={shared.reportGridLineMiddle} />
                  <div className={shared.reportGridLineBottom} />
                  {reportTrend.map((point, index) => {
                    const height = reportPeakRevenue ? Math.max((point.revenue / reportPeakRevenue) * 100, 0) : 0;

                    return (
                      <div key={`report-bar-${index}-${point.label}`} className={shared.reportBarColumn}>
                        <div
                          className={shared.reportBarFill}
                          style={{ height: `${height}%` }}
                          title={`${point.label}: ${formatChartValue(point.revenue || 0)}`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className={shared.reportXAxis}>
                  {reportTrend.map((point, index) => {
                    const showLabel =
                      index === 0 || index === reportTrend.length - 1 || index % reportLabelStep === 0;

                    return (
                      <span key={`report-label-${index}-${point.label}`} className={shared.reportBarLabel}>
                        {showLabel ? formatXAxisLabel(point.label, reportRange) : ""}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {reportSection ? (
            <div className={shared.reportDetailGrid}>
              {reportSection.rows.map((row) => (
                <article key={row.label} className={shared.reportDetailCard}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                  <p>{row.detail}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        {auctionSummary.length ? (
          <aside className={`${shared.panel} ${shared.activityPanel}`}>
            <div className={shared.sectionTop}>
              <h2 className={shared.panelTitle}>Recent auctions</h2>
              <Link href="/seller/auctions" className={shared.activityLink}>
                View all
              </Link>
            </div>
            <div className={shared.dashboardList}>
              {auctionSummary.slice(0, 4).map((auction) => (
                <article key={auction.id} className={shared.dashboardListItem}>
                  <span className={`${shared.badge} ${statusClass(auction.status)}`}>{auction.status}</span>
                  <div className={shared.dashboardListMeta}>
                    <strong>{auction.title}</strong>
                    <p>{auction.currentBid} | {auction.bidCount} bids | {formatTimeLeft(auction.endAt)}</p>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        ) : null}
      </section>
    </div>
  );
}
