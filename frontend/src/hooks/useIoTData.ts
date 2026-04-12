import { useEffect, useRef, useState, useCallback } from "react";
import { fetchSensors, fetchMetrics, fetchTrend, fetchAlerts } from "../services/api";
import { IoTData, SensorMetric, MetricSummary } from "../types/api";

// ─── Metadados estáticos por métrica ─────────────────────
// Esses valores não vêm do backend (são de domínio do frontend)

const METRIC_META: Record<string, {
  label: string;
  icon: string;
  min: number;
  max: number;
  threshold: { warn: number; danger: number };
}> = {
  temperature: { label: "Temperatura",  icon: "🌡", min: 15,  max: 40,   threshold: { warn: 28,   danger: 35   } },
  humidity:    { label: "Umidade",       icon: "💧", min: 0,   max: 100,  threshold: { warn: 70,   danger: 85   } },
  pressure:    { label: "Pressão",       icon: "📊", min: 950, max: 1050, threshold: { warn: 1030, danger: 1045 } },
  co2:         { label: "CO₂",           icon: "🫧", min: 300, max: 1000, threshold: { warn: 600,  danger: 800  } },
  luminosity:  { label: "Luminosidade",  icon: "☀",  min: 0,   max: 2000, threshold: { warn: 1500, danger: 1800 } },
  noise:       { label: "Ruído",         icon: "🔊", min: 0,   max: 120,  threshold: { warn: 70,   danger: 90   } },
};

const POLL_INTERVAL_MS = 30_000; // 30 segundos

// ─── Montagem dos SensorMetric completos ─────────────────

async function buildMetrics(summaries: MetricSummary[]): Promise<SensorMetric[]> {
  // Busca trends em paralelo para todas as métricas
  const withTrends = await Promise.all(
    summaries.map(async (s) => {
      const meta = METRIC_META[s.metric];
      let trend: SensorMetric["trend"] = [];
      try {
        trend = await fetchTrend(s.metric, 12);
      } catch {
        // trend vazio não quebra o card
      }
      return {
        label:     meta?.label     ?? s.metric,
        icon:      meta?.icon      ?? "📡",
        min:       meta?.min       ?? 0,
        max:       meta?.max       ?? 100,
        threshold: meta?.threshold ?? { warn: 70, danger: 90 },
        value:     s.value,
        unit:      s.unit,
        trend,
      } satisfies SensorMetric;
    })
  );
  return withTrends;
}

// ─── Hook principal ───────────────────────────────────────

const EMPTY: IoTData = {
  sensors:     [],
  metrics:     [],
  alerts:      [],
  summary:     { totalSensors: 0, online: 0, offline: 0, warnings: 0, activeAlerts: 0 },
  lastRefresh: new Date(),
  loading:     true,
  error:       null,
};

export function useIoTData(): IoTData & { refresh: () => void } {
  const [data, setData] = useState<IoTData>(EMPTY);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      // Todas as chamadas em paralelo (exceto trends que dependem de metrics)
      const [sensors, metricSummaries, alerts] = await Promise.all([
        fetchSensors(),
        fetchMetrics(),
        fetchAlerts("all"),
      ]);

      // Trends buscados em paralelo depois
      const metrics = await buildMetrics(metricSummaries);

      const online   = sensors.filter((s) => s.status === "online").length;
      const offline  = sensors.filter((s) => s.status === "offline").length;
      const warnings = sensors.filter((s) => s.status === "warning").length;
      const activeAlerts = alerts.filter((a) => !a.resolved).length;

      setData({
        sensors,
        metrics,
        alerts,
        summary: { totalSensors: sensors.length, online, offline, warnings, activeAlerts },
        lastRefresh: new Date(),
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("[useIoTData]", message);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, []);

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [load]);

  return { ...data, refresh: load };
}