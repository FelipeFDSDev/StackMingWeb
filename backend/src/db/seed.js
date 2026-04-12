/**
 * seed.js
 * Popula o MySQL com sensores iniciais para desenvolvimento.
 * node src/db/seed.js
 */

require("dotenv").config();
const { connectMySQL, getPool } = require("./mysql");
const { runMigrations } = require("./migrate");

const SENSORS = [
  { id: "s1", name: "Sensor A1", location: "Sala de Servidores" },
  { id: "s2", name: "Sensor B2", location: "Depósito Norte" },
  { id: "s3", name: "Sensor C3", location: "Área Produção" },
  { id: "s4", name: "Sensor D4", location: "Almoxarifado" },
  { id: "s5", name: "Sensor E5", location: "Recepção" },
];

async function seed() {
  await connectMySQL();
  await runMigrations();
  const pool = getPool();

  for (const s of SENSORS) {
    await pool.query(
      `INSERT INTO sensors (id, name, location, status, battery, signal_strength)
       VALUES (?, ?, ?, 'online', 100, 90)
       ON DUPLICATE KEY UPDATE name=VALUES(name), location=VALUES(location)`,
      [s.id, s.name, s.location]
    );
  }

  console.log(`[seed] ${SENSORS.length} sensores inseridos/atualizados`);
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });