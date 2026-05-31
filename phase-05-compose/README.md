# Phase 5 — Docker Compose

## What this phase teaches

Docker Compose lets you define an entire multi-container application in a single `docker-compose.yml` file — services, networks, volumes, environment variables, health checks, and startup order — then bring it all up with one command. This phase replaces all the manual `docker run`, `docker network create`, and `docker volume create` commands from Phases 3 and 4 with a declarative YAML file. You will also use **Docker Compose Watch** for hot-reload during development, and see how Docker Desktop groups all Compose services under a single collapsible app entry.

## Prerequisites

- Phases 3 and 4 complete (networking, volumes, manual `docker run` wiring)
- Docker Desktop running with WSL2 backend
- Docker Compose v2 (included with Docker Desktop — verify with `docker compose version`)

## Estimated effort

3 days — Week 3 of the overall plan

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Docker Compose project: phase-05-compose                               │
│  Network: phase5-net (bridge, auto-created by Compose)                  │
│                                                                         │
│  ┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │  frontend        │    │  api              │    │  redis           │  │
│  │  nginx:stable-   │    │  node:20-alpine   │    │  redis:7-alpine  │  │
│  │  alpine          │    │  port 3001        │    │  port 6379       │  │
│  │  port 80         │    │  REDIS_URL →      │    │  healthcheck:    │  │
│  │  non-root        │    │  redis:6379       │    │  redis-cli ping  │  │
│  └────────┬─────────┘    └────────┬──────────┘    └────────┬─────────┘ │
│           │  depends_on: api      │  depends_on: redis      │           │
│           │  (service_healthy)    │  (service_healthy)      │           │
│           └──────────────────────┴────────────────────────-┘           │
└───────────────────┬─────────────────────────────────────────────────────┘
                    │  host port mapping
         ┌──────────┴───────────────────┐
         │ localhost:3000 → frontend:80  │
         │ localhost:3001 → api:3001     │
         └──────────────────────────────┘
                    │
                 Browser
```

**Startup order enforced by `depends_on`:**
```
redis (healthy) → api (healthy) → frontend (starts)
```

## Folder structure

```
phase-05-compose/
├── api/
│   ├── server.js           # Express — products + Redis-backed cart
│   ├── package.json
│   ├── Dockerfile
│   ├── .dockerignore
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   └── App.jsx         # Product grid + cart panel; cart backed by Redis
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── nginx.conf
│   ├── Dockerfile          # Three stages: dev / build / serve
│   ├── .dockerignore
│   └── .gitignore
├── docker-compose.yml       # Production: Nginx serves built frontend
├── docker-compose.watch.yml # Dev override: Vite dev server + hot-reload
├── .env                     # Environment variables (git-ignored)
├── .env.example             # Safe template to commit
├── .gitignore
└── README.md
```

## Phase 3 vs Phase 5 — why Compose exists

| Phase 3 (manual) | Phase 5 (Compose) |
|------------------|-------------------|
| `docker network create phase3-net` | Declared in `networks:` — auto-created |
| `docker run -d --name product-api --network phase3-net -p 3001:3001 ...` | Declared as a `service:` in YAML |
| `docker run -d --name frontend --network phase3-net -p 3000:80 ...` | Declared as a `service:` in YAML |
| Manual startup order — you must remember which to start first | `depends_on: condition: service_healthy` enforces order |
| Env vars passed as `-e KEY=VALUE` flags per `docker run` | Declared in `environment:` or loaded from `.env` file |
| 6 shell commands to bring up 2 containers | `docker compose up -d` |
| 4 shell commands to tear down | `docker compose down` |

## Quick start

Run all commands from your **WSL2 terminal** inside `phase-05-compose/`.

```bash
# ── 1. Copy the env file ──────────────────────────────────────────────────────
cp .env.example .env
# Edit .env if needed (defaults work out of the box)

# ── 2. Build images and start all services ────────────────────────────────────
docker compose up -d --build

# ── 3. Watch startup order (redis → api → frontend) ──────────────────────────
docker compose ps
# redis     running (healthy)
# api       running (healthy)
# frontend  running

# ── 4. Verify services ────────────────────────────────────────────────────────
curl http://localhost:3001/health
# {"status":"ok","service":"product-api"}

curl http://localhost:3001/products
# JSON array of 5 products

# Open in browser: http://localhost:3000
# Product grid + cart panel — add items, they are stored in Redis

