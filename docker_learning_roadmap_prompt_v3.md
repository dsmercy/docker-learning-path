# Docker Learning Roadmap Generator Prompt — v3

## Role

Act as a Senior DevOps Engineer, Docker Expert, and Technical Mentor with deep experience
training .NET developers on containerization from zero to enterprise-grade deployments.

---

## Developer Context

- I am a **Senior .NET Developer** on **Windows 11** using **Docker Desktop with WSL2**.
- I use **Docker Desktop** as my primary visual tool for monitoring containers, images,
  volumes, networks, and logs throughout every phase.
- I want to learn Docker from beginner to enterprise level through hands-on projects.
- I prefer learning by doing, not by reading theory alone.
- Flag any **Windows / WSL2 specific gotchas** wherever they are relevant.

---

## Critical Generation Rules — READ FIRST

> These rules override everything else. Follow them without exception.

1. **Generate ONE phase per response.** After completing a phase, stop and print:
   `✅ Phase N complete. Reply "next" to continue to Phase N+1.`
2. **Wait for my confirmation** ("next", "continue", or "go") before generating the next phase.
3. **Each phase must be generated in its own dedicated folder** named `phase-NN-<kebab-case-title>/`
   (e.g. `phase-01-docker-basics/`, `phase-02-dockerfiles/`, `phase-03-networking/`).
   All files for that phase — `README.md`, `Dockerfile`, `.dockerignore`, `docker-compose.yml`,
   source files — live inside that folder and nowhere else.
4. **All generated Dockerfiles must be production-safe by default:**
   - Never run as root — always add a non-root user.
   - Always include a `.dockerignore` template alongside every Dockerfile.
   - Use multi-stage builds from Phase 8 onwards.
   - Include a `HEALTHCHECK` instruction in every Dockerfile from Phase 6 onwards.
4. **No anti-patterns in sample code.** Common mistakes belong only in the
   "Common Mistakes" section — never in the working code examples.
5. **Keep project code minimal.** Focus on the Docker concept, not business logic.
   Generate only the minimum code needed to demonstrate the topic.
6. **README.md is mandatory** for every phase. See README requirements below.
7. **Docker Desktop guidance is mandatory** for every phase. See the
   "Docker Desktop" section in the methodology below.

---

## Tech Stack (fixed — do not deviate)

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React with Vite                   |
| Backend     | Express.js (Node 20-alpine)       |
| Mock API    | Express.js (Node 20-alpine)       |
| Database    | MongoDB 7 (mongodb:7.0)           |
| Cache       | Redis 7-alpine                    |
| Proxy       | Nginx (stable-alpine)             |
| Logging     | Winston + Loki + Grafana          |
| Monitoring  | Prometheus + Grafana              |
| CI/CD       | GitHub Actions                    |

Use the lightest official Alpine-based images wherever available.
Prefer e-commerce-themed examples (products, orders, wishlist, users) throughout.

---

## Docker Desktop — Global Setup (apply once, before Phase 1)

Before any phase begins, include this one-time setup section:

### Recommended Docker Desktop Settings (Windows 11 + WSL2)

**General tab:**
- Start Docker Desktop when you log in: ON
- Use WSL 2 based engine: ON (critical — must be enabled)
- Send usage statistics: your choice

**Resources → WSL Integration tab:**
- Enable integration with your WSL2 distro (e.g. Ubuntu)
- This makes `docker` available inside your WSL2 terminal

**Resources → Advanced tab:**
- CPUs: allocate at least 4 (more if available)
- Memory: allocate at least 6 GB (8 GB recommended for Phase 13)
- These limits control how much of your machine Docker containers can consume

**Docker Engine tab:**
- Verify the daemon config JSON — no manual edits needed for this roadmap

**Experimental Features tab:**
- Enable "Access experimental features" — required for Docker Scout in Phase 11

### Docker Desktop UI Map (panels you will use throughout the roadmap)

```
Docker Desktop
├── Dashboard (Home)       — running containers at a glance, resource usage summary
├── Containers             — list, start/stop/restart/delete containers; open logs/exec/stats per container
├── Images                 — list pulled images, view layers, push/pull, run, delete; Docker Scout scan
├── Volumes                — list volumes, inspect, browse files inside a volume (GUI file browser)
├── Networks               — list networks, inspect connected containers, see subnet/gateway
├── Dev Environments       — not used in this roadmap
└── Settings               — WSL2, resources, Docker Engine config, extensions
```

---

## Learning Methodology

Apply this structure to **every** phase:

### 1. Overview Card
- Phase number and title
- Estimated effort (hours/days)
- Week number in the overall plan
- Prerequisites (phases that must be complete first)
- One-line summary of what this phase teaches

### 2. Learning Goals
- Why this Docker feature exists
- The problem it solves
- Real-world enterprise use case

### 3. Core Concepts
- Bullet list of concepts to understand before coding
- Include a brief plain-English definition for each

### 4. Commands Reference
- Every Docker / Docker Compose command needed for this phase
- Format: `command` — what it does — when to use it
- Group by category (build / run / inspect / clean)

### 5. Hands-on Project
- Folder structure (tree format)
- ASCII architecture diagram
- All source files with full content
- `.dockerignore` file
- `Dockerfile` (production-safe, non-root, with HEALTHCHECK from Phase 6+)
- `docker-compose.yml` (where applicable)
- Step-by-step commands to build and run

### 6. Docker Desktop Walkthrough (mandatory every phase)

For every phase include a dedicated "Docker Desktop" section with:

**a) What to observe in Docker Desktop for this phase**
Describe exactly which panels to open, what to look at, and what to expect to see.
Tie each GUI action to the CLI command it reflects so the developer builds
both muscle memories simultaneously.

