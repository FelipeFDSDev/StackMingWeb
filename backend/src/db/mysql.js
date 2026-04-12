const mysql = require("mysql2/promise");

let pool = null;

async function connectMySQL() {
  pool = mysql.createPool({
    host:     process.env.MYSQL_HOST     || "localhost",
    port:     Number(process.env.MYSQL_PORT) || 3306,
    database: process.env.MYSQL_DATABASE || "iot_consolidated",
    user:     process.env.MYSQL_USER     || "root",
    password: process.env.MYSQL_PASSWORD || "",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "Z",
  });

  // Testa a conexão
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();

  return pool;
}

function getPool() {
  if (!pool) throw new Error("MySQL pool não inicializado. Chame connectMySQL() primeiro.");
  return pool;
}

module.exports = { connectMySQL, getPool };