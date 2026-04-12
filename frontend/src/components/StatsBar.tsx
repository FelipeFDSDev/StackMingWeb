import React from "react";
import styles from "./StatsBar.module.css";

interface StatItem {
  label: string;
  value: number | string;
  accent?: string;
}

interface Props {
  stats: StatItem[];
}

export const StatsBar: React.FC<Props> = ({ stats }) => (
  <div className={styles.bar}>
    {stats.map((s, i) => (
      <div key={i} className={styles.item}>
        <span className={styles.value} style={s.accent ? { color: s.accent } : {}}>
          {s.value}
        </span>
        <span className={styles.label}>{s.label}</span>
      </div>
    ))}
  </div>
);