**b) Step-by-step GUI actions**
Numbered steps with: panel name → element to click → what it shows.
Use this format:
```
1. Containers panel → click container name → click "Logs" tab
   CLI equivalent: docker logs <container>

2. Images panel → click image name → click "Image layers"
   CLI equivalent: docker history <image>
```

**c) Docker Desktop tips for this phase**
Highlight features of Docker Desktop that are especially useful for this
specific phase's concepts (e.g. Volumes file browser in Phase 4,
Scout CVE scan in Phase 11, Compose app grouping in Phase 5).

**d) What Docker Desktop cannot do (for this phase)**
Be honest about GUI limitations so the developer knows when to use the CLI.
Example: "Docker Desktop cannot run `docker exec` with an interactive TTY
that requires keyboard input — use the WSL2 terminal for that."

### 7. README.md (mandatory — see format below)
- One README per phase placed at the root of the phase folder
- See "README.md Format" section for exact structure

### 8. Validation Steps
- Concrete checklist to confirm everything works
- Split into two columns: CLI validation AND Docker Desktop validation
- Include exact URLs, expected outputs, and GUI locations to verify

### 9. Completion Criteria (measurable — pass/fail)
- Specific, testable conditions — not vague goals
- Examples:
  - Container starts in under 5 seconds
  - Image size is under N MB (verify in Images panel and with `docker images`)
  - Data persists after `docker compose down` and `docker compose up`
  - Health check reports `healthy` in `docker ps` and in Docker Desktop Containers panel

### 10. Exercises
- 2–3 practical tasks to extend the project independently
- Each exercise should reinforce the phase's Docker concept
- At least one exercise per phase should be done via Docker Desktop GUI
  to build familiarity with both approaches

### 11. Common Mistakes
- Mistakes specific to this phase
- Include the symptom, the cause, and the fix
- Include Windows/WSL2-specific pitfalls where relevant
- Include Docker Desktop-specific confusion points where relevant
  (e.g. "container shows as stopped in Desktop but port is still bound")

### 12. Cleanup Commands
- CLI commands to stop, remove containers, images, volumes, and networks
- Docker Desktop equivalent: which panel and button to use for each action
- Always include a one-liner CLI command to return to a clean state

### 13. Cheat Sheet
- A compact reference card of the 5–8 most important commands/concepts from this phase
- Include the Docker Desktop panel equivalent for each CLI command where one exists

### 14. Interview Questions
- 3–5 Docker interview questions that test mastery of this phase's concepts
- Include the ideal answer for each

---

## README.md Format (mandatory for every phase)

Every phase folder must contain a `README.md` with the following sections.
Use clear Markdown headings. Keep language practical and direct.

```markdown
# Phase N — [Phase Title]

## What this phase teaches
One paragraph. What Docker concept is covered and why it matters.

## Prerequisites
- Phase X must be complete
- Docker Desktop running with WSL2 backend (Windows)
- [any other tool or knowledge needed]

## Estimated effort
X hours / X days — Week N of the overall plan

## Architecture
[ASCII diagram of what is running in this phase]

## Folder structure
[tree output of the phase directory]

## Quick start
Step-by-step commands to get from zero to running in this phase.
Every command must be copy-pasteable and work on Windows (WSL2 terminal).

```bash
# 1. Build the image
docker build -t phase-N-app .

# 2. Run the container
docker run -d -p 3000:3000 --name phase-N-app phase-N-app

# 3. Verify
curl http://localhost:3000/health
```

## Docker Desktop — what to watch in this phase
List the specific panels, tabs, and actions to use in Docker Desktop
to observe and verify what this phase is doing.

| Action | Docker Desktop | CLI equivalent |
|--------|---------------|----------------|
| View running containers | Containers panel | `docker ps` |
| Check logs | Container → Logs tab | `docker logs <name>` |
| [phase-specific row] | ... | ... |

## Key Docker concepts covered
- **Concept 1** — plain-English explanation
- **Concept 2** — plain-English explanation

## Validation checklist

### Via CLI
- [ ] Container starts without errors (`docker ps`)
- [ ] Application responds at expected URL

### Via Docker Desktop
- [ ] Container shows green/running status in Containers panel
- [ ] [Phase-specific GUI check]
- [ ] Image size visible and under X MB in Images panel

## Completion criteria (pass/fail)
List the measurable pass/fail criteria from the phase.

## Common mistakes in this phase
| Symptom | Cause | Fix |
|---------|-------|-----|
| ... | ... | ... |

## Windows / WSL2 notes
Any Windows-specific behaviour, path differences, or line-ending issues to watch for.

## Cleanup

### CLI
```bash
docker compose down -v --remove-orphans
docker rmi phase-N-app
```

### Docker Desktop
1. Containers panel → select container → Delete
2. Images panel → select image → Remove
3. Volumes panel → select volume → Remove

## Next phase
Brief one-line preview of what Phase N+1 will cover.
```

---

## Windows / WSL2 Global Notes

Apply these reminders wherever relevant throughout the roadmap:

- Use forward slashes in all paths inside Dockerfiles and compose files —
  Windows backslashes cause silent failures in WSL2.
- Volume bind-mount paths in `docker-compose.yml` must use the WSL2 Linux path
  format (`/home/user/project`) not Windows paths (`C:\Users\...`).
- Line endings: always configure Git with `core.autocrlf=false` for Docker projects.
  CRLF line endings in shell scripts inside containers will cause `exec format error`.
- Run all `docker` and `docker compose` commands from a **WSL2 terminal**, not
  PowerShell or CMD, to avoid path and permission issues.
- File permission changes (`chmod`) inside containers do not persist on NTFS volumes.
  Use named volumes instead of bind mounts for files that need Unix permissions.
- Docker Desktop on Windows proxies all Docker calls through the WSL2 backend.
  The Docker Desktop GUI and the WSL2 terminal CLI show the same live state —
  an action in one is immediately visible in the other.

