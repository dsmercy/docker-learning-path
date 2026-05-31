# Phase 3 — Docker Networking

## What this phase teaches

You will connect two containers — a React frontend and an Express.js mock API — using a custom Docker bridge network. No Docker Compose yet: every command is typed manually so you can see exactly what Compose automates for you in Phase 5. The key insight is **container DNS**: on a custom bridge network, containers reach each other by their `--name`, not by IP address. You will also learn why the default `bridge` network does **not** support container-name DNS resolution.

## Prerequisites

- Phase 2 complete (Dockerfile authoring, image layers, `.dockerignore`)
- Docker Desktop running with WSL2 backend

## Estimated effort

2–3 days — Week 2 of the overall plan

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Custom bridge network: phase3-net                              │
│                                                                 │
│  ┌──────────────────────────┐    ┌───────────────────────────┐  │
│  │  frontend                │    │  product-api              │  │
│  │  nginx:stable-alpine     │    │  node:20-alpine           │  │
│  │  port 80 (internal)      │    │  port 3001 (internal)     │  │
│  │  non-root: appuser       │    │  non-root: appuser        │  │
│  └────────────┬─────────────┘    └──────────────┬────────────┘  │
│               │  DNS: product-api:3001           │               │
│               └─────────────────────────────────┘               │
└────────────────────────┬────────────────────────────────────────┘
                         │  host port mapping
              ┌──────────┴──────────────────┐
              │ localhost:3000 → frontend:80 │
              │ localhost:3001 → api:3001    │
              └─────────────────────────────┘
                         │
                      Browser
                 http://localhost:3000
```

> **Important — two layers of networking:**
> The frontend container fetches products at *build time* the `VITE_API_URL` is baked into
> the JS bundle. Since the bundle runs in the **user's browser** (not inside Docker), it
> must use `localhost:3001` — not the container DNS name `product-api`.
> Container-to-container DNS (`product-api:3001`) is used when one *server process* calls
> another server process inside the network (you will see this in Phase 5+ with SSR or
> backend-to-backend calls).

## Folder structure

```
phase-03-networking/
├── api/
│   ├── server.js          # Express.js — GET /products, GET /health
│   ├── package.json
│   ├── Dockerfile         # node:20-alpine, non-root appuser
│   ├── .dockerignore
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   └── App.jsx        # Fetches from API_URL env var
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── nginx.conf
│   ├── Dockerfile         # Two-stage; VITE_API_URL build arg
│   ├── .dockerignore
│   └── .gitignore
└── README.md
```

## Quick start

Run all commands from your **WSL2 terminal**.

```bash
# ── 1. Build images ───────────────────────────────────────────────────────────
docker build -t phase3-api:latest ./api

# VITE_API_URL must be a host-visible address because the JS bundle runs in the browser
docker build \
  --build-arg VITE_API_URL=http://localhost:3001 \
  -t phase3-frontend:latest \
  ./frontend

# ── 2. Create the custom bridge network ──────────────────────────────────────
docker network create phase3-net

# Verify it was created
docker network ls | grep phase3-net

# ── 3. Run the API container on the custom network ───────────────────────────
docker run -d \
  --name product-api \
  --network phase3-net \
  -p 3001:3001 \
  phase3-api:latest

# Verify the API is healthy
curl http://localhost:3001/health
# Expected: {"status":"ok","service":"product-api","timestamp":"..."}

curl http://localhost:3001/products
# Expected: JSON array of 5 products

# ── 4. Run the frontend container on the same network ─────────────────────────
docker run -d \
  --name frontend \
  --network phase3-net \
  -p 3000:80 \
  phase3-frontend:latest

# ── 5. Verify both containers are on the network ─────────────────────────────
docker network inspect phase3-net

# ── 6. Prove container DNS (optional but recommended) ────────────────────────
# Exec into the frontend container and resolve the API by its container name
docker exec frontend wget -qO- http://product-api:3001/health
# Expected: {"status":"ok",...}  — resolved by container DNS, not IP