# ── 5. Prove Redis persistence across API restart ─────────────────────────────
# Add items to the cart via the browser first, then:
docker compose restart api
# Wait ~5 seconds for the API to reconnect to Redis
curl http://localhost:3001/cart/demo-session-1
# Cart items are still there ✅

# ── 6. View live logs for all services ────────────────────────────────────────
docker compose logs -f
# Ctrl+C to stop streaming

# View a single service's logs
docker compose logs -f api

# ── 7. Exec into the API container ────────────────────────────────────────────
docker compose exec api sh
# Inside: whoami → appuser, env → see REDIS_URL injected from .env
exit

# ── 8. Exec into Redis and check stored cart keys ─────────────────────────────
docker compose exec redis redis-cli
# KEYS cart:*
# GET cart:demo-session-1
exit

# ── 9. Scale the API to 2 replicas ────────────────────────────────────────────
# Note: remove the container_name from api service first if you want to scale
docker compose up -d --scale api=2
docker compose ps
# Both api instances listed

# ── 10. Tear down (keep volumes) ──────────────────────────────────────────────
docker compose down

# Tear down and remove volumes
docker compose down -v
```

## Docker Compose Watch (hot-reload development)

Compose Watch syncs file changes into running containers without a full rebuild.

```bash
# Start the dev stack with hot-reload
docker compose -f docker-compose.yml -f docker-compose.watch.yml watch

# Frontend runs on Vite dev server (port 5173) with HMR
# Edit frontend/src/App.jsx → browser updates instantly
# Edit api/server.js → API container restarts automatically

# Open in browser: http://localhost:5173  (dev, with HMR)
# API still at:    http://localhost:3001
```

## Commands reference

### Build & Lifecycle

| Command | What it does | When to use it |
|---------|-------------|----------------|
| `docker compose up -d --build` | Build all images and start all services in background | First run or after Dockerfile changes |
| `docker compose up -d` | Start all services (uses cached images) | Subsequent starts |
| `docker compose down` | Stop and remove containers and networks; volumes survive | Clean teardown without losing data |
| `docker compose down -v` | Stop and remove containers, networks, **and volumes** | Full reset — destroys all data |
| `docker compose restart api` | Restart a single service | After config changes |
| `docker compose build api` | Rebuild a single service image | After editing `api/server.js` or `api/Dockerfile` |
| `docker compose pull` | Pull latest base images | Keeping images up to date |

### Inspect

| Command | What it does | When to use it |
|---------|-------------|----------------|
| `docker compose ps` | List services with status and ports | Quick health overview |
| `docker compose logs -f` | Stream logs from all services | Debugging startup or runtime errors |
| `docker compose logs -f api` | Stream logs from the API only | Focused debugging |
| `docker compose top` | Show running processes inside each service container | Verify non-root user |
| `docker compose exec api sh` | Open a shell in the running API container | Interactive debugging |
| `docker compose exec redis redis-cli` | Open Redis CLI inside the Redis container | Inspect cart keys |
| `docker compose config` | Print the resolved Compose config (with `.env` substituted) | Verify env var interpolation |

### Watch

| Command | What it does |
|---------|-------------|
| `docker compose -f docker-compose.yml -f docker-compose.watch.yml watch` | Start all services with Compose Watch hot-reload |

## Core concepts explained

### Service discovery by service name

Every service in a Compose file can reach any other service by its **service name** as a DNS hostname. Compose automatically connects all services to a shared network and registers them with the embedded DNS server.

```yaml
# In docker-compose.yml:
environment:
  REDIS_URL: redis://redis:6379   # "redis" is the service name — resolves to the Redis container IP
```

This is the same container DNS from Phase 3, but Compose creates the network and registers all services automatically.

### `depends_on` with `condition: service_healthy`

Without `depends_on`, Compose starts all services in parallel. With `condition: service_healthy`, Compose waits for the dependency's `healthcheck` to return healthy before starting the dependent service.

```yaml
api:
  depends_on:
    redis:
      condition: service_healthy   # Wait until redis-cli ping returns PONG
```

This prevents the API from crashing on startup because Redis isn't ready yet — a very common production problem.

### Environment variables via `.env` file

Compose automatically loads a `.env` file in the same directory as `docker-compose.yml`. Values are substituted wherever `${VAR}` appears in the YAML.

```yaml
environment:
  PORT: ${PORT:-3001}   # Uses .env value; falls back to 3001 if not set