---

## Deliverables Required for Every Phase

- [ ] `README.md` (using the format above, including Docker Desktop table)
- [ ] Folder structure (tree)
- [ ] ASCII architecture diagram (also in README)
- [ ] All source files (minimal, focused on the Docker concept)
- [ ] `.dockerignore`
- [ ] `Dockerfile` (production-safe)
- [ ] `docker-compose.yml` (where applicable)
- [ ] Step-by-step CLI run commands
- [ ] **Docker Desktop walkthrough** (panels, tabs, steps, CLI equivalents)
- [ ] Validation steps — CLI AND Docker Desktop
- [ ] Cleanup commands — CLI AND Docker Desktop steps
- [ ] Cheat sheet (with Docker Desktop equivalents)
- [ ] Common mistakes with fixes (including Desktop-specific confusion)
- [ ] Interview questions with answers

---

## Project Progression

---

### Phase 1 — Docker Basics

**Week:** 1 | **Effort:** 2–3 days | **Prerequisites:** Docker Desktop installed with WSL2

**Projects:**
- Pull and run an Nginx container; inspect it
- Pull and run an Ubuntu container; explore the shell
- Pull, list, inspect, and remove images via the Docker CLI

**Focus:**
- Docker Engine architecture (client / daemon / registry)
- Images vs containers
- Docker Hub
- Basic CLI fluency

**Docker Desktop focus for this phase:**
- Dashboard: observe the real-time container list as you run and stop containers
- Containers panel: start, stop, restart, and delete containers via the GUI
- Images panel: view all pulled images, their sizes, tags, and creation dates;
  pull a new image using the search bar at the top of Docker Desktop
- Images → click any image → "Image layers" to see the layer stack visually
- Settings → Resources → WSL Integration: confirm WSL2 integration is active

**README must include:**
- What Docker Desktop with WSL2 is and how the pieces connect
- How to verify Docker is working correctly on Windows 11 (both CLI and GUI)
- The difference between an image and a running container explained with an analogy
- Docker Desktop UI map: what each panel is for

**Completion Criteria:**
- `docker ps` shows a running Nginx container AND it appears green in Docker Desktop Containers panel
- `docker exec` into Ubuntu container and run `ls` successfully
- Can pull an image both via `docker pull` and via Docker Desktop search bar
- Can explain the output of `docker images` and match it to the Images panel in Docker Desktop
- Image pulled, container started, stopped, and removed — done via CLI AND via Docker Desktop GUI

---

### Phase 2 — Dockerfiles

**Week:** 1–2 | **Effort:** 2–3 days | **Prerequisites:** Phase 1

**Project:** E-commerce Landing Page (React Vite — static product listing, no API)

**Deliverables:**
- `Dockerfile` for the React Vite app (Nginx serving static build)
- `.dockerignore` — must exclude `node_modules/`, `dist/`, `.git/`
- `README.md` explaining every Dockerfile instruction used

**Focus:**
- Dockerfile instructions: `FROM`, `WORKDIR`, `COPY`, `RUN`, `EXPOSE`, `CMD`
- Image layers and layer caching
- Build context and why `.dockerignore` matters for .NET/Node projects
- Image size: measure before and after `.dockerignore`, document the difference

**Docker Desktop focus for this phase:**
- Images panel → click your newly built image → **"Image layers"** tab:
  observe each Dockerfile instruction as a separate layer with its size;
  identify which `RUN` instruction creates the largest layer
  CLI equivalent: `docker history <image>`
- Images panel: compare image sizes — build once without `.dockerignore`,
  note the size; add `.dockerignore`, rebuild, note the reduction in the panel
- During `docker build`, watch the **build log stream** in the terminal;
  then re-run it and watch Docker Desktop Dashboard update as the new image appears
- Containers panel → click your running container → **"Inspect"** tab:
  see all container metadata including the CMD and EXPOSE values from your Dockerfile
  CLI equivalent: `docker inspect <container>`

**Windows / WSL2 note:** Build from the WSL2 terminal. Note the build context size
printed at the start of `docker build` — show how `.dockerignore` reduces it.

**Completion Criteria:**
- Image builds successfully
- Container serves the React app at `http://localhost:3000`
- Image size is under 50 MB — confirmed in both `docker images` and the Images panel
- `.dockerignore` is present and reduces build context vs without it
- Can identify each Dockerfile layer in Docker Desktop → Images → Image layers
- Can explain what each Dockerfile line does

---

### Phase 3 — Docker Networking

**Week:** 2 | **Effort:** 2–3 days | **Prerequisites:** Phase 2

**Project:** Product Catalog UI + Mock Product API

**Stack:**
- React Vite frontend
- **Express.js mock API** (Node 20-alpine) — serves hardcoded product JSON
- Custom Docker bridge network connecting the two containers

**Deliverables:**
- `Dockerfile` for the React frontend
- `Dockerfile` for the Express.js API (`node:20-alpine`, non-root user)
- `.dockerignore` for both services
- Network creation and container run commands (no Compose yet — manual wiring)
- `README.md` explaining bridge networks, DNS resolution, and port mapping

**Express.js API spec:**
- Single file: `server.js`
- Two endpoints: `GET /products` and `GET /health`
- Returns hardcoded JSON — no database, no external dependencies
- Runs on port 3001 inside the container

**Focus:**
- Docker bridge vs host network
- Container DNS — containers resolve each other by name on a custom network
- Port mapping (`-p host:container`)
- Why containers on the default bridge cannot resolve by name

**Docker Desktop focus for this phase:**
- **Networks panel** (Docker Desktop left sidebar → Networks):
  before creating your custom network, observe the default `bridge`, `host`, and `none` networks;
  after `docker network create`, your new network appears here instantly
  CLI equivalent: `docker network ls`