# ── 7. Open in browser ────────────────────────────────────────────────────────
# http://localhost:3000  →  product grid fetched live from the API container
```

## Commands reference

### Build

| Command | What it does | When to use it |
|---------|-------------|----------------|
| `docker build -t phase3-api:latest ./api` | Builds the API image from `./api/Dockerfile` | After editing API source |
| `docker build --build-arg VITE_API_URL=http://localhost:3001 -t phase3-frontend:latest ./frontend` | Builds frontend image, baking the API URL into the JS bundle | After editing frontend source or changing API URL |

### Network

| Command | What it does | When to use it |
|---------|-------------|----------------|
| `docker network create phase3-net` | Creates a named custom bridge network | Once, before running containers |
| `docker network ls` | Lists all networks | Verify the network exists |
| `docker network inspect phase3-net` | Shows subnet, gateway, and connected containers with IPs | Debugging connectivity |
| `docker network connect phase3-net <container>` | Attaches an already-running container to a network | Adding a container post-start |
| `docker network disconnect phase3-net <container>` | Detaches a container from a network | Isolating a container |
| `docker network rm phase3-net` | Removes the network (containers must be removed first) | Cleanup |

### Run / Inspect

| Command | What it does | When to use it |
|---------|-------------|----------------|
| `docker run -d --name product-api --network phase3-net -p 3001:3001 phase3-api:latest` | Starts the API container on the custom network | First run |
| `docker run -d --name frontend --network phase3-net -p 3000:80 phase3-frontend:latest` | Starts the frontend container on the same network | After API is running |
| `docker ps` | Lists running containers with ports | Sanity check |
| `docker port product-api` | Shows host↔container port mapping for the API | Verify `-p` flag worked |
| `docker inspect product-api` | Full JSON metadata including network info | Deep debugging |
| `docker exec frontend wget -qO- http://product-api:3001/health` | Tests container-to-container DNS from inside the frontend | Prove DNS works |
| `docker logs product-api` | Streams API logs | Debugging API errors |

### Clean

| Command | What it does |
|---------|-------------|
| `docker stop frontend product-api` | Stops both containers |
| `docker rm frontend product-api` | Removes stopped containers |
| `docker network rm phase3-net` | Removes the custom network |
| `docker rmi phase3-frontend:latest phase3-api:latest` | Removes both images |

## Core concepts explained

### Custom bridge network vs default bridge

Docker creates a network called `bridge` automatically. Containers on the **default bridge** can reach each other by IP but **cannot resolve each other by name**. This is a deliberate limitation.

When you create a **custom bridge network** (`docker network create`), Docker automatically enables an **embedded DNS server** for that network. Containers on the same custom network can resolve each other using their `--name` as a hostname.

```
Default bridge:   container A pings 172.17.0.3   ✅ works (by IP)
Default bridge:   container A pings product-api  ❌ fails (no DNS)

Custom bridge:    container A pings 172.18.0.3   ✅ works (by IP)
Custom bridge:    container A pings product-api  ✅ works (DNS resolves)
```

### Port mapping (`-p host:container`)

`-p 3001:3001` tells Docker: "forward TCP traffic arriving at port 3001 on the host to port 3001 inside the container."

- The **host port** is what you use in your browser (`localhost:3001`).
- The **container port** is what the process inside the container listens on.
- They do not need to match. `-p 9000:3001` would expose the API at `localhost:9000`.

### Container DNS — two audiences

| Traffic direction | Who initiates | What hostname to use |
|-------------------|--------------|---------------------|
| Browser → API | User's browser (outside Docker) | `localhost:3001` (host port) |
| Container → container | Server process inside Docker | `product-api:3001` (container name) |

This is why `VITE_API_URL=http://localhost:3001` is correct for this phase: Vite bakes the URL into a JS bundle that runs in the browser, not inside the container.

### Why `--name` matters

