/**
 * consolidation.js
 * Job periódico que:
 *  1. Lê leituras brutas do InfluxDB (ou mock)
 *  2. Calcula avg/min/max por sensor+métrica na janela
 *  3. Persiste em metrics_consolidated no MySQL
 *  4. Atualiza status dos sensores
 *  5. Dispara alertas automáticos baseados em thresholds
 */

const cron = require("node-cron");
const { getReadings } = require("../db/influx");
const { getPool } = require("../db/mysql");

// ─── Thresholds para alertas automáticos ─────────────────
const THRESHOLDS = {
  temperature: { warn: 28,   danger: 35  },
  humidity:    { warn: 70,   danger: 85  },
  pressure:    { warn: 1030, danger: 1045 },
  co2:         { warn: 600,  danger: 800 },
  luminosity:  { warn: 1500, danger: 1800 },
  noise:       { warn: 70,   danger: 90  },
};

const METRIC_LABELS = {
  temperature: "Temperatura",
  humidity:    "Umidade",
  pressure:    "Pressão",
  co2:         "CO₂",
  luminosity:  "Luminosidade",
  noise:       "Ruído",
};

// ─── Helpers ──────────────────────────────────────────────
function avg(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }

function severityFor(metric, value) {
  const t = THRESHOLDS[metric];
  if (!t) return null;
  if (value >= t.danger) return "danger";
  if (value >= t.warn)   return "warning";
  return null;
}

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── Pipeline principal ───────────────────────────────────
async function runConsolidation() {
  const windowMinutes = parseInt(process.env.CONSOLIDATION_WINDOW_MINUTES || "5", 10);
  const pool = getPool();

  console.log(`[job] Iniciando consolidação (janela: ${windowMinutes}min)`);

  // 1. Busca leituras brutas
  const readings = await getReadings(windowMinutes);
  if (readings.length === 0) {
    console.log("[job] Nenhuma leitura encontrada");
    return;
  }

  // 2. Agrupa por sensor + métrica
  const groups = {};
  for (const r of readings) {
    const key = `${r.sensorId}::${r.metric}`;
    if (!groups[key]) groups[key] = { ...r, values: [] };
    groups[key].values.push(r.value);
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMinutes * 60_000);
  const seenSensors = new Set();

  // 3. Persiste consolidados + gera alertas
  for (const [, group] of Object.entries(groups)) {
    const { sensorId, metric, unit, values } = group;
    seenSensors.add(sensorId);

    const avgVal = parseFloat(avg(values).toFixed(2));
    const minVal = parseFloat(Math.min(...values).toFixed(2));
    const maxVal = parseFloat(Math.max(...values).toFixed(2));

    // Insere consolidado
    await pool.query(
      `INSERT INTO metrics_consolidated
         (sensor_id, metric, avg_value, min_value, max_value, unit, window_start, window_end)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [sensorId, metric, avgVal, minVal, maxVal, unit, windowStart, now]
    );

    // Insere também em metrics (histórico bruto no MySQL para queries de trend)
    await pool.query(
      `INSERT INTO metrics (sensor_id, metric, value, unit, recorded_at)
       VALUES (?, ?, ?, ?, ?)`,
      [sensorId, metric, avgVal, unit, now]
    );

    // Verifica threshold para alertas
    const severity = severityFor(metric, avgVal);
    if (severity) {
      // Evita duplicar alertas não resolvidos para o mesmo sensor+métrica
      const [existing] = await pool.query(
        `SELECT id FROM alerts
         WHERE sensor_id=? AND message LIKE ? AND resolved=0
         LIMIT 1`,
        [sensorId, `%${METRIC_LABELS[metric] || metric}%`]
      );

      if (existing.length === 0) {
        const [sensorRow] = await pool.query(
          "SELECT name FROM sensors WHERE id=?", [sensorId]
        );
        const sensorName = sensorRow[0]?.name || sensorId;
        const label = METRIC_LABELS[metric] || metric;

        await pool.query(
          `INSERT INTO alerts (id, sensor_id, sensor_name, message, severity, triggered_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            uuid(),
            sensorId,
            sensorName,
            `${label} em ${avgVal}${unit} (${severity === "danger" ? "crítico" : "atenção"})`,
            severity,
            now,
          ]
        );
        console.log(`[job] Alerta criado: ${sensorId} / ${metric} = ${avgVal}${unit} [${severity}]`);
      }
    }
  }

  // 4. Atualiza status dos sensores
  for (const sensorId of seenSensors) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as cnt FROM alerts WHERE sensor_id=? AND resolved=0 AND severity IN ('warning','danger')`,
      [sensorId]
    );
    const status = rows[0].cnt > 0 ? "warning" : "online";

    // Calcula bateria e sinal simulados (substitua por dados reais do InfluxDB)
    const battery = Math.floor(60 + Math.random() * 40);
    const signal  = Math.floor(70 + Math.random() * 30);

    await pool.query(
      `UPDATE sensors SET status=?, battery=?, signal_strength=?, last_seen_at=? WHERE id=?`,
      [status, battery, signal, now, sensorId]
    );
  }

  // 5. Marca sensores sem leitura como offline
  await pool.query(
    `UPDATE sensors
     SET status='offline'
     WHERE id NOT IN (${[...seenSensors].map(() => "?").join(",") || "''"})
     AND (last_seen_at IS NULL OR last_seen_at < ?)`,
    [...seenSensors, new Date(now.getTime() - 10 * 60_000)]
  );

  console.log(
    `[job] Consolidação concluída — ${Object.keys(groups).length} grupos, ${seenSensors.size} sensores ativos`
  );
}

// ─── Agendamento ──────────────────────────────────────────
function startConsolidationJob() {
  const cronExpr = process.env.CONSOLIDATION_CRON || "*/30 * * * * *";

  cron.schedule(cronExpr, async () => {
    try {
      await runConsolidation();
    } catch (err) {
      console.error("[job] Erro na consolidação:", err.message);
    }
  });

  // Roda uma vez imediatamente no boot
  setImmediate(async () => {
    try {
      await runConsolidation();
    } catch (err) {
      console.error("[job] Erro na consolidação inicial:", err.message);
    }
  });
}

module.exports = { startConsolidationJob, runConsolidation };