- Networks panel → click your custom network → see the **subnet, gateway**,
  and the list of connected containers with their IP addresses
  CLI equivalent: `docker network inspect <network>`
- Containers panel → click a container → **"Inspect"** tab → scroll to "Networks":
  confirms which networks this container belongs to and its assigned IP
  CLI equivalent: `docker inspect <container> --format '{{json .NetworkSettings.Networks}}'`
- Containers panel → click a container → **"Ports"** tab:
  shows the host:container port mapping visually
  CLI equivalent: `docker port <container>`

**Completion Criteria:**
- Both containers running on a custom named network — visible in Networks panel
- React frontend fetches products from the Express API using the container name as hostname
- `docker network inspect` (and Networks panel) shows both containers on the same network
- Port mappings visible and correct in Docker Desktop Containers → Ports tab

---

### Phase 4 — Docker Volumes

**Week:** 2–3 | **Effort:** 2 days | **Prerequisites:** Phase 3

**Project:** Customer Wishlist Application

**Stack:**
- Express.js API (writes wishlist items to a JSON file)
- Named Docker volume for persistence

**Focus:**
- Named volumes vs bind mounts — when to use each
- Volume lifecycle: create, inspect, backup, remove
- Demonstrating data survival across container restarts and replacements
- When bind mounts cause permission problems on Windows (and how named volumes solve it)

**Docker Desktop focus for this phase:**
- **Volumes panel** — the most useful Docker Desktop feature for this phase:
  after `docker volume create`, your volume appears here with its name and driver
  CLI equivalent: `docker volume ls`
- Volumes panel → click a volume → **"Data"** tab:
  Docker Desktop's built-in **file browser** lets you browse, view, and even
  edit files inside a named volume without exec-ing into a container —
  use this to verify wishlist JSON is actually being written and persisted
  CLI equivalent: `docker run --rm -v <volume>:/data alpine ls /data`
- Volumes panel → click a volume → **"Inspect"** tab:
  shows the mount point on the host (WSL2 path) and creation date
  CLI equivalent: `docker volume inspect <volume>`
- After destroying and recreating the container, open the Volume Data tab again
  to confirm the wishlist file is still present — visual proof of persistence

**Windows / WSL2 note:** Named volumes are stored inside the WSL2 VM, not on your
Windows NTFS drive — this is intentional and avoids file permission problems.
Do not try to access the volume path directly from Windows Explorer.
Use Docker Desktop → Volumes → Data tab to browse volume contents from Windows.

**Completion Criteria:**
- Wishlist items persist after `docker stop` + `docker start` —
  verified in Volumes → Data tab (not just via curl)
- Wishlist items persist after `docker rm` + `docker run` (new container, same volume)
- Volume visible in Docker Desktop Volumes panel with correct name
- `docker volume rm` removes the volume — it disappears from the Volumes panel;
  new container starts with empty wishlist (proving the volume owned the data)

---

### Phase 5 — Docker Compose

**Week:** 3 | **Effort:** 3 days | **Prerequisites:** Phase 4

**Project:** Mini E-commerce Stack

**Stack:**
- React Vite frontend
- Express.js mock API (product catalog)
- Redis 7-alpine (session / cart cache)

**Focus:**
- `docker-compose.yml` structure: services, networks, volumes, environment variables
- Service discovery by service name (not IP)
- `depends_on` with `condition: service_healthy`
- Environment variables via `.env` file (never hardcode secrets)
- **Docker Compose Watch** — configure `watch` for hot-reload in development
- `docker compose up`, `down`, `logs`, `ps`, `exec`

**Docker Desktop focus for this phase:**
- **Compose app grouping** — when you run `docker compose up`, Docker Desktop
  automatically groups all services under a single collapsible app entry named
  after your project folder in the Containers panel;
  expand the group to see all services and their individual statuses at a glance
- Containers panel → expand Compose app → click any service → **"Logs"** tab:
  stream live logs from that individual service
  CLI equivalent: `docker compose logs -f <service>`
- Containers panel → expand Compose app → click any service → **"Stats"** tab:
  live CPU %, memory usage, network I/O, block I/O for that container
  CLI equivalent: `docker stats <container>`
- Containers panel → expand Compose app → click any service → **"Inspect"** tab:
  see the environment variables injected from your `.env` file — confirm no
  secrets are hardcoded in the image, only injected at runtime
  CLI equivalent: `docker inspect <container> --format '{{json .Config.Env}}'`
- Start/stop the entire Compose stack using the ▶ / ■ buttons on the group row
  in the Containers panel — one click instead of `docker compose up/down`

**README must include:**
- Side-by-side comparison: manual `docker run` commands from Phase 3 vs the
  equivalent `docker-compose.yml` — showing why Compose exists

**Completion Criteria:**
- `docker compose up -d` starts all three services — group visible in Docker Desktop
- Frontend fetches products from Express via service name (not `localhost`)
- Redis stores a cart value; value survives Express container restart
- `docker compose watch` hot-reloads the frontend when a source file changes
- All three containers show green/running in the Compose app group in Docker Desktop
- `docker compose down -v` cleanly removes everything — group disappears from Desktop

---

### Phase 6 — Frontend + Backend (Express.js)

**Week:** 3–4 | **Effort:** 3–4 days | **Prerequisites:** Phase 5

**Project:** Product Management Application (CRUD — in-memory, no database yet)

**Stack:**
- React Vite frontend (product list, add, delete)
- Express.js API (Node 20-alpine, in-memory product store)

**Focus:**
- Dockerizing Express.js: correct base image (`node:20-alpine`)
- `NODE_ENV` and `PORT` env vars
- `HEALTHCHECK` on the Express API (`/health` endpoint)
- CORS configuration for cross-container communication
- `docker-compose.yml` linking frontend and backend

