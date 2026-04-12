/**
 * influx.js
 * Abstrai o acesso ao InfluxDB.
 * Quando USE_MOCK=true, retorna dados gerados localmente
 * sem precisar de uma instância real rodando.
 */

const USE_MOCK = process.env.USE_MOCK === "true";

// ─── Tipos de métricas suportadas ─────────────────────────
const METRIC_CONFIGS = [
  { metric: "temperature", unit: "°C",  base: 24,    noise: 6  },
  { metric: "humidity",    unit: "%",   base: 62,    noise: 15 },
  { metric: "pressure",    unit: "hPa", base: 1013,  noise: 8  },
  { metric: "co2",         unit: "ppm", base: 420,   noise: 60 },
  { metric: "luminosity",  unit: "lux", base: 780,   noise: 200 },
  { metric: "noise",       unit: "dB",  base: 43,    noise: 15 },
];

const SENSOR_IDS = ["s1", "s2", "s3", "s4", "s5"];

// ─── Mock ─────────────────────────────────────────────────
function randomValue(base, noise) {
  return parseFloat((base + (Math.random() - 0.5) * noise).toFixed(2));
}

/**
 * Gera leituras simuladas para os últimos `windowMinutes` minutos.
 * Retorna array de { sensorId, metric, value, unit, timestamp }
 */
function getMockReadings(windowMinutes = 5) {
  const now = Date.now();
  const readings = [];

  for (const sensorId of SENSOR_IDS) {
    // Sensor D4 simulado como offline (sem leituras)
    if (sensorId === "s4") continue;

    for (const { metric, unit, base, noise } of METRIC_CONFIGS) {
      // 3 leituras por janela
      for (let i = 0; i < 3; i++) {
        const offset = Math.random() * windowMinutes * 60_000;
        readings.push({
          sensorId,
          metric,
          value: randomValue(base, noise),
          unit,
          timestamp: new Date(now - offset),
        });
      }
    }
  }

  return readings;
}

// ─── InfluxDB real ────────────────────────────────────────
let influxQueryApi = null;

function getInfluxClient() {
  if (influxQueryApi) return influxQueryApi;

  const { InfluxDB } = require("@influxdata/influxdb-client");
  const client = new InfluxDB({
    url:   process.env.INFLUX_URL   || "http://localhost:8086",
    token: process.env.INFLUX_TOKEN || "",
  });
  influxQueryApi = client.getQueryApi(process.env.INFLUX_ORG || "my-org");
  return influxQueryApi;
}

/**
 * Busca leituras brutas dos últimos `windowMinutes` minutos no InfluxDB.
 * Retorna o mesmo shape que getMockReadings().
 */
async function getRealReadings(windowMinutes = 5) {
  const queryApi = getInfluxClient();
  const bucket = process.env.INFLUX_BUCKET || "iot-sensors";

  const flux = `
    from(bucket: "${bucket}")
      |> range(start: -${windowMinutes}m)
      |> filter(fn: (r) => r._measurement == "sensor_reading")
      |> pivot(rowKey:["_time","sensor_id"], columnKey: ["_field"], valueColumn: "_value")
  `;

  const readings = [];

  await new Promise((resolve, reject) => {
    queryApi.queryRows(flux, {
      next(row, tableMeta) {
        const obj = tableMeta.toObject(row);
        // Cada linha tem: sensor_id, metric, value, unit, _time
        readings.push({
          sensorId:  obj.sensor_id,
          metric:    obj.metric,
          value:     parseFloat(obj.value),
          unit:      obj.unit || "",
          timestamp: new Date(obj._time),
        });
      },
      error: reject,
      complete: resolve,
    });
  });

  return readings;
}

/**
 * Ponto de entrada principal — decide mock vs real automaticamente.
 */
async function getReadings(windowMinutes = 5) {
  if (USE_MOCK) {
    console.log("[influx] Usando dados mockados");
    return getMockReadings(windowMinutes);
  }
  console.log(`[influx] Consultando InfluxDB (últimos ${windowMinutes}min)`);
  return getRealReadings(windowMinutes);
}

module.exports = { getReadings, METRIC_CONFIGS, SENSOR_IDS };