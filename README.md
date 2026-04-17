# Stack MING + Web — Monitoramento de Temperatura IoT

Pipeline completo: **Google Colab → MQTT → Node-RED → InfluxDB → Grafana** + **Backend REST → Frontend React local**

---

## 🏗️ Arquitetura

```
[Google Colab / ESP32 Wokwi]
        │  MQTT JSON
        ▼
[EC2 — Docker Compose]
  ┌─────────────────────────────────────┐
  │  Mosquitto (MQTT Broker) :1883      │
  │  Node-RED :8082  → InfluxDB :8083   │
  │  Grafana :8084   ← InfluxDB         │
  │  Backend Node.js :8080 ← InfluxDB   │
  └─────────────────────────────────────┘
        │  REST API (http://IP:8080)
        ▼
[Seu computador — localhost]
  Frontend React (npm run dev) :5173
```

---

## 🚀 Deploy na EC2

### 1. Clonar e subir os serviços

```bash
git clone https://github.com/FelipeFDSDev/StackMingWeb
cd StackMingWeb
docker compose up -d --build
```

### 2. Verificar que tudo subiu

```bash
docker compose ps
# Todos os serviços devem estar "Up (healthy)"
```

### 3. Portas na EC2 (Security Group AWS)

Liberar **Inbound Rules**:

| Porta | Serviço        |
|-------|----------------|
| 8080  | Backend REST   |
| 8082  | Node-RED UI    |
| 8083  | InfluxDB       |
| 8084  | Grafana        |
| 1883  | MQTT           |

---

## 💻 Rodar o Frontend Localmente

```bash
cd frontend

# 1. Ajuste o IP da EC2 no .env (se necessário)
# VITE_API_URL=http://174.129.124.8:8080

# 2. Instalar dependências
npm install

# 3. Rodar em modo desenvolvimento
npm run dev

# Acesse: http://localhost:5173
```

> O frontend consome a API do backend na EC2. Não acessa o InfluxDB diretamente.

---

## 📡 Publicar dados via Google Colab / Python

```python
import paho.mqtt.client as mqtt
import json, time, random

BROKER = "174.129.124.8"
PORT   = 1883
TOPIC  = "sensores/data"

client = mqtt.Client()
client.connect(BROKER, PORT)

while True:
    payload = {
        "sensor_id":  "s1",
        "temperatura": round(random.uniform(20, 35), 2),
        "umidade":     round(random.uniform(50, 80), 2),
    }
    client.publish(TOPIC, json.dumps(payload))
    print("Publicado:", payload)
    time.sleep(5)
```

---

## 🔧 Serviços e URLs

| Serviço   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:5173        |
| Backend   | http://174.129.124.8:8080    |
| Node-RED  | http://174.129.124.8:8082    |
| Grafana   | http://174.129.124.8:8084    |
| InfluxDB  | http://174.129.124.8:8083    |

---

## ⚙️ Variáveis de configuração

### InfluxDB

| Parâmetro    | Valor       |
|--------------|-------------|
| URL interna  | `http://influxdb:8086` |
| Org          | `FATEC`     |
| Bucket       | `FATEC`     |
| Measurement  | `sensores`  |

### Regras de negócio (alertas)

| Estado   | Temperatura       |
|----------|-------------------|
| Normal   | 15 °C – 30 °C     |
| Alerta   | 30–40 °C ou < 15  |
| Crítico  | > 40 °C           |

---

## 📁 Estrutura do projeto

```
StackMingWeb/
├── docker-compose.yml     ← EC2: todos os serviços (sem MySQL, sem frontend)
├── backend/               ← API REST Node.js + InfluxDB
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── db/influx.js
│       └── routes/{sensors,metrics,alerts,health}.js
├── frontend/              ← React + Vite (roda local)
│   ├── .env               ← VITE_API_URL=http://IP:8080
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
├── nodered/
│   ├── flows.json         ← MQTT → InfluxDB
│   └── package.json       ← node-red-contrib-influxdb
└── mosquitto/
    └── mosquitto.conf
```

---

## 👨‍💻 Autores

- Arthur Gaspare Camzano  
- Felipe Ferreira De Souza  
- Pedro Henrique Cardozo Dias

**FATEC Sorocaba — Programação Multiplataforma — 2026**
