import React from "react";
import { useIoTData } from "../hooks/useIoTData";
import { resolveAlert } from "../services/api";
import { MetricCard } from "../components/MetricCard";
import { SensorTable } from "../components/SensorTable";
import { AlertFeed } from "../components/AlertFeed";
import { StatsBar } from "../components/StatsBar";
import styles from "./Dashboard.module.css";

function LiveClock() {
  const [time, setTime] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className={styles.clock}>
      {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

export const Dashboard: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { sensors, metrics, alerts, summary, lastRefresh, loading, error, refresh } = useIoTData();

  async function handleResolve(id: string) {
    await resolveAlert(id);
    refresh(); // rebusca após resolver
  }

  const statsItems = [
    { label: "Total de Sensores", value: summary.totalSensors },
    { label: "Online",            value: summary.online,       accent: "#10b981" },
    { label: "Offline",           value: summary.offline,      accent: summary.offline  > 0 ? "#ef4444" : undefined },
    { label: "Em Alerta",         value: summary.warnings,     accent: summary.warnings > 0 ? "#f59e0b" : undefined },
    { label: "Alertas Ativos",    value: summary.activeAlerts, accent: summary.activeAlerts > 0 ? "#ef4444" : undefined },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <span className={styles.logoDot} />
            IoT Monitor
          </div>
          <div className={styles.liveTag}>
            <span className={styles.liveDot} />
            Live
          </div>
        </div>
        <div className={styles.headerRight}>
          <LiveClock />
          {error && <span className={styles.errorTag} title={error}>⚠ Sem conexão</span>}
          {!error && (
            <span className={styles.refreshLabel}>
              Atualizado: {lastRefresh.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button onClick={refresh} className={styles.refreshBtn} disabled={loading} title="Atualizar agora">
            {loading ? "…" : "↻"}
          </button>
          {onBack && (
            <button onClick={onBack} className={styles.backBtn}>← Landing</button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {loading && sensors.length === 0 ? (
          <div className={styles.loadingState}>Carregando dados dos sensores…</div>
        ) : (
          <>
            <section className={styles.section}>
              <StatsBar stats={statsItems} />
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Métricas em Tempo Real</h2>
              <div className={styles.metricsGrid}>
                {metrics.map((m) => <MetricCard key={m.label} metric={m} />)}
              </div>
            </section>

            <div className={styles.split}>
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Dispositivos</h2>
                <SensorTable sensors={sensors} />
              </section>

              <section className={`${styles.section} ${styles.alertSection}`}>
                <h2 className={styles.sectionTitle}>
                  Alertas
                  {summary.activeAlerts > 0 && (
                    <span className={styles.alertCount}>{summary.activeAlerts}</span>
                  )}
                </h2>
                <AlertFeed alerts={alerts} onResolve={handleResolve} />
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
};