import { Sensor, MetricSummary, TrendPoint, Alert } from "../types/api";

const BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8080";

// ─── Helpers ──────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`[api] ${path} → HTTP ${res.status}`);
  const json = await res.json();
  return json.data as T;
}

// ─── Endpoints ────────────────────────────────────────────

export function fetchSensors(): Promise<Sensor[]> {
  return get<Sensor[]>("/api/sensors");
}

export function fetchMetrics(): Promise<MetricSummary[]> {
  return get<MetricSummary[]>("/api/metrics");
}

export function fetchTrend(metric: string, points = 12): Promise<TrendPoint[]> {
  return get<TrendPoint[]>(`/api/metrics/${metric}/trend?points=${points}`);
}

export function fetchAlerts(resolved: "false" | "true" | "all" = "all"): Promise<Alert[]> {
  return get<Alert[]>(`/api/alerts?resolved=${resolved}&limit=30`);
}

export async function resolveAlert(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/alerts/${id}/resolve`, { method: "PATCH" });
  if (!res.ok) throw new Error(`[api] resolve alert ${id} → HTTP ${res.status}`);
}

export async function fetchHealth(): Promise<{ api: string; mysql: string }> {
  const res = await fetch(`${BASE}/api/health`);
  return res.json();
}