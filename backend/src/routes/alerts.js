/**
 * GET /api/alerts
 *   Gera alertas dinamicamente a partir das leituras recentes do InfluxDB.
 *   Não persiste alertas — eles são recalculados a cada requisição.
 *
 * PATCH /api/alerts/:id/resolve
 *   Retorna sucesso (alertas são efêmeros sem persistência).
 *
 * Regras de negócio:
 *   temperatura
 *     Normal:  15–30 °C
 *     Alerta:  30–40 °C ou < 15 °C
 *     Crítico: > 40 °C
 *   umidade
 *     Alerta:  > 85 %
 *   qualidade_ar
 *     Alerta:  > 200 ppm
 *     Crítico: > 250 ppm
 */

const { Router } = require("express");
const { getReadings } = require("../db/influx");

const router = Router();

// ── Regras ────────────────────────────────────────────────────────
function evaluateReading(field, value) {
  switch (field) {
    case "temperatura":
      if (value > 40)
        return { severity: "danger",  msg: `Temperatura crítica: ${value.toFixed(1)} °C (> 40 °C)` };
      if (value > 30)
        return { severity: "warning", msg: `Temperatura elevada: ${value.toFixed(1)} °C (> 30 °C)` };
      if (value < 15)
        return { severity: "warning", msg: `Temperatura baixa: ${value.toFixed(1)} °C (< 15 °C)` };
      return null;

    case "umidade":
      if (value > 85)
        return { severity: "warning", msg: `Umidade alta: ${value.toFixed(1)} % (> 85 %)` };
      return null;

    case "qualidade_ar":
      if (value > 250)
        return { severity: "danger",  msg: `Qualidade do ar crítica: ${value.toFixed(0)} ppm (> 250)` };
      if (value > 200)
        return { severity: "warning", msg: `Qualidade do ar ruim: ${value.toFixed(0)} ppm (> 200)` };
      return null;

    default:
      return null;
  }
}

// ── GET /api/alerts ───────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const readings = await getReadings(5);

    const alerts = [];
    let index = 0;

    for (const r of readings) {
      const result = evaluateReading(r.field, r.value);
      if (result) {
        alerts.push({
          id:          String(index++),
          sensorId:    r.sensorId,
          sensorName:  `Sensor ${r.sensorId.toUpperCase()}`,
          message:     result.msg,
          severity:    result.severity,
          resolved:    false,
          timestamp:   r.time,
          resolvedAt:  null,
        });
      }
    }

    res.json({ data: alerts });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/alerts/:id/resolve ────────────────────────────────
// Sem persistência — apenas responde OK para manter compatibilidade com o frontend
router.patch("/:id/resolve", (_req, res) => {
  res.json({ success: true, note: "Alertas são efêmeros e recalculados a cada consulta." });
});

module.exports = router;