Without `--name`, Docker assigns a random name like `inspiring_hopper`. Container DNS uses the `--name` value as the hostname, so naming containers consistently is essential for reproducible networking.

## Docker Desktop — what to watch in this phase

### Step-by-step GUI actions

```
1. Before creating the custom network:
   Docker Desktop → Networks panel (left sidebar)
   Observe the three default networks: bridge, host, none
   CLI equivalent: docker network ls

2. Run: docker network create phase3-net
   Networks panel refreshes — phase3-net appears instantly with driver "bridge"
   CLI equivalent: docker network ls | grep phase3-net

3. Networks panel → click phase3-net
   See: subnet (e.g. 172.18.0.0/16), gateway (172.18.0.1), connected containers (empty so far)
   CLI equivalent: docker network inspect phase3-net

4. Start both containers, then return to Networks panel → phase3-net
   Now the connected containers section lists both "frontend" and "product-api"
   with their assigned internal IP addresses
   CLI equivalent: docker network inspect phase3-net

5. Containers panel → click "product-api" → "Ports" tab
   Shows host:container mapping: 0.0.0.0:3001 → 3001/tcp
   CLI equivalent: docker port product-api

6. Containers panel → click "frontend" → "Ports" tab
   Shows 0.0.0.0:3000 → 80/tcp
   CLI equivalent: docker port frontend

7. Containers panel → click "product-api" → "Inspect" tab → scroll to "Networks"
   Shows the network name "phase3-net" and the container's internal IP address
   CLI equivalent: docker inspect product-api --format '{{json .NetworkSettings.Networks}}'

8. Containers panel → click "frontend" → "Logs" tab
   Nginx access logs appear each time the browser fetches http://localhost:3000
   CLI equivalent: docker logs -f frontend

9. Containers panel → click "frontend" → "Exec" tab
   Type: wget -qO- http://product-api:3001/health
   Expected: {"status":"ok",...}
   This proves container DNS is working — the container resolved "product-api" by name
   CLI equivalent: docker exec frontend wget -qO- http://product-api:3001/health
```

### Docker Desktop tips for Phase 3

- The **Networks panel** is the star feature for this phase. After every `docker network` command, switch to it immediately and watch the state change in real time — this builds the mental model faster than reading documentation.
- The **Containers → Inspect → Networks** section shows the exact IP Docker assigned to each container. Use this to understand that DNS is just a friendly layer on top of IP routing.
- If the browser shows an error fetching products, check the **Containers → frontend → Logs** tab for CORS or network errors, and the **Containers → product-api → Logs** tab to see if the API received any requests.

### What Docker Desktop cannot do in Phase 3

- Docker Desktop **cannot run `docker exec -it`** with interactive TTY input. For the `wget` DNS test above, use the Exec tab (one-shot commands) or the WSL2 terminal for multi-step interactive sessions.
- Docker Desktop **cannot create a network** via the GUI — use the CLI. The Networks panel is read-only for viewing; all create/delete actions require the terminal.

## Validation checklist

### Via CLI

- [ ] `docker network ls` shows `phase3-net` with driver `bridge`
- [ ] `docker network inspect phase3-net` lists both `frontend` and `product-api` as connected containers
- [ ] `curl http://localhost:3001/health` returns `{"status":"ok",...}`
- [ ] `curl http://localhost:3001/products` returns a JSON array of 5 products
- [ ] `curl -I http://localhost:3000` returns `HTTP/1.1 200 OK`
- [ ] `docker exec frontend wget -qO- http://product-api:3001/health` returns `{"status":"ok",...}` (proves container DNS)
- [ ] `docker exec product-api whoami` returns `appuser`
- [ ] `docker exec frontend whoami` returns `appuser`

### Via Docker Desktop