```

**Never commit `.env` to git** — it may contain secrets. Commit `.env.example` as a safe template.

To verify what Compose resolves: `docker compose config` — it prints the YAML with all variables substituted.

### Compose Watch (`develop.watch`)

Compose Watch (Docker Compose v2.22+) monitors files and performs one of three actions when they change:

| Action | Effect | Use case |
|--------|--------|---------|
| `sync` | Copies changed files into the running container without restart | Source code changes when the app hot-reloads itself (Vite HMR, nodemon) |
| `rebuild` | Rebuilds the image and recreates the container | `package.json` or `Dockerfile` changes |
| `sync+restart` | Syncs files then restarts the container | Config files that require a process restart |

## Docker Desktop — what to watch in this phase

### Step-by-step GUI actions

```
1. Run: docker compose up -d --build
   Docker Desktop → Containers panel
   All three services appear grouped under a single collapsible entry named
   after the project folder "phase-05-compose"
   Expand the group to see: phase5-redis, phase5-api, phase5-frontend
   CLI equivalent: docker compose ps

2. Containers panel → expand phase-05-compose group
   Watch the status badges update as services come healthy one by one:
   redis → healthy first, then api → healthy, then frontend → running
   This visually confirms depends_on is enforcing startup order
   CLI equivalent: docker compose ps (refresh)

3. Containers panel → phase5-api → "Logs" tab
   See the startup messages: "Connected to Redis" and "product-api listening on port 3001"
   If Redis was not ready, you'd see a connection error here
   CLI equivalent: docker compose logs -f api

4. Containers panel → phase5-api → "Stats" tab
   Live CPU % and memory usage for the Node.js API
   Compare it to phase5-frontend (Nginx) — Node uses significantly more memory
   CLI equivalent: docker stats phase5-api

5. Containers panel → phase5-api → "Inspect" tab → scroll to "Env"
   Confirm REDIS_URL, PORT, and NODE_ENV are injected from .env
   The values should NOT be hardcoded in the image — only injected at runtime
   CLI equivalent: docker inspect phase5-api --format '{{json .Config.Env}}'