**.dockerignore for Node projects must exclude:**
`node_modules/`, `dist/`, `.env`, `.env.*`

**Docker Desktop focus for this phase:**
- Containers panel → Express API container → **"Logs"** tab:
  watch the Node.js startup log stream in real time — look for the
  "listening on port" line to confirm the app bound to the right port;
  watch for uncaught exceptions or startup errors here
  CLI equivalent: `docker compose logs -f api`
- Containers panel → Express API container → **"Stats"** tab:
  observe memory usage of the Node.js runtime — compare against the frontend container;
  use this to benchmark the memory cost of Node vs Nginx
  CLI equivalent: `docker stats`
- Containers panel → any container → **"Exec"** tab (terminal icon):
  Docker Desktop provides a browser-based terminal into the running container;
  use this to run `whoami` (confirm non-root), `env` (confirm env vars),
  `wget -qO- http://localhost:3001/health` (confirm health endpoint)
  CLI equivalent: `docker exec -it <container> /bin/sh`
  ⚠ Docker Desktop Exec tab cannot handle interactive programs (top, vim) —
  use the WSL2 terminal for those
- Containers panel → health status column: once `HEALTHCHECK` is configured,
  the status column shows "healthy" / "starting" / "unhealthy" in real time
  CLI equivalent: `docker ps` (STATUS column)

**Completion Criteria:**
- `docker ps` shows both containers with status `healthy`
- Docker Desktop Containers panel shows green "healthy" badge on the API container
- React frontend performs full CRUD against the Express.js API
- `docker exec` (CLI) and Exec tab (Docker Desktop) both confirm non-root user
- Image sizes documented: frontend < 50 MB, API < 60 MB — visible in Images panel

---

### Phase 7 — Database Containers

**Week:** 4 | **Effort:** 3–4 days | **Prerequisites:** Phase 6

**Project:** Product Management Application V2 (with MongoDB)

**Stack:**
- React Vite frontend
- Express.js API (Node 20-alpine)
- MongoDB 7 (`mongodb:7.0`)

**Focus:**
- MongoDB container configuration (env vars, init scripts)
- Connection strings in Express.js via environment variables (Mongoose)
- Seed data script that runs on container start
- Named volumes for MongoDB data directory
- `mongosh --eval "db.adminCommand('ping')"` health check on the database container
- `depends_on: condition: service_healthy`

**Docker Desktop focus for this phase:**
- Containers panel → MongoDB container → **"Logs"** tab:
  watch the MongoDB init log — look for "Waiting for connections" message;
  this is the signal that the health check will start returning healthy
  CLI equivalent: `docker compose logs -f db`
- **Volumes panel → MongoDB volume → "Data" tab**:
  browse the MongoDB data directory (`/data/db`) visually;
  after seeding, confirm the directory is populated (not empty);
  after `docker compose down` and `docker compose up`, confirm data is still there
  CLI equivalent: `docker run --rm -v <volume>:/data alpine ls /data`
- Containers panel → MongoDB container → **"Exec"** tab:
  open a terminal into the MongoDB container and run:
  `mongosh ecommerce --eval "db.products.find().pretty()"`
  to verify seed data is present
  CLI equivalent: `docker exec -it <db-container> mongosh`
- Containers panel → API container → **"Inspect"** → look for the
  `MONGODB_URI` environment variable —
  confirm it points to the MongoDB service name, not `localhost`

**Completion Criteria:**
- Products survive `docker compose down` + `docker compose up` —
  verify in Volumes panel Data tab AND via `mongosh` query
- Seed script runs automatically on container start
- MongoDB container shows `healthy` in Docker Desktop before API container starts
- API container shows `healthy` in Docker Desktop Containers panel
- `docker exec` into MongoDB (via Exec tab or CLI) and query the products collection

---

### Phase 8 — Production Dockerfiles

**Week:** 5 | **Effort:** 3 days | **Prerequisites:** Phase 7

**Project:** Optimize the Phase 7 application (no new features — Docker improvements only)

**Focus:**
- Multi-stage builds for the React frontend (build stage → Nginx runtime stage)
- Multi-stage builds for the Express.js API (deps-install stage → production-only stage)
- Non-root users in all containers
- `HEALTHCHECK` review across all services
- Image size comparison: before and after (document numbers in README)
- **Local Docker registry** — run a local registry container, push images, pull and run from it
- `.dockerignore` audit for all services

**Docker Desktop focus for this phase:**
- **Images panel — size comparison workflow:**
  tag your old (dev) image as `<name>:dev` and your new (prod) image as `<name>:prod`;
  both appear as separate rows in the Images panel with their sizes side by side;
  screenshot the panel for your README comparison table
  CLI equivalent: `docker images | grep <name>`
- Images panel → click any image → **"Image layers"** tab:
  compare the dev image (many large layers including SDK) vs the prod image
  (fewer, smaller layers — only the runtime); count the layers and note sizes
  CLI equivalent: `docker history <image>`
- After pushing to the local registry (`localhost:5000`), the image appears
  in the Images panel tagged as `localhost:5000/<name>:<tag>` —
  pull it back and confirm it appears as a separate entry
- **Docker Scout (Images panel → click image → "Docker Scout" tab)**:
  run a CVE scan on both the dev and prod images directly from Docker Desktop;
  the prod image should have significantly fewer vulnerabilities;
  this is your first exposure to Scout before Phase 11 formalizes security
  CLI equivalent: `docker scout cves <image>`

**README must include:**
- A comparison table: dev image size vs production image size for each service
- The multi-stage Dockerfile with inline comments on every stage

