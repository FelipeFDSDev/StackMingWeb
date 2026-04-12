export type SensorStatus = "online" | "offline" | "warning";

export interface Sensor {
  id: string;
  name: string;
  location: string;
  status: SensorStatus;
  lastSeen: string;
  battery: number;
  signal: number;
}

export interface Reading {
  timestamp: string;
  value: number;
}

export interface SensorMetric {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  threshold: { warn: number; danger: number };
  trend: Reading[];
  icon: string;
}

export interface Alert {
  id: string;
  sensorId: string;
  sensorName: string;
  message: string;
  severity: "info" | "warning" | "danger";
  timestamp: string;
  resolved: boolean;
}

const now = Date.now();
const point = (offset: number, base: number, noise: number): Reading => ({
  timestamp: new Date(now - offset * 60_000).toISOString(),
  value: parseFloat((base + (Math.random() - 0.5) * noise).toFixed(1)),
});

const trend = (points: number, base: number, noise: number): Reading[] =>
  Array.from({ length: points }, (_, i) => point((points - i) * 5, base, noise));

export const sensors: Sensor[] = [
  { id: "s1", name: "Sensor A1", location: "Sala de Servidores", status: "online", lastSeen: "agora", battery: 87, signal: 92 },
  { id: "s2", name: "Sensor B2", location: "Depósito Norte", status: "warning", lastSeen: "2 min", battery: 23, signal: 61 },
  { id: "s3", name: "Sensor C3", location: "Área Produção", status: "online", lastSeen: "agora", battery: 74, signal: 88 },
  { id: "s4", name: "Sensor D4", location: "Almoxarifado", status: "offline", lastSeen: "47 min", battery: 0, signal: 0 },
  { id: "s5", name: "Sensor E5", location: "Recepção", status: "online", lastSeen: "agora", battery: 95, signal: 97 },
];

export const metrics: SensorMetric[] = [
  {
    label: "Temperatura",
    value: 24.3,
    unit: "°C",
    min: 15,
    max: 40,
    threshold: { warn: 28, danger: 35 },
    trend: trend(12, 24, 3),
    icon: "🌡",
  },
  {
    label: "Umidade",
    value: 62,
    unit: "%",
    min: 0,
    max: 100,
    threshold: { warn: 70, danger: 85 },
    trend: trend(12, 62, 8),
    icon: "💧",
  },
  {
    label: "Pressão",
    value: 1013.2,
    unit: "hPa",
    min: 950,
    max: 1050,
    threshold: { warn: 1030, danger: 1045 },
    trend: trend(12, 1013, 5),
    icon: "📊",
  },
  {
    label: "CO₂",
    value: 412,
    unit: "ppm",
    min: 300,
    max: 1000,
    threshold: { warn: 600, danger: 800 },
    trend: trend(12, 412, 30),
    icon: "🫧",
  },
  {
    label: "Luminosidade",
    value: 780,
    unit: "lux",
    min: 0,
    max: 2000,
    threshold: { warn: 1500, danger: 1800 },
    trend: trend(12, 780, 100),
    icon: "☀",
  },
  {
    label: "Ruído",
    value: 43,
    unit: "dB",
    min: 0,
    max: 120,
    threshold: { warn: 70, danger: 90 },
    trend: trend(12, 43, 10),
    icon: "🔊",
  },
];

export const alerts: Alert[] = [
  {
    id: "a1",
    sensorId: "s2",
    sensorName: "Sensor B2",
    message: "Bateria crítica — abaixo de 25%",
    severity: "warning",
    timestamp: new Date(now - 3 * 60_000).toISOString(),
    resolved: false,
  },
  {
    id: "a2",
    sensorId: "s4",
    sensorName: "Sensor D4",
    message: "Sensor offline há mais de 30 minutos",
    severity: "danger",
    timestamp: new Date(now - 47 * 60_000).toISOString(),
    resolved: false,
  },
  {
    id: "a3",
    sensorId: "s1",
    sensorName: "Sensor A1",
    message: "Temperatura acima de 28°C por 5 min",
    severity: "info",
    timestamp: new Date(now - 12 * 60_000).toISOString(),
    resolved: true,
  },
];

export const summaryStats = {
  totalSensors: sensors.length,
  online: sensors.filter((s) => s.status === "online").length,
  offline: sensors.filter((s) => s.status === "offline").length,
  warnings: sensors.filter((s) => s.status === "warning").length,
  activeAlerts: alerts.filter((a) => !a.resolved).length,
};