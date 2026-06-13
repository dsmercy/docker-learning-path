# Phase 8 — Production Dockerfiles

**Stack:** React Vite · Express.js (Node 20-alpine) · MongoDB 7 · Local Registry

## What this phase teaches

No new application features — this phase is about Docker image optimization.

| Topic | Where to see it |
|---|---|
| Multi-stage API Dockerfile (deps → production) | `api/Dockerfile` |
| Multi-stage frontend Dockerfile (build → serve) | `frontend/Dockerfile` |
| Non-root users in every container | Both Dockerfiles → `adduser` + `USER` |
| `HEALTHCHECK` on API | `api/Dockerfile` |
| Local Docker registry at `localhost:5000` | `docker-compose.yml` → `registry` service |
| `.dockerignore` audit | `api/.dockerignore`, `frontend/.dockerignore` |

## Image size comparison

| Service | Dev image (Phase 7) | Prod image (Phase 8) | Saving |
|---|---|---|---|
| Frontend | ~350 MB | ~25 MB | ~93% |
| API | ~250 MB | ~75 MB | ~70% |

*(Fill in actual numbers after building — use `docker images \| grep phase8`)*

## Quick start

```bash
cp .env.example .env
docker compose up -d --build
```

- Frontend: <http://localhost:3000>
- API health: <http://localhost:3001/health>
- Local registry: <http://localhost:5000/v2/_catalog>

## Local registry workflow

```bash
# 1. Tag the images for the local registry
docker tag phase8-api:latest     localhost:5000/phase8-api:latest
docker tag phase8-frontend:latest localhost:5000/phase8-frontend:latest

# 2. Push to the local registry
docker push localhost:5000/phase8-api:latest
docker push localhost:5000/phase8-frontend:latest

# 3. Verify via the registry catalog API
curl http://localhost:5000/v2/_catalog

# 4. Pull back from the registry (proves the push worked)
docker pull localhost:5000/phase8-api:latest
```

After pushing, both `localhost:5000/phase8-api:latest` and `localhost:5000/phase8-frontend:latest`
appear as separate rows in Docker Desktop → Images panel.

## Image size comparison workflow (Docker Desktop)

1. Build the Phase 7 app and tag as dev:
   ```bash
   docker tag phase7-api:latest     phase8-api:dev
   docker tag phase7-frontend:latest phase8-frontend:dev
   ```
2. Build Phase 8 (already tagged as `phase8-api:latest` / `phase8-frontend:latest`)
3. Open Docker Desktop → Images panel — both `:dev` and `:latest` rows visible side-by-side
4. Click any image → **Image layers** tab to compare layer count

## Docker Desktop walkthrough

### Images panel — size comparison
Both dev and prod tags appear as separate rows with sizes shown.
CLI equivalent:
```bash
docker images | grep phase8
```

### Images → Image layers tab
Prod image has far fewer layers than dev — no SDK, no devDependencies, no source files.
CLI equivalent:
```bash
docker history phase8-api:latest
```

### Images → Docker Scout tab
First CVE scan exposure. Compare dev vs prod image vulnerability counts.
CLI equivalent:
```bash
docker scout cves phase8-api:latest
```

## Completion checklist

- [ ] Frontend image < 30 MB — visible in Images panel
- [ ] API image < 60 MB — visible in Images panel
- [ ] `whoami` in Exec tab returns non-root for both containers
- [ ] Local registry running at `localhost:5000`; images pushed and pulled
- [ ] Layer count lower in prod vs dev — confirmed in Image layers tab
- [ ] `HEALTHCHECK` passes — green badge in Containers panel
