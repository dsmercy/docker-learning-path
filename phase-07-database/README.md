# Phase 7 — Database Containers (MongoDB)

**Stack:** React Vite · Express.js (Node 20-alpine) · MongoDB 7

## What this phase teaches

| Topic | Where to see it |
|---|---|
| MongoDB container configuration | `docker-compose.yml` → `db` service |
| Connection strings via env vars (Mongoose) | `api/server.js` → `MONGODB_URI` |
| Seed data on container start | `mongo-init/seed.js` → mounted into `/docker-entrypoint-initdb.d/` |
| Named volume for MongoDB data directory | `docker-compose.yml` → `volumes: mongo-data:` |
| `mongosh` health check on the DB container | `docker-compose.yml` → `db.healthcheck` |
| `depends_on: condition: service_healthy` | `docker-compose.yml` → `api` and `frontend` services |

## Quick start

```bash
cp .env.example .env
docker compose up -d --build
```

- Frontend: <http://localhost:3000>
- API health: <http://localhost:3001/health>

## Stopping

```bash
# Keep the volume (data survives):
docker compose down

# Remove everything including the volume:
docker compose down -v
```

## Verify data persistence

```bash
# Add a product via the UI, then:
docker compose down
docker compose up -d

# Product is still there — stored in the named volume, not the container layer
```

## Docker Desktop walkthrough

### Containers panel → db → Logs tab
Watch the MongoDB init log — look for the line:
```
Waiting for connections
```
This is the signal that the health check will start returning `ok`.
CLI equivalent:
```bash
docker compose logs -f db
```

### Volumes panel → mongo-data → Data tab
Browse the MongoDB data directory (`/data/db`) visually.
After seeding, the directory is populated. After `docker compose down` + `docker compose up`, data is still there.
CLI equivalent:
```bash
docker run --rm -v phase-07-database_mongo-data:/data alpine ls /data
```

### Containers panel → db → Exec tab
Open a terminal into the MongoDB container and query the seed data:
```js
mongosh products --eval "db.products.find().pretty()"
```
CLI equivalent:
```bash
docker exec -it phase7-db mongosh
```

### Containers panel → api → Inspect tab
Look for `MONGODB_URI` in the environment variables section.
It should point to `mongodb://db:27017/products` — the MongoDB **service name** (`db`), not `localhost`.
CLI equivalent:
```bash
docker inspect phase7-api --format '{{json .Config.Env}}'
```

## How the seed script works

`mongo-init/seed.js` is mounted read-only into `/docker-entrypoint-initdb.d/`.
MongoDB runs every `*.js` file in that directory **only on the first container start** (when the data directory is empty).
On subsequent starts the data directory already has data, so the seed is skipped — your edits are preserved.

## Completion checklist

- [ ] Products survive `docker compose down` + `docker compose up` — verify in Volumes panel Data tab AND via `mongosh` query
- [ ] Seed script runs automatically on first container start (5 products visible immediately)
- [ ] MongoDB container shows `healthy` in Docker Desktop before API container starts
- [ ] API container shows `healthy` in Docker Desktop Containers panel
- [ ] `docker exec` into MongoDB (Exec tab or CLI) and query the products collection
- [ ] `MONGODB_URI` in API Inspect tab points to `db` service name, not `localhost`
