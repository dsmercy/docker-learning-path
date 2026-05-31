# Phase 1 — Docker Basics

## What this phase teaches

This phase introduces the foundational building blocks of Docker: the Engine architecture, the difference between images and containers, Docker Hub as a registry, and basic CLI fluency. You will run your first containers, explore them interactively, and learn to navigate Docker Desktop — the visual control panel you will use throughout every phase of this roadmap.

## Prerequisites

- Docker Desktop installed and running with the WSL2 backend (Windows 11)
- WSL2 distro (e.g. Ubuntu) installed and enabled in Docker Desktop → Settings → Resources → WSL Integration
- A WSL2 terminal open (Ubuntu or Debian — **not** PowerShell or CMD)

## Estimated effort

2–3 days — Week 1 of the overall plan

## Architecture

```
Your Machine (Windows 11)
└── Docker Desktop (WSL2 backend)
    └── Docker Engine (daemon)
        ├── Container: nginx   (image: nginx:stable-alpine)
        └── Container: ubuntu  (image: ubuntu:24.04)

Requests:
  Browser → http://localhost:8080 → nginx container (port 80)
  WSL2 terminal → docker exec → ubuntu container (interactive shell)
```

## How Docker Desktop + WSL2 connects

```
Windows 11
  └── Docker Desktop app (GUI)
        └── Calls Docker daemon running INSIDE the WSL2 VM
              └── WSL2 Ubuntu terminal also calls the same daemon
                        ↕ same live state — GUI and CLI are mirrors of each other
```

**Plain-English analogy:**
- An **image** is a recipe (read-only blueprint).
- A **container** is a meal cooked from that recipe (a running, writable instance).
- You can cook many meals from the same recipe — run many containers from one image.
- **Docker Hub** is the recipe book — a public registry where images live.

## Folder structure

```
phase-01-docker-basics/
└── README.md
```

No Dockerfile is needed in Phase 1 — you pull and run pre-built images from Docker Hub.

## Quick start

Run all commands from your **WSL2 terminal** (not PowerShell).

```bash
# ── Verify Docker is working ──────────────────────────────────────────────────
docker version
docker info

# ── Pull images ───────────────────────────────────────────────────────────────
docker pull nginx:stable-alpine
docker pull ubuntu:24.04

# ── Run Nginx ─────────────────────────────────────────────────────────────────
docker run -d \
  --name phase1-nginx \
  -p 8080:80 \
  nginx:stable-alpine

# Verify Nginx is serving
curl http://localhost:8080
# Expected: HTML page with "Welcome to nginx!"

# ── Run Ubuntu interactively ──────────────────────────────────────────────────
docker run -it \
  --name phase1-ubuntu \
  ubuntu:24.04 \
  /bin/bash

# Inside the container, run:
ls /
cat /etc/os-release
whoami          # returns: root  (Ubuntu base image — Phase 6+ adds non-root)
exit

# ── Inspect images ────────────────────────────────────────────────────────────
docker images
docker image inspect nginx:stable-alpine

# ── Inspect running containers ────────────────────────────────────────────────
docker ps
docker ps -a    # includes stopped containers
docker inspect phase1-nginx

# ── View logs ─────────────────────────────────────────────────────────────────
docker logs phase1-nginx

# ── Stop and remove ───────────────────────────────────────────────────────────
docker stop phase1-nginx phase1-ubuntu
docker rm   phase1-nginx phase1-ubuntu
docker rmi  nginx:stable-alpine ubuntu:24.04
```

## Docker Desktop — what to watch in this phase

### One-time recommended settings (do this before any phase)

| Setting | Location | Value |
|---------|----------|-------|
| WSL2 backend | Settings → General | Use WSL 2 based engine: **ON** |
| WSL Integration | Settings → Resources → WSL Integration | Enable your distro (e.g. Ubuntu): **ON** |
| CPUs | Settings → Resources → Advanced | At least **4** |
| Memory | Settings → Resources → Advanced | At least **6 GB** |
| Experimental features | Settings → Features in development | ON (needed for Scout in Phase 11) |

### Docker Desktop UI map

```
Docker Desktop
├── Dashboard (Home)   — running containers at a glance, resource usage summary
├── Containers         — list, start/stop/restart/delete; Logs / Exec / Stats / Inspect per container
├── Images             — pulled images, layer viewer, Docker Scout CVE scan
├── Volumes            — list volumes, browse files inside (Data tab)
├── Networks           — list networks, inspect connected containers
└── Settings           — WSL2, resources, Docker Engine config
```

### CLI ↔ Docker Desktop mapping

