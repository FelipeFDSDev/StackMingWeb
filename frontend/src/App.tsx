import React, { useState } from "react";
import "./App.css";
import { Dashboard } from "./pages/Dashboard";

function LandingPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="app">
      <header className="navbar">
        <div className="logo">Stack MING</div>
        <nav>
          <a href="#ming">MING</a>
          <a href="#web">Web</a>
          <a href="#arquitetura">Arquitetura</a>
          <button className="nav-dashboard" onClick={onEnter}>
            Dashboard →
          </button>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h1>Arquitetura IoT moderna e escalável</h1>
          <p>
            Separação entre ingestão de dados e aplicação para alta performance
            e sistemas prontos para crescimento.
          </p>
          <div className="hero-buttons">
            <button className="primary" onClick={onEnter}>Ver Dashboard</button>
            <button className="secondary">Ver Arquitetura</button>
          </div>
        </div>
      </section>

      <section id="ming" className="section">
        <h2>Stack MING</h2>
        <p className="subtitle">Pipeline de dados em tempo real para ingestão de telemetria</p>
        <div className="grid-lg">
          <div className="card"><h3>MQTT</h3><p>Comunicação leve e eficiente para dispositivos IoT</p></div>
          <div className="card"><h3>Node-RED</h3><p>Orquestração e processamento de dados</p></div>
          <div className="card"><h3>InfluxDB</h3><p>Banco otimizado para séries temporais</p></div>
          <div className="card"><h3>Grafana</h3><p>Dashboards e monitoramento em tempo real</p></div>
        </div>
      </section>

      <section id="web" className="section dark">
        <h2>Stack Web</h2>
        <p className="subtitle">Camada de aplicação e entrega de valor ao usuário</p>
        <div className="grid">
          <div className="card"><h3>Backend</h3><p>APIs e regras de negócio desacopladas da telemetria</p></div>
          <div className="card"><h3>Frontend</h3><p>Interface moderna e responsiva</p></div>
          <div className="card"><h3>MySQL</h3><p>Dados consolidados e estruturados</p></div>
        </div>
      </section>

      <section id="arquitetura" className="section">
        <h2>Arquitetura Inteligente</h2>
        <p className="subtitle">Separação entre dados brutos e consolidados</p>
        <div className="architecture">
          <div className="box">Device</div>
          <div className="arrow">→</div>
          <div className="box">MING</div>
          <div className="arrow">→</div>
          <div className="box">Backend</div>
          <div className="arrow">→</div>
          <div className="box">Frontend</div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Pronto para escalar seu projeto IoT?</h2>
        <button className="primary large" onClick={onEnter}>Abrir Dashboard</button>
      </section>

      <footer className="footer">
        <p>Stack MING + Web • Arquitetura IoT</p>
      </footer>
    </div>
  );
}

function App() {
  const [view, setView] = useState<"landing" | "dashboard">("landing");

  if (view === "dashboard") {
    return <Dashboard onBack={() => setView("landing")} />;
  }

  return <LandingPage onEnter={() => setView("dashboard")} />;
}

export default App;