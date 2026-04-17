/**
 * influx.js
 * Cliente InfluxDB singleton — leitura via Flux query API
 */

const { InfluxDB } = require("@influxdata/influxdb-client");

const INFLUX_URL    = process.env.INFLUX_URL        || "http://influxdb:8086";
const INFLUX_TOKEN  = process.env.INFLUX_TOKEN       || "";
const INFLUX_ORG    = process.env.INFLUX_ORG         || "FATEC";
const INFLUX_BUCKET = process.env.INFLUX_BUCKET      || "FATEC";
const MEASUREMENT   = process.env.INFLUX_MEASUREMENT || "sensores";

let _queryApi = null;

function getQueryApi() {
  if (_queryApi) return _queryApi;
  const client = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
  _queryApi = client.getQueryApi(INFLUX_ORG);
  return _queryApi;
}

/**
 * Executa uma Flux query e retorna array de objetos row.
 */
async function fluxQuery(fluxScript) {
  const api = getQueryApi();
  const rows = [];

  await new Promise((resolve, reject) => {
    api.queryRows(fluxScript, {
      next(row, tableMeta) {
        rows.push(tableMeta.toObject(row));
      },
      error: reject,
      complete: resolve,
    });
  });

  return rows;
}

/**
 * Busca leituras brutas de todos os campos no intervalo informado.
 * Retorna: [{ sensorId, field, value, time }]
 */
async function getReadings(windowMinutes = 5) {
  const flux = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: -${windowMinutes}m)
      |> filter(fn: (r) => r._measurement == "${MEASUREMENT}")
      |> filter(fn: (r) => r._field != "sensor_id")
  `;

  const rows = await fluxQuery(flux);

  return rows.map((r) => ({
    sensorId: r.sensor_id || r["sensor_id"] || "s1",
    field:    r._field,
    value:    Number(r._value),
    time:     r._time,
  }));
}

/**
 * Busca a série temporal de um campo específico.
 * Retorna: [{ value, time }]
 */
async function getTrend(field, windowMinutes = 60, limit = 50) {
  const flux = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: -${windowMinutes}m)
      |> filter(fn: (r) => r._measurement == "${MEASUREMENT}")
      |> filter(fn: (r) => r._field == "${field}")
      |> sort(columns: ["_time"])
      |> limit(n: ${limit})
  `;

  const rows = await fluxQuery(flux);

  return rows.map((r) => ({
    value: Number(r._value),
    time:  r._time,
  }));
}

module.exports = { getReadings, getTrend, MEASUREMENT, INFLUX_BUCKET, INFLUX_ORG };