**Completion Criteria:**
- React production image is under 30 MB — visible in Images panel
- Express.js API production image is under 60 MB — visible in Images panel
- All containers run as non-root — confirmed via Exec tab `whoami`
- Local registry running at `localhost:5000`; images pushed and pulled successfully
- Layer count visibly lower in prod image vs dev image (Images → Image layers tab)
- `HEALTHCHECK` passes on all services — green badge in Containers panel

---

### Phase 9 — Reverse Proxy

**Week:** 5–6 | **Effort:** 2–3 days | **Prerequisites:** Phase 8

**Project:** Full Stack E-commerce Demo with Nginx Reverse Proxy

**Add:** Nginx (stable-alpine) as the single entry point

**Focus:**
- Nginx routing `/api/*` to the Express.js API container, `/` to the React container
- Single external port (80) — no direct port exposure for frontend or backend containers
- SSL/TLS with a self-signed cert (openssl, Nginx config)
- Load balancing: Nginx upstream block with two API replicas (`--scale api=2`)

**Docker Desktop focus for this phase:**
- Containers panel → Nginx container → **"Ports"** tab:
  confirm ONLY port 80 (and optionally 443) is mapped to the host;
  the frontend and API containers should show NO host port mappings —
  they are only reachable through the Nginx container on the internal network
  CLI equivalent: `docker ps --format "table {{.Names}}\t{{.Ports}}"`
- When you run `docker compose up --scale api=2`, Docker Desktop Containers panel
  shows two separate API container rows (e.g. `api-1` and `api-2`) both in the
  Compose app group — visual confirmation that scaling worked
  CLI equivalent: `docker compose ps`
- Networks panel → click the Compose network → see all containers (Nginx, frontend,
  api-1, api-2, mongo) listed with their internal IPs — Nginx is the only one
  with a port mapped to the host; the rest are only reachable internally
- Containers panel → Nginx container → **"Logs"** tab:
  watch access logs as you make requests — each request from the browser
  appears here, routed to the correct upstream container

**Completion Criteria:**
- All traffic enters through Nginx on port 80
- Docker Desktop Ports tab shows zero host-mapped ports on frontend and API containers
- `curl http://localhost/api/products` returns product JSON via Nginx
- `docker compose up --scale api=2` shows two API containers in Docker Desktop Compose group
- SSL: `curl -k https://localhost/api/products` works with the self-signed cert

---

### Phase 10 — Monitoring and Logging

**Week:** 6 | **Effort:** 3–4 days | **Prerequisites:** Phase 9

**Project:** Production-style Deployment with Observability Stack

**Add:**
- **Winston + Loki** — structured log aggregation (Express.js logs via Winston → Grafana Loki)
- **Prometheus** — metrics scraping (`prom-client` in Express.js)
- **Grafana** — metrics and log dashboards

**Focus:**
- Winston in Express.js writing structured JSON logs, shipped to Grafana Loki
- Prometheus scraping the `/metrics` endpoint (use `prom-client`)
- Grafana connecting to Prometheus and Loki, displaying request rate, error rate, and logs
- Log levels and filtering in containerized environments
- Why `docker logs` alone is not enough in production

**Docker Desktop focus for this phase:**
- Containers panel → any container → **"Stats"** tab:
  Docker Desktop shows live CPU %, memory, network I/O, and block I/O graphs —
  use this to observe resource usage as you generate load (e.g. run a loop of curl requests);
  compare this with what Prometheus and Grafana report for the same period
  CLI equivalent: `docker stats`
- Containers panel → Loki container → **"Ports"** tab:
  confirm port 3100 is mapped; Loki is the log aggregation backend for Grafana
- Containers panel → Prometheus container → **"Ports"** tab:
  click port 9090 link to open the Prometheus UI
- Containers panel → Grafana container → **"Ports"** tab:
  click port 3000 link to open Grafana UI (both Prometheus metrics and Loki logs visible here)
- Docker Desktop Stats tab is complementary to Grafana, not a replacement —
  Stats tab shows single-container metrics with no persistence;
  Grafana shows cross-container metrics with historical data and alerting
- Containers panel: with 7+ containers running, use the search bar at the top of
  the Containers panel to filter by name and find specific containers quickly

**Completion Criteria:**
- Grafana UI shows structured logs from Loki at `http://localhost:3000` — opened via Docker Desktop port link
- Prometheus scrapes metrics at `http://localhost:9090`
- Grafana dashboard shows request rate and error rate sourced from Prometheus at `http://localhost:3000`
- Docker Desktop Stats tab confirms all containers are within expected resource usage
- All monitoring services start via a single `docker compose up -d`

---

### Phase 11 — Security

**Week:** 7 | **Effort:** 3 days | **Prerequisites:** Phase 10

**Project:** Harden the existing application stack (no new features)

**Focus:**
- Non-root users in all containers
- Read-only root filesystems (`read_only: true` in Compose)
- Docker secrets via `docker compose secrets`
- Image vulnerability scanning with **Trivy** and **Docker Scout**
- Dropping Linux capabilities (`cap_drop: ALL`)
- Resource limits in Compose (`mem_limit`, `cpus`)

**Docker Desktop focus for this phase:**
- **Docker Scout — primary Docker Desktop feature for this phase:**
  Images panel → click any image → **"Docker Scout"** tab:
  Docker Desktop shows a full CVE breakdown: critical, high, medium, low;
  drill into each CVE to see the affected package, version, and fix version;
  use this to identify which base image upgrade eliminates the most CVEs
  CLI equivalent: `docker scout cves <image>`
- Images panel → Docker Scout tab → **"Recommendations"** section:
  Docker Desktop suggests a safer base image tag with fewer vulnerabilities;
  apply the recommendation, rebuild, and re-scan to see the CVE count drop
  CLI equivalent: `docker scout recommendations <image>`
- Containers panel → click a hardened container → **"Inspect"** tab:
  verify that secrets are NOT visible in the environment variables list;
  only the secret file path should appear, not the secret value
  CLI equivalent: `docker inspect <container> --format '{{json .Config.Env}}'`
