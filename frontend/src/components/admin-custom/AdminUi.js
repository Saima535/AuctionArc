import styles from "./AdminUi.module.css";

export function SectionTitle({ children }) {
  return (
    <div className={styles.sectionTitle}>
      <span className={styles.sectionBar} />
      <h2>{children}</h2>
    </div>
  );
}

export function PanelCard({ children, className = "" }) {
  return <section className={`${styles.panelCard} ${className}`.trim()}>{children}</section>;
}

export function StatusPill({ tone = "gold", children }) {
  return <span className={`${styles.statusPill} ${styles[tone]}`}>{children}</span>;
}
