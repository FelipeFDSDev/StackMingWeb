const { Router } = require("express");
const { getPool } = require("../db/mysql");

const router = Router();

router.get("/", async (_req, res) => {
  const status = { api: "ok", mysql: "unknown", uptime: process.uptime() };

  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    status.mysql = "ok";
  } catch {
    status.mysql = "error";
  }

  const httpStatus = status.mysql === "ok" ? 200 : 503;
  res.status(httpStatus).json(status);
});

module.exports = router;