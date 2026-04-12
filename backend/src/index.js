require("dotenv").config();

const app = require("./app");
const { connectMySQL } = require("./db/mysql");
const { startConsolidationJob } = require("./jobs/consolidation");

const PORT = process.env.PORT || 3000;

async function main() {
  // 1. Conecta MySQL
  await connectMySQL();
  console.log("[boot] MySQL conectado");

  // 2. Roda migrations na inicialização
  const { runMigrations } = require("./db/migrate");
  await runMigrations();
  console.log("[boot] Migrations OK");

  // 3. Inicia job de consolidação periódica
  startConsolidationJob();
  console.log("[boot] Job de consolidação iniciado");

  // 4. Sobe o servidor HTTP
  app.listen(PORT, () => {
    console.log(`[boot] API rodando em http://localhost:${PORT}`);
    console.log(`[boot] Modo mock: ${process.env.USE_MOCK === "true" ? "SIM" : "NÃO"}`);
  });
}

main().catch((err) => {
  console.error("[boot] Falha fatal:", err);
  process.exit(1);
});