6. Add items to the cart in the browser (http://localhost:3000)
   Containers panel → phase5-api → "Logs" tab
   Confirm POST /cart/demo-session-1 requests appear
   CLI equivalent: docker compose logs -f api

7. Containers panel → expand group → click the ▶ / ■ buttons on the GROUP ROW
   This starts/stops the ENTIRE Compose stack with one click
   CLI equivalent: docker compose up -d / docker compose down

8. Containers panel → phase5-redis → "Exec" tab
   Type: redis-cli KEYS cart:*
   See the cart key stored by the API
   Type: redis-cli GET cart:demo-session-1
   See the JSON cart contents
   CLI equivalent: docker compose exec redis redis-cli KEYS cart:*
```

### Docker Desktop tips for Phase 5

- **Compose app grouping** is the headline feature for this phase. One project folder = one collapsible group in the Containers panel. You can start, stop, and delete the entire stack using the group-level buttons — no more hunting for individual container names.
- Use the **search bar** at the top of the Containers panel to filter by service name when you have multiple Compose stacks running simultaneously.
- The **Stats tab** per service is your first exposure to comparing container resource profiles. Node.js vs Nginx is a striking visual difference — save a screenshot for your README.
- After `docker compose down`, the Compose group disappears from the Containers panel entirely. After `docker compose up`, it reappears. This is the cleanest visual demonstration of Compose lifecycle management.

### What Docker Desktop cannot do in Phase 5

- Docker Desktop **cannot run `docker compose watch`** from the GUI. The `watch` command is CLI-only.
- Docker Desktop **cannot show the resolved Compose config** (what `docker compose config` outputs). Use the terminal to verify `.env` substitution.
- Docker Desktop **cannot create a Compose stack** from scratch — it can only display and manage existing ones that were started via the CLI.

## Validation checklist

### Via CLI

- [ ] `docker compose up -d --build` starts all three services without errors
- [ ] `docker compose ps` shows `redis` and `api` as `healthy`, `frontend` as `running`
- [ ] `curl http://localhost:3001/health` returns `{"status":"ok","service":"product-api"}`
- [ ] `curl http://localhost:3001/products` returns 5 products
- [ ] Adding items to the cart via browser works; `curl http://localhost:3001/cart/demo-session-1` returns them
- [ ] Cart persists after `docker compose restart api` — items still in Redis
- [ ] `docker compose exec api whoami` returns `appuser`
- [ ] `docker compose exec redis redis-cli KEYS cart:*` shows the cart key
- [ ] `docker compose logs -f api` streams live API logs
- [ ] `docker compose down` removes all containers and the network cleanly

### Via Docker Desktop

- [ ] All three services appear grouped under `phase-05-compose` in Containers panel
- [ ] Startup order visible: redis healthy → api healthy → frontend running
- [ ] Group-level ▶/■ buttons start/stop the entire stack
- [ ] `phase5-api` → Inspect → Env shows `REDIS_URL`, `PORT`, `NODE_ENV` from `.env`
- [ ] `phase5-api` → Stats tab shows live Node.js memory usage
- [ ] `phase5-redis` → Exec tab → `redis-cli KEYS cart:*` returns cart key after adding items
- [ ] After `docker compose down`, the Compose group disappears from Containers panel

## Completion criteria (pass/fail)

| Criterion | How to verify |
|-----------|--------------|
| `docker compose up -d` starts all three services | `docker compose ps` shows all running |
| Frontend fetches products from API using service name (not `localhost`) | Confirmed by `REDIS_URL: redis://redis:6379` in API env and working cart |
| Redis stores cart value; cart survives API container restart | `docker compose restart api` then `curl /cart/demo-session-1` returns same items |
| `docker compose watch` hot-reloads frontend on source change | Edit `App.jsx`, browser updates without manual rebuild |
| All three containers green in Docker Desktop Compose group | Containers panel group shows all healthy/running |
| `docker compose down -v` cleanly removes everything | Group disappears from Desktop; `docker compose ps` returns empty |

## Exercises

1. **Startup order violation (CLI):** Edit `docker-compose.yml` and remove `depends_on` from the `api` service. Run `docker compose up -d`. Watch `docker compose logs api` — you may see Redis connection errors during startup as Node tries to connect before Redis is ready. Restore `depends_on` and compare. This demonstrates why health-check-based ordering matters.

2. **Env var inspection (Docker Desktop):** Change `NODE_ENV=development` in `.env` and run `docker compose up -d --build`. Open Docker Desktop → Containers → `phase5-api` → Inspect → Env. Confirm `NODE_ENV=development` is visible there but NOT baked into the image layers (check Image layers tab — no env layer added). Then change it back to `production` and restart: `docker compose up -d` (no rebuild needed — env vars are injected at runtime, not bake-time).

3. **Scale the API (CLI + Docker Desktop):** Remove `container_name: phase5-api` from `docker-compose.yml`, then run `docker compose up -d --scale api=2`. Open Docker Desktop Containers panel — both `phase-05-compose-api-1` and `phase-05-compose-api-2` appear inside the group. Both serve requests to `localhost:3001` via Docker's built-in load balancer. Scale back with `docker compose up -d --scale api=1`.

## Common mistakes in this phase

| Symptom | Cause | Fix |
|---------|-------|-----|
| API crashes on startup with "Redis connection refused" | `depends_on` missing or set to `condition: service_started` instead of `service_healthy` | Use `condition: service_healthy` and ensure Redis has a `healthcheck` |
| `${PORT}` appears literally in `docker compose config` output | `.env` file not in the same directory as `docker-compose.yml` | Ensure `.env` is in `phase-05-compose/`, not a subdirectory |
| Cart is empty after `docker compose restart api` | `REDIS_URL` is pointing to `localhost` instead of the service name | Set `REDIS_URL=redis://redis:6379` in `.env` |
| `docker compose down -v` deleted all cart data | `-v` flag removes volumes — expected behaviour | Use `docker compose down` (without `-v`) to preserve data |
| `VITE_API_URL` is `redis://redis:6379` in the browser | `.env` values copy-pasted incorrectly | `VITE_API_URL` must be `http://localhost:3001` — the browser address, not the internal Redis URL |
| Compose Watch not available | Docker Compose v2.22+ required | Run `docker compose version` — update Docker Desktop if below 2.22 |
| Frontend shows blank page after `docker compose up` | API not healthy yet when frontend started — race condition | Ensure `frontend.depends_on.api.condition = service_healthy` |

## Windows / WSL2 notes

- Run all `docker compose` commands from the **WSL2 terminal**. The `docker-compose.yml` file uses Linux-style paths internally — this works correctly from WSL2.
- The `.env` file is read by Compose from the directory where you run the command. If you run from a different directory with `-f`, the `.env` path may not resolve correctly. Always `cd` into `phase-05-compose/` first.
- `docker compose watch` requires that the WSL2 filesystem watcher is active. If file changes are not detected, verify your WSL2 distro is using kernel 5.15+ (`uname -r` in WSL2 terminal).
- Port `3000` and `3001` on `localhost` in a Windows browser will work — Docker Desktop bridges WSL2 VM ports to the Windows host automatically.

## Cleanup

### CLI

```bash
# Stop and remove containers + network (volumes survive)
docker compose down

# Stop and remove everything including volumes
docker compose down -v --remove-orphans

# Remove built images
docker rmi phase-05-compose-api phase-05-compose-frontend 2>/dev/null; true

# One-liner full reset
docker compose down -v --remove-orphans && \
docker rmi phase-05-compose-api phase-05-compose-frontend 2>/dev/null; \
echo "Phase 5 cleaned up"
```

### Docker Desktop

1. Containers panel → `phase-05-compose` group → ■ Stop (stops all services)
2. Containers panel → `phase-05-compose` group → trash icon (Delete — removes all containers)
3. Images panel → `phase-05-compose-api` → three-dot → Remove
4. Images panel → `phase-05-compose-frontend` → three-dot → Remove

## Cheat sheet

| Task | CLI | Docker Desktop |
|------|-----|----------------|
| Start all services | `docker compose up -d` | Containers → group → ▶ button |
| Stop all services | `docker compose down` | Containers → group → ■ button |
| Rebuild and start | `docker compose up -d --build` | N/A — CLI only |
| View all service status | `docker compose ps` | Containers panel → expand group |
| Stream all logs | `docker compose logs -f` | Containers → service → Logs tab |
| Stream one service logs | `docker compose logs -f api` | Containers → phase5-api → Logs tab |
| Exec into service | `docker compose exec api sh` | Containers → phase5-api → Exec tab |
| Check env vars | `docker compose exec api env` | Containers → phase5-api → Inspect → Env |
| Restart one service | `docker compose restart api` | Containers → phase5-api → restart icon |
| Check resolved config | `docker compose config` | N/A — CLI only |
| Hot-reload dev mode | `docker compose -f docker-compose.yml -f docker-compose.watch.yml watch` | N/A — CLI only |

## Interview questions

**Q1: What problem does Docker Compose solve that manual `docker run` commands do not?**
`docker run` commands are imperative and stateless — you must remember the exact flags, order, and dependencies every time. Compose is declarative: the `docker-compose.yml` file is the source of truth for the entire stack. It handles network creation, volume creation, environment injection, startup ordering, and health checks — all reproducible with a single `docker compose up`. It also makes the stack portable: anyone who clones the repo can run it identically.

**Q2: What is `depends_on: condition: service_healthy` and why is `condition: service_started` insufficient?**
`condition: service_started` waits only until the dependency container has started (the process is running). It does not wait for the application inside to be ready. `condition: service_healthy` waits until the container's `healthcheck` command passes — meaning the application is actually accepting connections. For databases and caches, the container starts in milliseconds but the service takes seconds to initialise. Using `service_started` causes race conditions where the dependent service starts before Redis or the database is ready.

**Q3: How does Compose inject environment variables without baking them into the image?**
Compose reads the `.env` file and substitutes `${VAR}` placeholders in the YAML. At runtime, `docker compose up` passes the resolved values to each container's environment via `docker run -e KEY=VALUE`. The values exist only in the running container's process environment — not in any image layer. You can verify this with `docker compose config` (see substituted values) and `docker inspect` (see them in the container's `Env` array but not in the image's `Config`).

**Q4: What is the difference between `docker compose down` and `docker compose down -v`?**
`docker compose down` stops and removes the containers and networks created by Compose, but leaves named volumes intact — data is preserved. `docker compose down -v` additionally removes all named volumes declared in the `volumes:` section of the Compose file, permanently deleting the data. In production, always use `down` for redeployments. Use `down -v` only when you explicitly want to wipe all data (e.g. resetting a test environment).

**Q5: How does Compose Watch differ from bind-mounting source code?**
Bind mounts expose a host directory into the container at startup — the container always reads from the host path, so changes are immediate but I/O performance on Windows (NTFS ↔ WSL2 translation) is slow. Compose Watch runs as a separate process that monitors files on the host and pushes changes into the container via targeted sync, rebuild, or restart actions. It is smarter: it can trigger a full rebuild when `package.json` changes but just sync files when source code changes, and it works efficiently on Windows/WSL2 without the NTFS performance penalty of bind mounts.

## Next phase

Phase 6 adds a real backend: an Express.js API with in-memory CRUD, a `HEALTHCHECK` instruction in the Dockerfile, and full CORS configuration — connecting the React frontend and the API via a Compose stack.
