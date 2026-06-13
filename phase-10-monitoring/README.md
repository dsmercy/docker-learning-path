# Phase 10 — Monitoring and Logging

**Stack:** Express.js · MongoDB · **Prometheus · Grafana · Loki · Winston**

## What this phase teaches

| Topic | Where to see it |
|---|---|
| Structured JSON logs via Winston | `api/server.js` → `winston.createLogger` |
| Logs shipped to Loki | `api/server.js` → `LokiTransport` |
| Prometheus metrics via `prom-client` | `api/server.js` → `/metrics` endpoint |
| Prometheus scrape config | `prometheus/prometheus.yml` |
| Grafana auto-provisioned datasources | `grafana/provisioning/datasources/` |
| Pre-built dashboard (request rate, latency, errors, logs) | `grafana/dashboards/api-dashboard.json` |

## Quick start

```bash
docker compose up -d --build
```

| Service | URL |
|---|---|
| API | <http://localhost:3001> |
| API metrics | <http://localhost:3001/metrics> |
| Prometheus | <http://localhost:9090> |
| Grafana | <http://localhost:3000>  (admin / admin) |
| Loki | <http://localhost:3100/ready> |

## Generate load to see metrics

```bash
# Windows PowerShell — 50 requests
1..50 | ForEach-Object { Invoke-WebRequest -Uri http://localhost:3001/products -UseBasicParsing | Out-Null }

# bash / WSL2
for i in $(seq 1 50); do curl -s http://localhost:3001/products > /dev/null; done
```

Then open Grafana → Dashboards → **Product API Dashboard** to see request rate and latency.

## Grafana walkthrough

1. Open <http://localhost:3000>, login with `admin` / `admin`
2. Go to **Dashboards** → **Product API Dashboard** (auto-provisioned)
3. Top-left panel: **Request Rate** — sourced from Prometheus
4. Top-right panel: **p95 Latency** — sourced from Prometheus
5. Bottom-left: **Error Rate (5xx)** — sourced from Prometheus
6. Bottom-right: **API Logs** — sourced from Loki (structured JSON from Winston)

## Docker Desktop walkthrough

### Containers panel → api → Stats tab
Live CPU%, memory, network I/O. Generate load and watch the graph spike.
Then switch to Grafana — compare the same period. Stats tab = single container, no history.
Grafana = cross-container, historical, alertable.

### Containers panel → loki → Ports tab
Port 3100 is mapped. Click the link to open `http://localhost:3100/ready`.

### Containers panel → prometheus → Ports tab
Port 9090. Click to open Prometheus UI → Status → Targets — confirm `product-api` is UP.

### Containers panel → grafana → Ports tab
Port 3000. Click to open Grafana directly from Docker Desktop.

## Completion checklist

- [ ] Grafana shows structured logs from Loki
- [ ] Prometheus scrapes metrics at `http://localhost:9090` — target shows UP
- [ ] Grafana dashboard shows request rate and error rate from Prometheus
- [ ] Docker Desktop Stats tab confirms containers are within expected resource usage
- [ ] All services start via a single `docker compose up -d`
