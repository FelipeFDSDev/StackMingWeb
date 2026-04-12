/**
 * migrate.js
 * Cria as tabelas no MySQL se não existirem.
 * Pode ser chamado via `npm run migrate` ou automaticamente no boot.
 */

const { connectMySQL, getPool } = require("./mysql");

const SQL_SENSORS = `
  CREATE TABLE IF NOT EXISTS sensors (
    id                     VARCHAR(32)  PRIMARY KEY,
    name                   VARCHAR(100) NOT NULL,
    location               VARCHAR(100) NOT NULL,
    status                 ENUM('online','offline','warning') NOT NULL DEFAULT 'offline',
    battery                TINYINT UNSIGNED NOT NULL DEFAULT 0,
    signal_strength        TINYINT UNSIGNED NOT NULL DEFAULT 0,
    last_seen_at           DATETIME,
    created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const SQL_METRICS = `
  CREATE TABLE IF NOT EXISTS metrics (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sensor_id    VARCHAR(32)  NOT NULL,
    metric       VARCHAR(50)  NOT NULL,
    value        DOUBLE       NOT NULL,
    unit         VARCHAR(20)  NOT NULL,
    recorded_at  DATETIME     NOT NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sensor_metric (sensor_id, metric),
    INDEX idx_recorded_at   (recorded_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const SQL_METRICS_CONSOLIDATED = `
  CREATE TABLE IF NOT EXISTS metrics_consolidated (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sensor_id    VARCHAR(32)  NOT NULL,
    metric       VARCHAR(50)  NOT NULL,
    avg_value    DOUBLE       NOT NULL,
    min_value    DOUBLE       NOT NULL,
    max_value    DOUBLE       NOT NULL,
    unit         VARCHAR(20)  NOT NULL,
    window_start DATETIME     NOT NULL,
    window_end   DATETIME     NOT NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sensor_metric_window (sensor_id, metric, window_start)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const SQL_ALERTS = `
  CREATE TABLE IF NOT EXISTS alerts (
    id           VARCHAR(36)  PRIMARY KEY,
    sensor_id    VARCHAR(32)  NOT NULL,
    sensor_name  VARCHAR(100) NOT NULL,
    message      TEXT         NOT NULL,
    severity     ENUM('info','warning','danger') NOT NULL DEFAULT 'info',
    resolved     TINYINT(1)   NOT NULL DEFAULT 0,
    triggered_at DATETIME     NOT NULL,
    resolved_at  DATETIME,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sensor_id  (sensor_id),
    INDEX idx_resolved   (resolved),
    INDEX idx_triggered  (triggered_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

async function runMigrations() {
  const pool = getPool();
  const statements = [SQL_SENSORS, SQL_METRICS, SQL_METRICS_CONSOLIDATED, SQL_ALERTS];
  for (const sql of statements) {
    await pool.query(sql);
  }
  console.log("[migrate] Todas as tabelas OK");
}

// Permite rodar diretamente: node src/db/migrate.js
if (require.main === module) {
  (async () => {
    await connectMySQL();
    await runMigrations();
    process.exit(0);
  })().catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { runMigrations };