- [ ] Networks panel shows `phase3-net` with driver `bridge`
- [ ] Networks panel → `phase3-net` → both containers listed with internal IPs
- [ ] Containers panel → `product-api` → Ports tab shows `3001:3001`
- [ ] Containers panel → `frontend` → Ports tab shows `3000:80`
- [ ] Containers panel → `frontend` → Exec tab → `wget -qO- http://product-api:3001/health` succeeds
- [ ] Containers panel → `product-api` → Inspect → Networks section shows `phase3-net`
- [ ] Both containers show green/running status in Containers panel

## Completion criteria (pass/fail)

| Criterion | How to verify |
|-----------|--------------|
| Both containers on `phase3-net` custom network | `docker network inspect phase3-net` / Networks panel shows both |
| Frontend fetches products from API using container name as hostname | `docker exec frontend wget -qO- http://product-api:3001/products` returns JSON |
| Port mappings correct and visible | `docker ps` Ports column / Containers → Ports tab |
| Both containers run as non-root | `docker exec <name> whoami` → `appuser` for both |
| Browser shows product grid at `http://localhost:3000` | Open browser; 5 products visible |
| Container DNS confirmed working | `wget -qO- http://product-api:3001/health` from inside frontend container succeeds |

## Exercises

1. **Default bridge DNS failure (CLI):** Start a third container on the **default** bridge network (`docker run -d --name test-default nginx:stable-alpine` — no `--network` flag). Exec into `frontend` and try `wget -qO- http://test-default/`. It will fail. Then connect `test-default` to `phase3-net` (`docker network connect phase3-net test-default`) and try again — it succeeds. This proves why custom networks are required for DNS. Clean up: `docker stop test-default && docker rm test-default`.

2. **Port remapping (CLI + Docker Desktop):** Stop and remove `frontend`, then rerun it with `-p 8080:80` instead of `-p 3000:80`. Open `http://localhost:8080` and confirm it still works. Check the Ports tab in Docker Desktop — it now shows `8080:80`. The application is identical; only the host-side port changed.

3. **Network inspection deep-dive (Docker Desktop):** With both containers running, go to Networks panel → `phase3-net` → note both IP addresses. Then go to Containers → `product-api` → Exec tab and run `wget -qO- http://172.18.0.X:3001/health` (using the actual IP of the API container from the Networks panel). It should work — confirming DNS is just a layer on top of IP routing.

## Common mistakes in this phase

| Symptom | Cause | Fix |
|---------|-------|-----|
| `wget: bad address 'product-api'` when exec-ing into a container | Container is on the **default** bridge, not a custom network | Remove and re-run with `--network phase3-net` |
| Browser shows "Failed to fetch" for products | `VITE_API_URL` was not set at build time, or was set to the container DNS name | Rebuild with `--build-arg VITE_API_URL=http://localhost:3001` |
| `docker network rm phase3-net` fails with "active endpoints" | Containers are still connected to the network | Stop and remove containers first, then remove the network |
| API container starts but port 3001 is inaccessible from the host | `-p 3001:3001` was omitted from `docker run` | Remove and re-run with `-p 3001:3001` |
| Container DNS works inside Docker but the browser still fails | `VITE_API_URL` is set to `http://product-api:3001` — the browser cannot resolve Docker container names | Always use `localhost:<port>` for browser-facing URLs; container DNS is for server-to-server calls only |
| "port is already allocated" error on `docker run` | A previous container (possibly stopped) is holding the port | `docker ps -a` to find it; `docker rm <name>` to remove it |
| Networks panel in Docker Desktop shows no containers on `phase3-net` | Containers were started before the network was created, or `--network` was omitted | Stop/remove containers and re-run with `--network phase3-net` |

## Windows / WSL2 notes

- All `docker` commands run from the WSL2 terminal. Port mappings (`localhost:3000`, `localhost:3001`) are accessible from **Windows browsers** because Docker Desktop bridges the WSL2 VM ports to the Windows host automatically.
- If `localhost:3000` does not resolve in the Windows browser, check Docker Desktop is running and the WSL2 backend is active. Occasionally a Docker Desktop restart fixes Windows-side port forwarding.
- Do not use Windows-style paths in any Docker command. All paths inside containers and in `-v` mount flags must use forward slashes.

