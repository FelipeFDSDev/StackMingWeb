/**
 * GET /api/sensors
 * Retorna lista de sensores derivada das leituras recentes do InfluxDB.
 * Cada sensor único é identificado pelo tag sensor_id (ou "s1" como fallback).
 */

const { Router } = require("express");
const { getReadings } = require("../db/influx");

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const readings = await getReadings(10); // últimos 10 min

    if (readings.length === 0) {
      return res.json({ data: [] });
    }

    // Agrupa por sensor_id para encontrar última leitura de cada sensor
    const map = {};
    for (const r of readings) {
      const id = r.sensorId;
      if (!map[id]) {
        map[id] = {
          id,
          name:         `Sensor ${id.toUpperCase()}`,
          location:     "FATEC — EC2",
          status:       "online",
          battery:      null,   // não disponível via MQTT simples
          signal:       null,
          last_seen_at: r.time,
        };
      } else {
        // Mantém o timestamp mais recente
        if (new Date(r.time) > new Date(map[id].last_seen_at)) {
          map[id].last_seen_at = r.time;
        }
      }
    }

    // Marca como offline sensores que não enviaram dados nos últimos 2 min
    const TWO_MIN = 2 * 60 * 1000;
    for (const s of Object.values(map)) {
      const age = Date.now() - new Date(s.last_seen_at).getTime();
      if (age > TWO_MIN) s.status = "offline";
    }

    res.json({ data: Object.values(map) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
