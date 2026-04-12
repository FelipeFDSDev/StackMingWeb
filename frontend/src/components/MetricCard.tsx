import React from "react";
import { SensorMetric } from "../types/api";
import { Sparkline } from "./Sparkline";
import styles from "./MetricCard.module.css";

interface Props {
  metric: SensorMetric;
}

function getStatus(metric: SensorMetric): "normal" | "warn" | "danger" {
  if (metric.value >= metric.threshold.danger) return "danger";
  if (metric.value >= metric.threshold.warn) return "warn";
  return "normal";
}

const statusColor: Record<string, string> = {
  normal: "#10b981",
  warn: "#f59e0b",
  danger: "#ef4444",
};

export const MetricCard: React.FC<Props> = ({ metric }) => {
  const status = getStatus(metric);
  const pct = ((metric.value - metric.min) / (metric.max - metric.min)) * 100;
  const color = statusColor[status];

  return (
    <div className={`${styles.card} ${styles[status]}`}>
      <div className={styles.header}>
        <span className={styles.icon}>{metric.icon}</span>
        <span className={styles.label}>{metric.label}</span>
        <div className={styles.sparkWrap}>
          <Sparkline data={metric.trend} width={80} height={28} color={color} />
        </div>
      </div>

      <div className={styles.valueRow}>
        <span className={styles.value}>{metric.value}</span>
        <span className={styles.unit}>{metric.unit}</span>
      </div>

      <div className={styles.bar}>
        <div
          className={styles.fill}
          style={{ width: `${Math.min(pct, 100)}%`, background: color }}
        />
        <div
          className={styles.warnMark}
          style={{
            left: `${((metric.threshold.warn - metric.min) / (metric.max - metric.min)) * 100}%`,
          }}
        />
      </div>

      <div className={styles.range}>
        <span>{metric.min}{metric.unit}</span>
        <span>{metric.max}{metric.unit}</span>
      </div>
    </div>
  );
};