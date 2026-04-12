/**
 * GET  /api/sensors          → lista todos os sensores com status atual
 * GET  /api/sensors/:id      → detalhe de um sensor
 * PATCH /api/sensors/:id     → atualiza campos (ex: nome, localização)
 */

const { Router } = require("express");
const { getPool } = require("../db/mysql");

const router = Router();

// Lista todos
router.get("/", async (_req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT
         id, name, location, status,
         battery, signal_strength,
         DATE_FORMAT(last_seen_at, '%Y-%m-%dT%TZ') AS last_seen_at,
         DATE_FORMAT(created_at,   '%Y-%m-%dT%TZ') AS created_at
       FROM sensors
       ORDER BY name`
    );
    res.json({ data: rows });
  } catch (err) { next(err); }
});

// Detalhe + últimas leituras consolidadas
router.get("/:id", async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [[sensor]] = await pool.query(
      `SELECT id, name, location, status, battery, signal_strength, last_seen_at
       FROM sensors WHERE id=?`,
      [id]
    );
    if (!sensor) return res.status(404).json({ error: "Sensor não encontrado" });

    // Última leitura de cada métrica
    const [readings] = await pool.query(
      `SELECT metric, avg_value AS value, unit, window_end AS recorded_at
       FROM metrics_consolidated
       WHERE sensor_id=?
       GROUP BY metric
       HAVING window_end = MAX(window_end)
       ORDER BY metric`,
      [id]
    );

    res.json({ data: { ...sensor, readings } });
  } catch (err) { next(err); }
});

// Atualiza sensor
router.patch("/:id", async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { name, location } = req.body;

    const fields = [];
    const values = [];
    if (name)     { fields.push("name=?");     values.push(name); }
    if (location) { fields.push("location=?"); values.push(location); }
    if (!fields.length) return res.status(400).json({ error: "Nenhum campo para atualizar" });

    values.push(id);
    await pool.query(`UPDATE sensors SET ${fields.join(",")} WHERE id=?`, values);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;