| Action | Docker Desktop | CLI equivalent |
|--------|---------------|----------------|
| See running containers | Containers panel | `docker ps` |
| See all containers (including stopped) | Containers panel → toggle "Show all" | `docker ps -a` |
| View container logs | Container → Logs tab | `docker logs <name>` |
| Stream live logs | Container → Logs tab (auto-scrolls) | `docker logs -f <name>` |
| Open a shell in a container | Container → Exec tab | `docker exec -it <name> sh` |
| View container CPU/memory | Container → Stats tab | `docker stats` |
| Inspect container details | Container → Inspect tab | `docker inspect <name>` |
| See mapped ports | Container → Ports tab | `docker port <name>` |
| List images | Images panel | `docker images` |
| View image layers | Images → image → Image layers tab | `docker history <image>` |
| Scan image for CVEs | Images → image → Docker Scout tab | `docker scout cves <image>` |
| Pull an image | Images panel → search bar (top of app) | `docker pull <image>` |
| Remove an image | Images → image → Remove button | `docker rmi <image>` |
| List volumes | Volumes panel | `docker volume ls` |
| Inspect a volume | Volumes → volume → Inspect tab | `docker volume inspect <vol>` |
| Browse volume contents | Volumes → volume → Data tab | *(requires helper container)* |
| List networks | Networks panel | `docker network ls` |
| Inspect a network | Networks → network → detail view | `docker network inspect <net>` |
| Start Compose stack | Containers → Compose group → ▶ button | `docker compose up -d` |
| Stop Compose stack | Containers → Compose group → ■ button | `docker compose down` |

### Step-by-step GUI actions for Phase 1

```
1. Settings → General
   Confirm "Use WSL 2 based engine" is ON
   CLI equivalent: docker info | grep -i "server version"

2. Settings → Resources → WSL Integration
   Confirm your WSL2 distro is listed and toggled ON
   CLI equivalent: wsl -l -v  (run in PowerShell to see distro status)

3. Run: docker pull nginx:stable-alpine  (WSL2 terminal)
   Docker Desktop → Images panel
   Confirm nginx:stable-alpine appears with its size (~8 MB)
   CLI equivalent: docker images nginx

4. Docker Desktop → Images panel → click nginx:stable-alpine → "Image layers" tab
   Observe each layer: base OS, config, entrypoint
   CLI equivalent: docker history nginx:stable-alpine

5. Run: docker run -d --name phase1-nginx -p 8080:80 nginx:stable-alpine
   Docker Desktop → Containers panel
   Confirm phase1-nginx appears with green running status
   CLI equivalent: docker ps

6. Containers panel → phase1-nginx → "Ports" tab
   Confirm 0.0.0.0:8080 → 80/tcp mapping
   CLI equivalent: docker port phase1-nginx

7. Containers panel → phase1-nginx → "Logs" tab
   Observe Nginx startup log and access log entries as you browse http://localhost:8080
   CLI equivalent: docker logs phase1-nginx

8. Containers panel → phase1-nginx → "Inspect" tab
   Scroll through full container metadata (image, network, env vars, mounts)
   CLI equivalent: docker inspect phase1-nginx

9. Docker Desktop → Images panel → search bar (top of app)
   Type "hello-world" and pull it via the GUI (without using docker pull)
   This is the Docker Desktop alternative to: docker pull hello-world

10. Stop phase1-nginx via Docker Desktop: Containers → phase1-nginx → ■ Stop button
    Confirm the status changes from green to grey
    CLI equivalent: docker stop phase1-nginx

11. Delete phase1-nginx via Docker Desktop: Containers → phase1-nginx → Delete (trash icon)
    CLI equivalent: docker rm phase1-nginx
```

### Docker Desktop tips for Phase 1

- The **Dashboard** (home screen) shows a real-time resource usage bar for your entire Docker engine — CPU, memory, disk. Glance here before starting heavy builds.
- The **Images panel search bar** (top of the Docker Desktop window) lets you search Docker Hub and pull images without typing `docker pull`.
- After stopping a container, it turns grey but stays in the Containers list. Toggle **"Show all"** to see stopped containers (same as `docker ps -a`).
- Clicking an image in the Images panel and selecting **"Run"** opens a GUI dialog to configure port mappings, env vars, and volume mounts — useful for one-off exploration runs.

### What Docker Desktop cannot do in Phase 1

- `docker run -it` with an interactive TTY (e.g. running a shell) **requires the WSL2 terminal**. Docker Desktop's Exec tab works for commands that produce output, but it cannot handle the full interactive session you get with `docker run -it ubuntu bash`.
- `docker image inspect` full JSON output is easier to read and search in the CLI. The Inspect tab in Docker Desktop is a formatted subset.

