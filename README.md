# Arquitetura de Dados IoT — Stack MING + Stack Web

[Playlist Youtube](https://www.youtube.com/playlist?list=PLYUDPcYmk9tgXM9M3PR0Ak5KVkwjpT1L1)

## Visão Geral

Este projeto implementa uma arquitetura moderna orientada a dados para cenários de **IoT (Internet das Coisas)**, separando claramente:

* **Ingestão e processamento de dados em tempo real** → *Stack MING*
* **Consumo, regras de negócio e aplicações** → *Stack Web*

Essa separação permite **escalabilidade, performance e organização dos dados**, especialmente em cenários com alta geração de telemetria.


## PARTE 1 — STACK MING (Data Pipeline em Tempo Real)

A **Stack MING** é responsável por capturar, processar e armazenar **dados brutos (raw data)** vindos de dispositivos IoT.

### Componentes

#### 1. MQTT (Message Broker)

**Função:** Comunicação entre dispositivos e sistema

* Protocolo leve baseado em publish/subscribe
* Ideal para IoT (baixo consumo de banda)
* Dispositivos (ex: ESP32) publicam dados em tópicos

Exemplo:

```
device/temperatura → 25.3
device/umidade → 60%
```

O MQTT funciona como a **porta de entrada dos dados**


#### 2. Node-RED (Orquestração de Fluxos)

**Função:** Processamento e roteamento dos dados

* Ferramenta low-code baseada em fluxos
* Consome dados do MQTT
* Permite:

  * Transformação de dados
  * Filtragem
  * Enriquecimento
  * Encaminhamento para bancos

Exemplo de fluxo:

```
MQTT → Node-RED → InfluxDB
```

Atua como o **cérebro do pipeline em tempo real**


#### 3. InfluxDB (Banco de Dados Time Series)

**Função:** Armazenamento de dados brutos

* Banco otimizado para séries temporais
* Alta performance para escrita contínua
* Ideal para telemetria (sensores, logs, métricas)

Estrutura:

* timestamp
* measurement (ex: temperatura)
* tags (ex: device_id)
* fields (valor)

É o **repositório oficial dos dados brutos**


#### 4. Grafana (Visualização)

**Função:** Monitoramento em tempo real

* Dashboards interativos
* Conectado ao InfluxDB
* Permite visualizar:

  * séries temporais
  * alertas
  * métricas em tempo real

É a **camada de observabilidade da stack MING**


### Fluxo Completo da Stack MING

```
[Device IoT]
     ↓
   MQTT
     ↓
 Node-RED
     ↓
 InfluxDB
     ↓
  Grafana
```


### Papel da Stack MING

* Alta taxa de ingestão de dados
* Baixa latência
* Armazenamento eficiente de telemetria
* Desacoplamento entre dispositivos e aplicações


## PARTE 2 — STACK WEB (Aplicação e Negócio)

A **Stack Web** é responsável por consumir os dados processados e oferecer funcionalidades ao usuário final.

### Componentes

#### 1. Backend

**Função:** Regras de negócio e integração

* Desenvolvido em Node.js / Express (ou similar)
* Responsável por:

  * APIs REST
  * Processamento de dados consolidados
  * Integração com banco relacional

Importante:
O backend **NÃO deve consumir dados brutos diretamente em alta frequência**


#### 2. Frontend

**Função:** Interface do usuário

* Aplicações web (React, Angular, etc.)
* Consome APIs do backend
* Exibe:

  * dashboards
  * relatórios
  * dados consolidados


#### 3. MySQL (Banco Relacional)

**Função:** Armazenamento de dados consolidados

* Dados estruturados e organizados
* Ideal para:

  * relatórios
  * histórico tratado
  * dados de negócio

Exemplo:

* média de temperatura por dia
* alertas registrados
* eventos processados


### Fluxo da Stack Web

```
InfluxDB → Backend → MySQL → Frontend
```


## PARTE 3 — SEPARAÇÃO: DADOS BRUTOS vs CONSOLIDADOS

### Dados Brutos (Raw Data)

* Origem: dispositivos IoT
* Destino: InfluxDB

Características:

* Alta frequência (ex: a cada segundo)
* Grande volume
* Não processados
* Usados para:

  * monitoramento
  * análise técnica
  * auditoria

Exemplo:

```
timestamp: 10:00:01 → temperatura: 25.1
timestamp: 10:00:02 → temperatura: 25.2
timestamp: 10:00:03 → temperatura: 25.3
```


### Dados Consolidados (Processed Data)

* Origem: backend
* Destino: MySQL

Características:

* Agregados e tratados
* Baixa frequência
* Estruturados para negócio

Exemplo:

```
data: 2026-03-28
temperatura_media: 25.2
temperatura_max: 26.1
```


## POR QUE SEPARAR?

### Problema (sem separação)

Se o backend consumir diretamente dados brutos:

* Sobrecarga de processamento
* Alto consumo de CPU/memória
* Gargalos de performance
* APIs lentas
* Dificuldade de escala


### Solução (arquitetura com MING)

A Stack MING **absorve toda a carga de telemetria**, enquanto o backend trabalha apenas com dados relevantes.



## ARQUITETURA FINAL (ENTERPRISE)

> “Quem gera muito dado não deve conversar direto com quem atende o usuário”

```
             ┌────────────────────┐
             │   Device (IoT)     │
             └────────┬───────────┘
                      ↓
                 [ MQTT ]
                      ↓
               [ Node-RED ]
                      ↓
               [ InfluxDB ]  ← Dados Brutos
                      ↓
         ┌────────────┴────────────┐
         ↓                         ↓
    [ Grafana ]            [ Backend API ]
                                ↓
                           [ MySQL ]  ← Dados Consolidados
                                ↓
                           [ Frontend ]
```


## BENEFÍCIOS DA ARQUITETURA

✔ Alta escalabilidade <br>
✔ Separação de responsabilidades <br>
✔ Performance otimizada <br>
✔ Backend desacoplado da telemetria <br>
✔ Melhor organização dos dados <br>
✔ Facilidade para analytics e IA no futuro


## CONCLUSÃO

A combinação da **Stack MING + Stack Web** cria uma arquitetura robusta e pronta para cenários reais de IoT e Big Data.

* A **Stack MING** resolve o problema de ingestão massiva
* A **Stack Web** resolve o problema de entrega de valor ao usuário

Juntas, permitem evoluir facilmente para:

* Machine Learning
* Analytics avançado
* Sistemas preditivos
