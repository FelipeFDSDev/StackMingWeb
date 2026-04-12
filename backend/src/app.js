const express = require("express");
const cors = require("cors");

const sensorsRouter = require("./routes/sensors");
const metricsRouter = require("./routes/metrics");
const alertsRouter = require("./routes/alerts");
const healthRouter = require("./routes/health");

const app = express();

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PATCH"],
}));
app.use(express.json());

// Request logger simples
app.use((req, _res, next) => {
  console.log(`[http] ${req.method} ${req.path}`);
  next();
});

// ─── Rotas ───────────────────────────────────────────────
app.use("/api/health",  healthRouter);
app.use("/api/sensors", sensorsRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/alerts",  alertsRouter);

// ─── 404 ─────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// ─── Error handler ────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[error]", err);
  res.status(500).json({ error: "Erro interno do servidor", detail: err.message });
});

module.exports = app;