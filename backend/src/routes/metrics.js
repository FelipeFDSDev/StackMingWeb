/**
 * GET /api/metrics                → resumo consolidado de todas as métricas (última janela)
 * GET /api/metrics/:metric/trend  → série histórica de uma métrica (para sparklines)
 *
 * Query params:
 *   sensorId  → filtra por sensor (opcional)
 *   points    → quantos pontos históricos retornar (default 12)
 */

const { Router } = require("express");
const { getPool } = require("../db/mysql");

const router = Router();

// Resumo: última leitura consolidada de cada métrica (média entre todos os sensores)
router.get("/", async (req, res, next) => {
  try {
    const pool = getPool();
    const { sensorId } = req.query;

    const where = sensorId ? "AND mc.sensor_id = ?" : "";
    const params = sensorId ? [sensorId] : [];

    // Para cada métrica, pega a janela mais recente e agrega todos os sensores
    const [rows] = await pool.query(
      `SELECT
         mc.metric,
         mc.unit,
         ROUND(AVG(mc.avg_value), 2)  AS value,
         ROUND(MIN(mc.min_value), 2)  AS min_value,
         ROUND(MAX(mc.max_value), 2)  AS max_value,
         MAX(mc.window_end) AS last_updated
       FROM metrics_consolidated mc
       INNER JOIN (
         SELECT metric, MAX(window_end) AS latest
         FROM metrics_consolidated
         WHERE 1=1 ${where}
         GROUP BY metric
       ) latest ON mc.metric = latest.metric AND mc.window_end = latest.latest
       WHERE 1=1 ${where}
       GROUP BY mc.metric, mc.unit
       ORDER BY mc.metric`,
      [...params, ...params]
    );

    res.json({ data: rows });
  } catch (err) { next(err); }
});

// Série histórica de uma métrica para sparklines
router.get("/:metric/trend", async (req, res, next) => {
  try {
    const pool = getPool();
    const { metric } = req.params;
    const { sensorId, points = "12" } = req.query;
    const limit = Math.min(parseInt(points, 10) || 12, 100);

    const where = sensorId ? "AND sensor_id = ?" : "";
    const params = sensorId ? [metric, sensorId, limit] : [metric, limit];

    const [rows] = await pool.query(
      `SELECT
         window_end AS timestamp,
         ROUND(AVG(avg_value), 2) AS value,
         unit
       FROM metrics_consolidated
       WHERE metric = ? ${where}
       GROUP BY window_end, unit
       ORDER BY window_end DESC
       LIMIT ?`,
      params
    );

    // Retorna do mais antigo para o mais novo (ideal para sparkline)
    res.json({ data: rows.reverse() });
  } catch (err) { next(err); }
});

module.exports = router;