"use client";
import { useMemo, useState } from "react";
import {
  BarList,
  Panel,
  SectionIntro,
  StatCard,
} from "@/components/admin/AdminPrimitives";
import { useApiData } from "@/hooks/useApiData";
import { apiDownload } from "@/lib/api";
import styles from "../page.module.css";

function ReportBlock({ report, busyKey, onExport }) {
  return (
    <section className={styles.reportSection}>
      <div className={styles.reportHeading}>
        <div>
          <h2>{report.title}</h2>
          <p className={styles.reportMeta}>{report.periodLabel}</p>
        </div>

        <div className={styles.exportRow}>
          {["pdf", "csv"].map((format) => (
            <button
              key={`${report.key}-${format}`}
              type="button"
              className={styles.actionButton}
              disabled={busyKey === `${report.key}-${format}`}
              onClick={() => onExport(report.key, format)}
            >
              {busyKey === `${report.key}-${format}` ? `Exporting ${format.toUpperCase()}...` : `Export ${format.toUpperCase()}`}
            </button>
          ))}
        </div>
      </div>

      <section className={styles.statGrid}>
        {report.summaryCards.map((card) => (
          <StatCard key={`${report.key}-${card.label}`} {...card} />
        ))}
      </section>

      <section className={styles.mainGrid}>
        {report.sections.map((section) => (
          <Panel key={`${report.key}-${section.title}`} title={section.title} description={section.description}>
            <div className={styles.metricList}>
              {section.rows.map((row) => (
                <article key={`${report.key}-${section.title}-${row.label}`} className={styles.metricRow}>
                  <div>
                    <strong>{row.label}</strong>
                    <p>{row.detail}</p>
                  </div>
                  <strong>{row.value}</strong>
                </article>
              ))}
            </div>
          </Panel>
        ))}
      </section>

      <section className={styles.secondaryGrid}>
        <Panel title="Top sellers" description="Revenue leaders for this window.">
          <BarList items={report.topPerformers.sellers.map((item) => ({ label: item.name, value: item.value || 0 }))} />
        </Panel>
        <Panel title="Top categories" description="Strongest categories by closed order revenue.">
          <BarList items={report.topPerformers.categories.map((item) => ({ label: item.name, value: item.value || 0 }))} />
        </Panel>
      </section>
    </section>
  );
}

export default function AdminReportsPage() {
  const { data, error } = useApiData("/admin/reports/summary", {
    initialData: {
      reports: {
        weekly: {
          key: "weekly",
          title: "Weekly report",
          periodLabel: "",
          summaryCards: [],
          sections: [],
          topPerformers: { sellers: [], categories: [] },
        },
        monthly: {
          key: "monthly",
          title: "Monthly report",
          periodLabel: "",
          summaryCards: [],
          sections: [],
          topPerformers: { sellers: [], categories: [] },
        },
      },
    },
  });
  const [busyKey, setBusyKey] = useState("");
  const [pageError, setPageError] = useState("");

  const reports = useMemo(
    () => [data.reports?.weekly, data.reports?.monthly].filter(Boolean),
    [data.reports],
  );

  async function handleExport(range, format) {
    const key = `${range}-${format}`;
    setBusyKey(key);
    setPageError("");

    try {
      const { blob, fileName } = await apiDownload(`/admin/reports/export?range=${range}&format=${format}`, {
        fallbackName: `auctionarc-${range}-report.${format}`,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setPageError(requestError.message || "Could not export this report.");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div className={styles.page}>
      <SectionIntro
        title="Reporting center"
        description="Weekly and monthly marketplace reports for revenue, bidding, operations, support, and risk. Each report is exportable as PDF or CSV."
      />

      {error ? <p className={styles.inlineNotice}>{error}</p> : null}
      {pageError ? <p className={styles.inlineNotice}>{pageError}</p> : null}

      {reports.map((report) => (
        <ReportBlock key={report.key} report={report} busyKey={busyKey} onExport={handleExport} />
      ))}
    </div>
  );
}
