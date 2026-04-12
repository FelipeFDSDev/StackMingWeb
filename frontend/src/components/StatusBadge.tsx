import React from "react";
import { SensorStatus } from "../data/mockSensors";
import styles from "./StatusBadge.module.css";

interface Props {
  status: SensorStatus;
}

const labels: Record<SensorStatus, string> = {
  online: "Online",
  offline: "Offline",
  warning: "Alerta",
};

export const StatusBadge: React.FC<Props> = ({ status }) => (
  <span className={`${styles.badge} ${styles[status]}`}>
    <span className={styles.dot} />
    {labels[status]}
  </span>
);