## Key Docker concepts covered

- **Docker Engine** — the daemon (`dockerd`) that builds and runs containers; the `docker` CLI talks to it over a socket
- **Image** — a read-only, layered blueprint for a container; stored in a registry (Docker Hub)
- **Container** — a running instance of an image; isolated process with its own filesystem, network, and process space
- **Layer** — each Dockerfile instruction creates a layer; layers are cached and shared across images to save disk space
- **Docker Hub** — the default public registry; `docker pull nginx` fetches from `hub.docker.com/library/nginx`
- **Port mapping** (`-p host:container`) — connects a port on your machine to a port inside the container
- **Bridge network** — the default network Docker containers attach to; allows container-to-host communication
- **Docker Desktop** — GUI wrapper around the Docker Engine; shows the same live state as the CLI

## Validation checklist

### Via CLI

- [ ] `docker version` shows both Client and Server versions without errors
- [ ] `docker pull nginx:stable-alpine` completes successfully
- [ ] `docker run -d --name phase1-nginx -p 8080:80 nginx:stable-alpine` starts the container
- [ ] `docker ps` shows `phase1-nginx` with status `Up`
- [ ] `curl http://localhost:8080` returns the Nginx welcome HTML
- [ ] `docker run -it --name phase1-ubuntu ubuntu:24.04 /bin/bash` opens a shell; `ls /` works
- [ ] `docker images` lists both `nginx:stable-alpine` and `ubuntu:24.04`
- [ ] `docker stop phase1-nginx && docker rm phase1-nginx` removes the container cleanly
- [ ] `docker rmi nginx:stable-alpine` removes the image

### Via Docker Desktop

- [ ] Containers panel shows `phase1-nginx` with green running status
- [ ] Containers → `phase1-nginx` → Ports tab shows `8080:80` mapping
- [ ] Containers → `phase1-nginx` → Logs tab shows Nginx startup output
- [ ] Images panel shows `nginx:stable-alpine` with correct size (~8 MB)
- [ ] Images → `nginx:stable-alpine` → Image layers tab shows the layer stack
- [ ] An image was pulled using the Docker Desktop search bar (not CLI)
- [ ] A container was stopped and deleted using the Docker Desktop GUI buttons

## Completion criteria (pass/fail)

| Criterion | How to verify |
|-----------|--------------|
| `docker ps` shows `phase1-nginx` running | CLI: `docker ps` / Desktop: Containers panel green badge |
| `curl http://localhost:8080` returns Nginx HTML | CLI only |
| `docker exec` into Ubuntu and run `ls` successfully | CLI: `docker exec -it phase1-ubuntu /bin/bash` |
| Image pulled via Docker Desktop GUI (not CLI) | Desktop: Images panel search bar |
| `docker images` output matches Images panel (same names, sizes, tags) | Compare CLI output and Desktop side by side |
| Container started, stopped, and removed via CLI AND via Desktop GUI | Both paths completed |

## Common mistakes in this phase

| Symptom | Cause | Fix |
|---------|-------|-----|
| `docker: command not found` in WSL2 terminal | WSL2 integration not enabled in Docker Desktop | Settings → Resources → WSL Integration → enable your distro |
| `Cannot connect to the Docker daemon` | Docker Desktop not running | Start Docker Desktop from the Windows Start menu; wait for the whale icon in the system tray |
| Port 8080 already in use | Another process (or a previous container) is using port 8080 | Use `-p 8081:80` instead, or run `docker ps -a` to find and remove the old container |
| Container exits immediately after `docker run` (no `-d` flag confusion) | Ran a non-interactive command on an image that has no long-running process | Add `-d` for background services (Nginx), or `-it` for interactive containers (Ubuntu) |
| `docker run -it ubuntu bash` does nothing in Docker Desktop Exec tab | Exec tab doesn't support interactive TTY sessions | Use the WSL2 terminal for `docker run -it` commands |
| Stopped container still shows in Containers panel | Docker Desktop shows running containers by default | Toggle "Show all" at the top of the Containers panel |
| Image size in `docker images` doesn't match Docker Desktop Images panel | Both show the uncompressed size — they should match; a mismatch means you're comparing different tags | Check the tag column in both views |
| `docker pull` very slow on first run | Downloading all layers for the first time | Normal — subsequent pulls of the same base image are instant (layers cached) |

## Windows / WSL2 notes