- Containers panel → click a container → **"Stats"** tab:
  confirm that `mem_limit` is being respected — the memory graph should stay
  below the configured limit even under load
- **Settings → Docker Engine**: Docker Desktop provides a GUI for the daemon config —
  useful to set `"userns-remap": "default"` for additional namespace isolation
  (advanced — demonstrate the setting location, do not require enabling it)

**Tools:**
```bash
# Trivy scan (CLI)
trivy image <image-name>

# Docker Scout (CLI)
docker scout cves <image-name>
docker scout recommendations <image-name>
```

**Completion Criteria:**
- `docker exec <container> whoami` (or Exec tab) returns non-root for every container
- Docker Scout tab in Docker Desktop shows zero critical CVEs on production images
- Trivy CLI scan matches Scout findings
- Secrets not visible in Containers → Inspect → environment variables
- All containers have CPU and memory limits — enforced and visible in Stats tab

---

### Phase 12 — CI/CD Pipeline

**Week:** 7–8 | **Effort:** 4 days | **Prerequisites:** Phase 11

**Project:** Automated Deployment Pipeline using GitHub Actions

**Workflow:**
```
Code Push → Lint → Test → Docker Build → Trivy Scan → Docker Push → Deploy
```

**Focus:**
- GitHub Actions workflow file (`.github/workflows/docker.yml`)
- Docker Hub (or GitHub Container Registry) as the remote image registry
- Image tagging: `latest`, git SHA, semantic version
- Build caching in CI (`cache-from`, `cache-to`)
- Automated vulnerability gate: fail pipeline if Trivy finds critical CVEs
- Environment-specific Compose files (`docker-compose.prod.yml`)

**Docker Desktop focus for this phase:**
- CI/CD pipelines run headless on GitHub Actions servers —
  **Docker Desktop is not used during the pipeline run itself.**
- Docker Desktop IS useful for:
  - **Before pushing:** test the exact `docker build` and `docker run` commands
    locally in Docker Desktop before encoding them in the workflow YAML
  - **After the pipeline pushes an image:** pull the CI-built image locally via
    `docker pull <registry>/<image>:<sha-tag>`, then inspect it in Docker Desktop
    Images panel to verify it matches what you built locally (same layers, same size)
  - **Images panel → Docker Scout tab:** scan the CI-built image after pulling it
    to confirm the pipeline's Trivy gate is working correctly

**README must include:**
- How to set Docker Hub credentials as GitHub Actions secrets
- The full annotated workflow YAML

**Completion Criteria:**
- Pushing to `main` triggers the full pipeline automatically
- Images tagged with `latest` and the git commit SHA — pull both tags locally
  and verify they appear in Docker Desktop Images panel
- A deliberate CVE in a base image fails the pipeline at the scan step
- Pipeline completes in under 5 minutes with layer caching enabled
- CI-built image pulled locally and scanned clean in Docker Desktop Scout tab

---

### Phase 13 — Enterprise Project

**Week:** 8–10 | **Effort:** 8–12 days | **Prerequisites:** All previous phases

**Project:** E-commerce RBAC Management System

**Stack:**

| Service      | Technology                      |
|--------------|---------------------------------|
| Frontend     | React (Vite)                    |
| Backend      | Express.js (Node 20-alpine)     |
| Database     | MongoDB 7 (`mongodb:7.0`)       |
| Cache        | Redis 7-alpine                  |
| Message bus  | RabbitMQ 3-management-alpine    |
| Proxy        | Nginx (stable-alpine)           |
| Logging      | Winston + Loki + Grafana        |
| Monitoring   | Prometheus + Grafana            |

**Features:**
- JWT authentication and role-based authorization
- User, role, and permission management
- Audit log streamed via RabbitMQ
- Admin dashboard in React

**Docker Desktop focus for this phase:**
- With 8+ containers running, Docker Desktop is your **mission control**:
  - Containers panel: Compose app group collapses/expands all 8+ services;
    monitor overall health at a glance — any red/unhealthy badge demands attention
  - Use the **search bar** in Containers panel to filter by service name quickly
  - Use the **sort** options to order containers by status (unhealthy first)
- **Per-service log monitoring workflow:**
  open multiple Docker Desktop windows (or browser tabs if using the web UI)
  with different service logs open simultaneously — API logs, RabbitMQ logs, Seq logs
- **Volumes panel:** verify MongoDB, Redis, and RabbitMQ volumes are all present
  and populated — browse each with the Data tab
- **Networks panel:** verify all 8 containers are on the same internal network
  with only Nginx having an external port
- **Images panel → Docker Scout:** scan all production images; the README runbook
  must include a section on re-scanning images after any base image update
- **Settings → Resources → Advanced:** for Phase 13 increase Docker Desktop
  memory allocation to at least 8 GB — the full enterprise stack needs it;
  monitor total host memory consumption in the Docker Desktop Dashboard

**Docker Requirements (all previous phases applied):**
- Multi-stage Dockerfiles for frontend and backend
- Non-root users in all containers
- Read-only root filesystems where possible
- Docker secrets for all credentials
- `HEALTHCHECK` on every service
- `depends_on: condition: service_healthy` across the entire stack
- Named volumes for MongoDB, Redis, RabbitMQ
- Nginx as the single entry point
- Full monitoring and logging stack
- Resource limits on all services
- CI/CD pipeline via GitHub Actions

**Completion Criteria:**
- `docker compose up -d` starts all services cleanly from a fresh clone
- All containers show `healthy` in Docker Desktop Containers panel within 60 seconds
- Docker Desktop Scout tab shows zero critical CVEs across all images
- JWT auth, RBAC, and audit logs all function end-to-end
- README provides a complete runbook: setup, verify (CLI + Docker Desktop), troubleshoot, tear down

