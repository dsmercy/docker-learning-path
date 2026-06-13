# Phase 6 — Frontend + Backend (Express.js)

**Stack:** React Vite · Express.js (Node 20-alpine) · Docker Compose

## What this phase teaches

| Topic | Where to see it |
|---|---|
| Dockerizing Express.js with `node:20-alpine` | `api/Dockerfile` |
| `NODE_ENV` and `PORT` env vars | `docker-compose.yml` → `environment:` |
| `HEALTHCHECK` on the API container | `api/Dockerfile` → `HEALTHCHECK` directive |
| CORS for cross-container communication | `api/server.js` → `cors()` middleware |
| Non-root user in both containers | Both Dockerfiles → `adduser` + `USER` |
| `depends_on: condition: service_healthy` | `docker-compose.yml` → `frontend` service |
| Full CRUD in-memory API | `api/server.js` — GET / POST / PUT / DELETE `/products` |

## Quick start

```bash
cp .env.example .env
docker compose up -d --build
```

- Frontend: <http://localhost:3000>
- API health: <http://localhost:3001/health>

## Stopping

```bash
docker compose down
```

## Docker Desktop walkthrough

### Containers panel → API → Logs tab
Watch the Node.js startup message `product-api listening on port 3001`.
CLI equivalent:
```bash
docker compose logs -f api
```

### Containers panel → API → Stats tab
Observe Node.js memory usage. Compare it to the Nginx frontend container — Node uses significantly more RAM even at idle.
CLI equivalent:
```bash
docker stats
```

### Containers panel → API → Exec tab
Run these inside the API container to verify the setup:
```sh
whoami           # should print: appuser (non-root)
env              # shows NODE_ENV, PORT injected at runtime
wget -qO- http://localhost:3001/health
```
CLI equivalent:
```bash
docker exec -it phase6-api /bin/sh
```

### Health status column
Once the `HEALTHCHECK` is configured, the Containers panel shows `healthy` / `starting` / `unhealthy` in real time.
CLI equivalent:
```bash
docker ps   # STATUS column
```

## Why in-memory?

The product list resets every time the API container restarts. This is intentional — it illustrates the need for a database, which is introduced in Phase 7.

## Manual `docker run` vs `docker-compose.yml`

| Phase 3 (manual) | Phase 6 (Compose) |
|---|---|
| `docker network create phase3-net` | `networks: phase6-net:` (auto-created) |
| `docker run -e PORT=3001 ... api` | `environment: PORT: 3001` under `api:` |
| `docker run --network phase3-net ...` | `networks: - phase6-net` under each service |
| `docker run -p 3000:80 frontend` | `ports: - "3000:80"` under `frontend:` |
| Wait manually before starting frontend | `depends_on: api: condition: service_healthy` |

## Completion checklist

- [ ] `docker ps` shows both containers with status `healthy`
- [ ] Docker Desktop Containers panel shows green `healthy` badge on the API container
- [ ] React frontend performs full CRUD (add, edit, delete) against the Express.js API
- [ ] `whoami` in Exec tab returns `appuser` for both containers
- [ ] Image sizes: frontend < 50 MB, API < 60 MB (visible in Images panel)
