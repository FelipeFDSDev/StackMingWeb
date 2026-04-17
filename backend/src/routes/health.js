const { Router } = require("express");
const { getReadings } = require("../db/influx");

const router = Router();

router.get("/", async (_req, res) => {
  let influx = "ok";
  try {
    await getReadings(1);
  } catch {
    influx = "error";
  }

  res.json({
    api:     "ok",
    influx,
    ts:      new Date().toISOString(),
  });
});

module.exports = router;