---

## Docker Desktop Quick Reference — CLI to GUI Mapping

Include this table in the Phase 1 README and reference it from every subsequent README.

| What you want to do | CLI command | Docker Desktop location |
|---------------------|-------------|------------------------|
| See running containers | `docker ps` | Containers panel |
| See all containers (including stopped) | `docker ps -a` | Containers panel (toggle "Show all") |
| View container logs | `docker logs <name>` | Containers → container → Logs tab |
| Stream live logs | `docker logs -f <name>` | Containers → container → Logs tab (live) |
| Open a shell in a container | `docker exec -it <name> sh` | Containers → container → Exec tab |
| View container CPU/memory | `docker stats` | Containers → container → Stats tab |
| Inspect container details | `docker inspect <name>` | Containers → container → Inspect tab |
| See mapped ports | `docker port <name>` | Containers → container → Ports tab |
| List images | `docker images` | Images panel |
| View image layers | `docker history <image>` | Images → image → Image layers tab |
| Scan image for CVEs | `docker scout cves <image>` | Images → image → Docker Scout tab |
| Pull an image | `docker pull <image>` | Images panel → search bar (top of app) |
| Remove an image | `docker rmi <image>` | Images → image → Remove button |
| List volumes | `docker volume ls` | Volumes panel |
| Inspect a volume | `docker volume inspect <vol>` | Volumes → volume → Inspect tab |
| Browse volume contents | *(requires helper container)* | Volumes → volume → Data tab |
| List networks | `docker network ls` | Networks panel |
| Inspect a network | `docker network inspect <net>` | Networks → network → detail view |
| Start Compose stack | `docker compose up -d` | Containers → Compose group → ▶ button |
| Stop Compose stack | `docker compose down` | Containers → Compose group → ■ button |
| View Compose service logs | `docker compose logs -f <svc>` | Containers → Compose group → service → Logs tab |

---

## Week-by-Week Schedule

| Week | Phases         | Milestone                                        |
|------|----------------|--------------------------------------------------|
| 1    | 1, 2           | First custom Docker image running; Docker Desktop navigation fluent |
| 2    | 3, 4           | Networking and volumes — verified via Networks and Volumes panels |
| 3    | 5, 6 (start)   | Compose app grouping; ASP.NET Core health badge in Desktop |
| 4    | 6 (end), 7     | Full stack with MongoDB — volume data browser confirms persistence |
| 5    | 8, 9 (start)   | Production image size comparison in Images panel; Scout first scan |
| 6    | 9 (end), 10    | Nginx port isolation visible in Desktop; Stats vs Grafana/Loki comparison |
| 7    | 11, 12         | Scout CVE dashboard; CI-built images pulled and verified in Desktop |
| 8–10 | 13             | 8-service Compose group in Desktop — mission control for enterprise stack |

---

## Final Goal

By the end of this roadmap I will be able to:

- Dockerize React applications with production-optimized multi-stage builds
- Dockerize Express.js APIs with non-root users and health checks
- Run and manage MongoDB in containers with persistent named volumes
- Orchestrate multi-container environments with Docker Compose
- Secure containers: non-root, secrets, capability drops, vulnerability scanning
- Build automated CI/CD pipelines with Docker and GitHub Actions
- Operate an observability stack: Seq, Prometheus, Grafana
- Troubleshoot any containerized application with confidence — using both CLI and Docker Desktop
- Read and act on Docker Desktop: Containers, Images, Volumes, Networks, Scout panels
- Deploy enterprise-grade applications with a complete Docker runbook
- Transition to Kubernetes with a solid mental model of container fundamentals

---

## Changes from v2 (summary for reference)

| Area | v2 | v3 |
|------|----|----|
| Docker Desktop | Mentioned in context only | Dedicated mandatory section in every phase methodology |
| Docker Desktop setup | Not included | One-time global setup section (WSL2, resources, UI map) |
| README format | CLI validation only | CLI + Docker Desktop validation table in every README |
| Validation steps | CLI only | Split into CLI column and Docker Desktop column |
| Completion criteria | CLI-verified only | CLI AND Docker Desktop GUI verification for every criterion |
| Cleanup | CLI commands only | CLI commands + Docker Desktop panel steps |
| Cheat sheet | CLI commands | CLI command + Docker Desktop equivalent for each entry |
| Common mistakes | CLI/config mistakes | Added Docker Desktop-specific confusion points per phase |
| Phase 1 | Docker CLI basics | + Docker Desktop UI navigation and image pulling via GUI |
| Phase 2 | Dockerfile focus | + Image layers tab, image size comparison in Images panel |
| Phase 3 | Networking CLI | + Networks panel inspection, port mapping tab |
| Phase 4 | Volumes CLI | + Volumes Data tab file browser (key Windows benefit) |
| Phase 5 | Compose CLI | + Compose app grouping, Stats tab, env var inspection |
| Phase 6 | Express.js backend | + Exec tab for non-root verify, health badge, Node memory stats |
| Phase 7 | DB containers | + Volume Data tab for MongoDB, Exec tab for mongosh |
| Phase 8 | Prod Dockerfiles | + Images panel size comparison, Scout tab first use |
| Phase 9 | Reverse proxy | + Port isolation verification in Ports tab, scale visibility |
| Phase 10 | Monitoring | + Stats tab vs Grafana comparison, port link shortcuts |
| Phase 11 | Security | + Scout CVE dashboard, recommendations, secret inspection |
| Phase 12 | CI/CD | + Honest note: Desktop not used in pipeline; post-deploy pull workflow |
| Phase 13 | Enterprise | + Desktop as mission control: search, sort, multi-window logs |
| CLI→GUI table | Not included | Full mapping table added as global reference |
