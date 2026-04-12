/**
 * GET   /api/alerts           → lista alertas (ativos por padrão)
 * PATCH /api/alerts/:id/resolve → marca alerta como resolvido
 *
 * Query params:
 *   resolved  → "true" | "false" | "all"  (default: "false")
 *   limit     → máximo de registros       (default: 20)
 */

const { Router } = require("express");
const { getPool } = require("../db/mysql");

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const pool = getPool();
    const { resolved = "false", limit = "20" } = req.query;
    const maxRows = Math.min(parseInt(limit, 10) || 20, 100);

    let whereResolved = "WHERE resolved = 0";
    if (resolved === "true")  whereResolved = "WHERE resolved = 1";
    if (resolved === "all")   whereResolved = "";

    const [rows] = await pool.query(
      `SELECT
         id, sensor_id AS sensorId, sensor_name AS sensorName,
         message, severity, resolved,
         DATE_FORMAT(triggered_at, '%Y-%m-%dT%TZ') AS timestamp,
         DATE_FORMAT(resolved_at,  '%Y-%m-%dT%TZ') AS resolvedAt
       FROM alerts
       ${whereResolved}
       ORDER BY triggered_at DESC
       LIMIT ?`,
      [maxRows]
    );

    res.json({ data: rows });
  } catch (err) { next(err); }
});

router.patch("/:id/resolve", async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [result] = await pool.query(
      `UPDATE alerts SET resolved=1, resolved_at=NOW() WHERE id=? AND resolved=0`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Alerta não encontrado ou já resolvido" });
    }
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;