## Cleanup

### CLI

```bash
# Stop and remove containers
docker stop frontend product-api
docker rm   frontend product-api

# Remove the custom network
docker network rm phase3-net

# Remove images
docker rmi phase3-frontend:latest phase3-api:latest

# One-liner clean state
docker stop frontend product-api 2>/dev/null; \
docker rm   frontend product-api 2>/dev/null; \
docker network rm phase3-net 2>/dev/null; \
docker rmi phase3-frontend:latest phase3-api:latest 2>/dev/null; \
echo "Phase 3 cleaned up"
```

### Docker Desktop

1. Containers panel → `frontend` → ■ Stop → trash icon (Delete)
2. Containers panel → `product-api` → ■ Stop → trash icon (Delete)
3. Networks panel → `phase3-net` → Delete (appears after containers are removed)
4. Images panel → `phase3-frontend:latest` → three-dot → Remove
5. Images panel → `phase3-api:latest` → three-dot → Remove

## Cheat sheet

| Task | CLI | Docker Desktop |
|------|-----|----------------|
| Create custom network | `docker network create phase3-net` | N/A — CLI only |
| List networks | `docker network ls` | Networks panel |
| Inspect network (see containers) | `docker network inspect phase3-net` | Networks → phase3-net detail view |
| Run container on network | `docker run --network phase3-net ...` | N/A — CLI only |
| Test container DNS | `docker exec frontend wget -qO- http://product-api:3001/health` | Containers → frontend → Exec tab |
| View port mapping | `docker port product-api` | Containers → container → Ports tab |
| View container's network IP | `docker inspect product-api` | Containers → container → Inspect → Networks |
| Remove network | `docker network rm phase3-net` | Networks panel → Delete (after containers removed) |

## Interview questions

**Q1: Why does Docker's default bridge network not support container-name DNS, but a custom bridge network does?**
The default `bridge` network is a legacy mode maintained for backwards compatibility. Docker's embedded DNS resolver is only enabled on **user-defined** (custom) networks. On the default bridge, containers can communicate by IP but not by name. This is by design — it encourages using named networks, which provide isolation, DNS, and better security boundaries.

**Q2: A container on a custom bridge network can ping another container by name. Why can't the browser do the same?**
Container DNS resolution happens inside the Docker network namespace — it is only available to processes running inside containers on that network. A browser runs on the host machine (or the user's laptop), outside Docker entirely. It uses the host's DNS resolver, which has no knowledge of Docker container names. For browser-facing URLs, you must use the host-mapped port (`localhost:3001`), not the container name.

**Q3: What is the difference between `-p 3001:3001` and `--expose 3001`?**
`-p 3001:3001` (or `--publish`) maps a host port to a container port, making the container reachable from outside Docker. `--expose` (or `EXPOSE` in a Dockerfile) only documents the port and makes it available to other containers on the same network — it does not publish it to the host. To reach a container from the browser, you need `-p`. To reach it from another container, you only need them on the same network.

**Q4: What happens if two containers on the same custom network have the same `--name`? Can you run them?**
No. Docker enforces unique container names within a Docker engine instance. `docker run --name product-api` will fail with "Conflict. The container name '/product-api' is already in use" if another container (running or stopped) has that name. You must remove the existing container first with `docker rm product-api`.

**Q5: How would you add an already-running container to a second network without restarting it?**
Use `docker network connect <network> <container>`. The container immediately gets a new network interface and an IP on the target network, and Docker's DNS registers it there. You can disconnect it later with `docker network disconnect`. This is how you can have one container (e.g. a monitoring agent) span multiple networks simultaneously.

## Next phase

Phase 4 introduces Docker volumes: you will create a named volume, mount it into a container that writes data, and prove that data survives container deletion and recreation — with visual confirmation in Docker Desktop's Volumes Data tab.
