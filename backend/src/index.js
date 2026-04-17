require("dotenv").config();

const express = require("express");
const cors    = require("cors");

const sensorsRouter = require("./routes/sensors");
const metricsRouter = require("./routes/metrics");
const alertsRouter  = require("./routes/alerts");
const healthRouter  = require("./routes/health");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS ──────────────────────────────────────────────────────────
// Permite qualquer origem (frontend rodando localmente)
app.use(cors());
app.use(express.json());

// ── Logger ────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Rotas ─────────────────────────────────────────────────────────
app.use("/api/health",  healthRouter);
app.use("/api/sensors", sensorsRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/alerts",  alertsRouter);

// ── 404 ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// ── Error handler ─────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.message);
  res.status(500).json({ error: "Erro interno do servidor", detail: err.message });
});

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend rodando em http://0.0.0.0:${PORT}`);
  console.log(`   InfluxDB → ${process.env.INFLUX_URL}`);
  console.log(`   Org: ${process.env.INFLUX_ORG} | Bucket: ${process.env.INFLUX_BUCKET}`);
});