- Run **all** `docker` commands from a **WSL2 terminal** (Ubuntu), not PowerShell or CMD. Path handling and TTY support are much better in WSL2.
- Docker Desktop on Windows routes all Docker API calls through the WSL2 backend VM. The GUI and the WSL2 terminal CLI reflect the **same live state** — an action in one appears instantly in the other.
- If `docker` is not found in your WSL2 terminal, open Docker Desktop → Settings → Resources → WSL Integration and toggle your distro ON, then restart the terminal.
- The Docker socket lives inside the WSL2 VM at `/var/run/docker.sock`. This is why Windows paths (`C:\Users\...`) are irrelevant inside containers.
- Line endings: if you create any shell scripts now or later, configure Git with `git config --global core.autocrlf false` to prevent CRLF line endings that break scripts inside Linux containers.

## Cleanup

### CLI

```bash
# Stop and remove all phase 1 containers
docker stop phase1-nginx phase1-ubuntu 2>/dev/null || true
docker rm   phase1-nginx phase1-ubuntu 2>/dev/null || true

# Remove pulled images
docker rmi nginx:stable-alpine ubuntu:24.04 hello-world 2>/dev/null || true

# Nuclear option — remove ALL stopped containers and unused images
docker system prune -f
```

### Docker Desktop

1. Containers panel → select `phase1-nginx` → click the trash icon (Delete)
2. Containers panel → select `phase1-ubuntu` → click the trash icon (Delete)
3. Images panel → select `nginx:stable-alpine` → click the three-dot menu → Remove
4. Images panel → select `ubuntu:24.04` → Remove
5. Alternatively: Docker Desktop → Settings → Troubleshoot → "Clean / Purge data" (removes everything)

## Cheat sheet

| Task | CLI | Docker Desktop |
|------|-----|----------------|
| Pull an image | `docker pull nginx:stable-alpine` | Images panel → search bar |
| Run a container (background) | `docker run -d -p 8080:80 --name c1 nginx:stable-alpine` | Images → Run button |
| Run interactively | `docker run -it ubuntu:24.04 /bin/bash` | Not supported in Desktop |
| List running containers | `docker ps` | Containers panel |
| List all containers | `docker ps -a` | Containers panel → Show all |
| View logs | `docker logs phase1-nginx` | Containers → container → Logs tab |
| Stop a container | `docker stop phase1-nginx` | Containers → ■ button |
| Remove a container | `docker rm phase1-nginx` | Containers → trash icon |
| List images | `docker images` | Images panel |
| View image layers | `docker history nginx:stable-alpine` | Images → image → Image layers tab |
| Remove an image | `docker rmi nginx:stable-alpine` | Images → three-dot → Remove |
| Full cleanup | `docker system prune -f` | Settings → Troubleshoot → Clean |

## Interview questions

**Q1: What is the difference between a Docker image and a Docker container?**
An image is a read-only, layered template — a static artifact stored in a registry. A container is a running instance of that image — a live, writable process. You can create many containers from the same image. Analogy: image = class definition, container = object instance.

**Q2: What is a Docker layer and why does it matter for build performance?**
Each instruction in a Dockerfile creates a new read-only layer on top of the previous one. Docker caches layers: if nothing above a layer changed, Docker reuses the cached layer instead of re-running that instruction. This makes rebuilds fast. Placing infrequently-changing instructions (like `RUN apt-get install`) before frequently-changing ones (like `COPY . .`) maximises cache hits.

**Q3: Why does Docker Desktop use WSL2 on Windows rather than running the Docker daemon natively?**
The Docker daemon (`dockerd`) requires Linux kernel features — namespaces and cgroups — to isolate containers. Windows does not expose these natively for Linux containers. WSL2 provides a real Linux kernel inside a lightweight VM, giving Docker the kernel it needs while allowing the Docker Desktop GUI and Windows tools to interoperate with it seamlessly.

**Q4: What does `-p 8080:80` mean in `docker run -p 8080:80 nginx`?**
It maps port 8080 on the host machine to port 80 inside the container. Any TCP traffic arriving at `localhost:8080` on your machine is forwarded to the Nginx process listening on port 80 inside the container. The format is always `host:container`.

**Q5: How is `docker ps` different from `docker ps -a`?**
`docker ps` shows only currently **running** containers. `docker ps -a` shows **all** containers including stopped, exited, and created-but-never-started ones. In Docker Desktop, the equivalent is toggling "Show all" in the Containers panel header.

## Next phase

Phase 2 covers writing your own Dockerfile to containerize a React Vite app, understanding image layers and layer caching, and measuring the impact of `.dockerignore` on build context size.
