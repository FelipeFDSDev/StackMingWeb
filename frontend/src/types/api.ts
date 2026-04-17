// ─── Primitivos ───────────────────────────────────────────

export type SensorStatus  = "online" | "offline" | "warning";
export type AlertSeverity = "info" | "warning" | "danger";

// ─── Sensor ───────────────────────────────────────────────

export interface Sensor {
  id:           string;
  name:         string;
  location:     string;
  status:       SensorStatus;
  battery:      number | null;
  signal:       number | null;
  last_seen_at: string | null;
}

// ─── Métricas ─────────────────────────────────────────────

/** Resposta de GET /api/metrics */
export interface MetricSummary {
  metric:       string;
  unit:         string;
  value:        number;
  min_value:    number;
  max_value:    number;
  last_updated: string;
}

/** Resposta de GET /api/metrics/:metric/trend */
export interface TrendPoint {
  timestamp: string;
  value:     number;
  unit:      string;
}

// ─── Alertas ──────────────────────────────────────────────

export interface Alert {
  id:          string;
  sensorId:    string;
  sensorName:  string;
  message:     string;
  severity:    AlertSeverity;
  resolved:    boolean;
  timestamp:   string;
  resolvedAt:  string | null;
}

// ─── Shape que o Dashboard/MetricCard consome ─────────────

export interface SensorMetric {
  label:     string;
  value:     number;
  unit:      string;
  min:       number;
  max:       number;
  threshold: { warn: number; danger: number };
  trend:     TrendPoint[];
  icon:      string;
}

// ─── Estado agregado do hook ──────────────────────────────

export interface IoTData {
  sensors:  Sensor[];
  metrics:  SensorMetric[];
  alerts:   Alert[];
  summary: {
    totalSensors: number;
    online:       number;
    offline:      number;
    warnings:     number;
    activeAlerts: number;
  };
  lastRefresh: Date;
  loading:     boolean;
  error:       string | null;
}
