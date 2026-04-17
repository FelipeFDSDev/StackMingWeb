/**
 * GET /api/metrics
 *   Retorna resumo de cada campo (avg, min, max) da última janela de 5 min.
 *   Formato: { data: MetricSummary[] }
 *
 * GET /api/metrics/:metric/trend?points=N
 *   Retorna série temporal do campo :metric.
 *   Formato: { data: TrendPoint[] }
 */

const { Router } = require("express");
const { getReadings, getTrend } = require("../db/influx");

const router = Router();

// Mapa de unidades por nome de campo (complementa o que vem do Influx)
const UNITS = {
  temperatura:  "°C",
  umidade:      "%",
  luminosidade: "lux",
  qualidade_ar: "ppm",
  pressao:      "hPa",
  co2:          "ppm",
};

// ── GET /api/metrics ─────────────────────────────────────────────
router.get("/", async (_req, res, next) => {
  try {
    const readings = await getReadings(5); // últimos 5 min

    if (readings.length === 0) {
      return res.json({ data: [] });
    }

    // Agrupa por campo
    const grouped = {};
    for (const r of readings) {
      if (!grouped[r.field]) grouped[r.field] = [];
      grouped[r.field].push(r.value);
    }

    const summary = Object.entries(grouped).map(([field, values]) => {
      const avg = values.reduce((a, v) => a + v, 0) / values.length;
      return {
        metric:       field,
        unit:         UNITS[field] || "",
        value:        parseFloat(avg.toFixed(2)),
        min_value:    parseFloat(Math.min(...values).toFixed(2)),
        max_value:    parseFloat(Math.max(...values).toFixed(2)),
        last_updated: new Date().toISOString(),
      };
    });

    res.json({ data: summary });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/metrics/:metric/trend ───────────────────────────────
router.get("/:metric/trend", async (req, res, next) => {
  try {
    const { metric } = req.params;
    const points     = Math.min(parseInt(req.query.points || "20", 10), 100);

    // Busca até 60 min de histórico para ter pontos suficientes
    const series = await getTrend(metric, 60, points);

    const data = series.map((p) => ({
      timestamp: p.time,
      value:     p.value,
      unit:      UNITS[metric] || "",
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
