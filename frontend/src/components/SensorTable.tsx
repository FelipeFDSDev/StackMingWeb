import React from "react";
import { Sensor } from "../types/api";
import { StatusBadge } from "./StatusBadge";
import styles from "./SensorTable.module.css";

interface Props {
  sensors: Sensor[];
}

function BatteryBar({ value }: { value: number }) {
  const color = value < 20 ? "#ef4444" : value < 40 ? "#f59e0b" : "#10b981";
  return (
    <div className={styles.batteryWrap}>
      <div className={styles.batteryTrack}>
        <div style={{ width: `${value}%`, background: color, height: "100%", borderRadius: 2, transition: "width 0.4s" }} />
      </div>
      <span style={{ color, fontWeight: 600, fontSize: 12 }}>{value}%</span>
    </div>
  );
}

function SignalBars({ value }: { value: number }) {
  return (
    <div className={styles.signalWrap}>
      {[25, 50, 75, 100].map((threshold) => (
        <div
          key={threshold}
          className={styles.signalBar}
          style={{
            background: value >= threshold ? "#6366f1" : "#e5e7eb",
            height: 4 + (threshold / 25) * 3,
          }}
        />
      ))}
      <span className={styles.signalLabel}>{value}%</span>
    </div>
  );
}

function formatLastSeen(iso: string | null): string {
  if (!iso) return "nunca";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 10)   return "agora";
  if (diff < 60)   return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  return `${Math.floor(diff / 3600)}h atrás`;
}

export const SensorTable: React.FC<Props> = ({ sensors }) => (
  <div className={styles.wrapper}>
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Sensor</th>
          <th>Localização</th>
          <th>Status</th>
          <th>Bateria</th>
          <th>Sinal</th>
          <th>Última leitura</th>
        </tr>
      </thead>
      <tbody>
        {sensors.map((s) => (
          <tr key={s.id} className={s.status === "offline" ? styles.offline : ""}>
            <td>
              <div className={styles.sensorName}>{s.name}</div>
              <div className={styles.sensorId}>{s.id.toUpperCase()}</div>
            </td>
            <td className={styles.location}>{s.location}</td>
            <td><StatusBadge status={s.status} /></td>
            <td><BatteryBar value={s.battery} /></td>
            <td><SignalBars value={s.signal} /></td>
            <td className={styles.lastSeen}>{formatLastSeen(s.last_seen_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);