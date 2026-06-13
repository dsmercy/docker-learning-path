# Phase 9 — Reverse Proxy

**Stack:** React Vite · Express.js · MongoDB 7 · **Nginx (reverse proxy + SSL)**

## What this phase teaches

| Topic | Where to see it |
|---|---|
| Nginx routing `/api/*` → API, `/` → frontend | `nginx/nginx.conf` → `location` blocks |
| Single external port (80 + 443 only) | `docker-compose.yml` — only `nginx` has `ports:` |
| Self-signed TLS cert generated at build time | `nginx/Dockerfile` → `openssl req` |
| Load balancing: Nginx upstream with 2 API replicas | `nginx/nginx.conf` → `upstream api_upstream` |
| Frontend calls `/api/*` not `localhost:3001` | `frontend/src/App.jsx` → `const API = '/api'` |

## Quick start

```bash
cp .env.example .env
docker compose up -d --build
```

- App (HTTP → redirects to HTTPS): <http://localhost>
- App (HTTPS): <https://localhost>  *(accept the self-signed cert warning)*

## Load balancing with 2 API replicas

```bash
docker compose up -d --scale api=2
```

Docker Desktop Containers panel shows `api-1` and `api-2` as separate rows in the Compose group.
Each request to `/api/health` returns a different `replica` hostname — proving Nginx round-robins.

```bash
# Watch the replica field alternate between api-1 and api-2:
for i in 1 2 3 4; do curl -sk https://localhost/api/health; echo; done
```

## Verify port isolation

```bash
# Only Nginx has host ports — api and frontend have none:
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

Docker Desktop: Containers panel → any API/frontend container → **Ports tab** shows empty.

## Docker Desktop walkthrough

### Containers panel → nginx → Ports tab
Only port 80 and 443 are mapped. API and frontend show no host port mappings.

### Containers panel → nginx → Logs tab
Watch Nginx access logs as requests arrive. Each API call appears here.
```bash
docker compose logs -f nginx
```

### Networks panel → phase9-net
All containers listed with internal IPs. Only nginx has an external port.

### Scaling
```bash
docker compose up -d --scale api=2
```
Desktop shows `phase-09-reverse-proxy-api-1` and `phase-09-reverse-proxy-api-2` in the Compose group.

## Completion checklist

- [ ] All traffic enters through Nginx on port 80/443
- [ ] `docker ps` shows zero host-mapped ports on frontend and api containers
- [ ] `curl http://localhost/api/products` returns product JSON
- [ ] `curl -k https://localhost/api/products` works with self-signed cert
- [ ] `docker compose up --scale api=2` shows two API containers in Desktop Compose group
