import React from "react";
import { Alert } from "../types/api";
import styles from "./AlertFeed.module.css";

interface Props {
  alerts: Alert[];
  onResolve?: (id: string) => void;
}

const icons: Record<Alert["severity"], string> = {
  info: "ℹ",
  warning: "⚠",
  danger: "✕",
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  return `${Math.floor(diff / 3600)}h atrás`;
}

export const AlertFeed: React.FC<Props> = ({ alerts, onResolve }) => (
  <div className={styles.feed}>
    {alerts.length === 0 && (
      <div className={styles.empty}>Nenhum alerta ativo</div>
    )}
    {alerts.map((alert) => (
      <div
        key={alert.id}
        className={`${styles.item} ${styles[alert.severity]} ${alert.resolved ? styles.resolved : ""}`}
      >
        <span className={styles.icon}>{icons[alert.severity]}</span>
        <div className={styles.body}>
          <div className={styles.msg}>{alert.message}</div>
          <div className={styles.meta}>
            <span>{alert.sensorName}</span>
            <span className={styles.dot}>·</span>
            <span>{timeAgo(alert.timestamp)}</span>
            {alert.resolved
              ? <span className={styles.resolvedBadge}>Resolvido</span>
              : onResolve && (
                  <button
                    className={styles.resolveBtn}
                    onClick={() => onResolve(alert.id)}
                  >
                    Resolver
                  </button>
                )
            }
          </div>
        </div>
      </div>
    ))}
  </div>
);