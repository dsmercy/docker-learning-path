# Phase 2 — Dockerfiles

## What this phase teaches

You will write your first `Dockerfile` from scratch to containerize a React Vite application. Nginx serves the compiled static build inside the container. The focus is on understanding every Dockerfile instruction, how Docker's layer cache works, and why `.dockerignore` matters — especially for Node/React projects where `node_modules/` is enormous. You will measure build context size with and without `.dockerignore` and compare image sizes side by side in Docker Desktop.

> Note: This phase uses a two-stage Dockerfile (build stage + Nginx serve stage) even though multi-stage builds are formally introduced in Phase 8. The React/Vite toolchain makes a single-stage approach impractical — the build tools must not ship to production. Every instruction is explained in detail so you learn the concept alongside the practice.

## Prerequisites

- Phase 1 complete (Docker CLI fluency, Docker Desktop navigation)
- Docker Desktop running with WSL2 backend
- Node 20 available in your WSL2 distro (only needed to understand the build — Docker handles it)

## Estimated effort

2–3 days — Week 1–2 of the overall plan

## Architecture

```
Build Stage (node:20-alpine)          Serve Stage (nginx:stable-alpine)
┌──────────────────────────────┐      ┌──────────────────────────────────┐
│  COPY package.json           │      │  COPY nginx.conf                 │
│  RUN npm ci                  │ ───► │  COPY --from=build /app/dist     │
│  COPY . .                    │dist/ │  USER appuser (non-root)         │
│  RUN npm run build           │      │  EXPOSE 80                       │
└──────────────────────────────┘      │  CMD ["nginx", "-g", "daemon off;"] │
   ~350 MB (never shipped)            └──────────────────────────────────┘
                                         ~8–12 MB  ✅ shipped to prod
```

```
Browser
  └── http://localhost:3000
        └── Host port 3000 → Container port 80
              └── Nginx (non-root, stable-alpine)
                    └── /usr/share/nginx/html/  (compiled React app)
```

## Folder structure

```
phase-02-dockerfiles/
├── src/
│   ├── main.jsx          # React entry point
│   └── App.jsx           # Product listing component
├── index.html            # Vite HTML template
├── vite.config.js        # Vite config
├── package.json
├── nginx.conf            # Custom Nginx SPA config
├── Dockerfile            # Two-stage: build → serve
├── .dockerignore         # Excludes node_modules, dist, .git, etc.
└── README.md
```

## Quick start

Run all commands from your **WSL2 terminal** inside the `phase-02-dockerfiles/` folder.

```bash
# ── 1. Measure build context WITHOUT .dockerignore ────────────────────────────
#    First, install deps locally so node_modules/ exists, then build without ignore.
npm install
mv .dockerignore .dockerignore.bak
docker build -t phase2-storefront:no-ignore .
# Watch the first line: "Sending build context to Docker daemon  XX MB"
# node_modules/ alone will push this to 100–200 MB.

# ── 2. Restore .dockerignore and rebuild ─────────────────────────────────────
mv .dockerignore.bak .dockerignore
docker build -t phase2-storefront:prod .
# Build context should now be under 1 MB — only source files are sent.

# ── 3. Compare image sizes ────────────────────────────────────────────────────
docker images phase2-storefront
# phase2-storefront   prod        ~10 MB
# phase2-storefront   no-ignore   ~10 MB  (same — .dockerignore only affects context, not final size here)
# Note: in this two-stage build the final image is always small regardless;
# .dockerignore matters most for single-stage builds or when COPY . . runs before npm ci.

# ── 4. Run the container ──────────────────────────────────────────────────────
docker run -d  --name phase2-storefront  -p 3000:80  phase2-storefront:prod

# ── 5. Verify ─────────────────────────────────────────────────────────────────
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK

# Open in browser: http://localhost:3000
# You should see a product grid: Wireless Headphones, Running Shoes, Coffee Maker, Yoga Mat

# ── 6. Confirm non-root user ──────────────────────────────────────────────────
docker exec phase2-storefront whoami
# Expected: appuser

# ── 7. Inspect image layers ───────────────────────────────────────────────────
docker history phase2-storefront:prod
```

## Dockerfile — instruction-by-instruction explanation

```dockerfile
# Stage 1 — build
FROM node:20-alpine AS build
```
`FROM` sets the base image. `AS build` names this stage so we can reference it later with `COPY --from=build`. `node:20-alpine` is the official Node 20 image on Alpine Linux (~60 MB vs ~350 MB for `node:20`).

```dockerfile
WORKDIR /app
```
Sets the working directory inside the container. All subsequent `COPY`, `RUN`, and `CMD` instructions run relative to `/app`. Creates the directory if it doesn't exist. Prefer this over `RUN mkdir && cd` — it is declarative and cache-friendly.

```dockerfile
COPY package.json package-lock.json* ./
```
Copies **only** the dependency manifests first. This is the layer-cache trick: npm packages rarely change, so this layer is cached and `npm ci` is skipped on rebuilds as long as these files haven't changed.

```dockerfile
RUN npm ci --silent
```
`RUN` executes a command and commits the result as a new layer. `npm ci` installs exact versions from the lockfile (more reliable than `npm install` in CI/Docker). `--silent` suppresses progress noise.

```dockerfile
COPY . .
```
Copies all remaining source files into `/app`. This layer changes every time you edit source — which is fine because it comes **after** the expensive `npm ci` layer.

```dockerfile
RUN npm run build
```
Runs `vite build` which compiles the React app into static files in `/app/dist`.

```dockerfile
# Stage 2 — serve
FROM nginx:stable-alpine AS serve
```
Starts a **brand new** image from scratch. Nothing from Stage 1 is carried over except what we explicitly copy. This is why the final image is tiny — no Node, no npm, no source code.

```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
```
Creates a non-root system group and user. `-S` means system account (no password, no home dir). Running Nginx as a non-root user is a security best practice.

```dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf
```
Replaces Nginx's default site config with our SPA-aware config that redirects all paths to `index.html` (required for client-side routing).

```dockerfile
COPY --from=build /app/dist /usr/share/nginx/html
```
Copies **only** the compiled output from Stage 1 into the Nginx document root. The `--from=build` selector references the named build stage.

```dockerfile
RUN chown -R appuser:appgroup /usr/share/nginx/html ...
USER appuser
```
Grants ownership of Nginx's working paths to `appuser`, then switches to that user. From this point on, every process (including Nginx) runs as `appuser`, not root.

```dockerfile
EXPOSE 80
```
Documents that the container listens on port 80. Does **not** publish the port to the host — that is `-p 3000:80` at `docker run` time.

```dockerfile
CMD ["nginx", "-g", "daemon off;"]
```
The default command when the container starts. `daemon off` keeps Nginx in the foreground — required for Docker to track the process. Uses JSON array (exec form) not a shell string to avoid spawning a `/bin/sh` wrapper.

## .dockerignore — why each entry matters

| Entry | Reason |
|-------|--------|
| `node_modules/` | 100–300 MB of installed packages — Docker reinstalls them inside the container via `npm ci` |
| `dist/` | Old build output — Docker builds a fresh one inside the container |
| `.git/` | Git history has no place in an image; also contains credentials in some workflows |
| `.env`, `.env.*` | Never bake secrets into a build context — they end up in image layers |
| `coverage/` | Test output is irrelevant to the running container |
| `Dockerfile`, `.dockerignore` | Not needed inside the image itself |

## Docker Desktop — what to watch in this phase

### Step-by-step GUI actions

```
1. Before adding .dockerignore, run: docker build -t phase2-storefront:no-ignore .
   Watch the WSL2 terminal — note the "Sending build context to Docker daemon X MB" line.
   This is the build context size Docker Desktop receives before building.
   CLI equivalent: docker build (the first output line shows context size)

2. Add .dockerignore, rebuild: docker build -t phase2-storefront:prod .
   Note how the build context shrinks dramatically.
   CLI equivalent: same docker build command

3. Docker Desktop → Images panel
   Both phase2-storefront:no-ignore and phase2-storefront:prod appear as separate rows.
   Compare their sizes — both should be ~10 MB (the serve stage is always small).
   CLI equivalent: docker images phase2-storefront

4. Images panel → click phase2-storefront:prod → "Image layers" tab
   You will see layers for: base nginx, addgroup/adduser RUN, nginx.conf COPY,
   dist COPY, chown RUN. Each layer shows its compressed size.
   CLI equivalent: docker history phase2-storefront:prod

5. Images panel → click phase2-storefront:no-ignore → "Image layers" tab
   Compare layer count and sizes with :prod — they should be identical because
   both use the same two-stage structure. The difference only shows in build time.
   CLI equivalent: docker history phase2-storefront:no-ignore

6. After docker run, Containers panel → phase2-storefront → "Logs" tab
   Nginx logs appear here. Make a request to http://localhost:3000 and watch the
   access log entry appear in real time.
   CLI equivalent: docker logs -f phase2-storefront

7. Containers panel → phase2-storefront → "Inspect" tab
   Scroll to "Config" → "Cmd" — confirms CMD is ["nginx", "-g", "daemon off;"]
   Scroll to "Config" → "ExposedPorts" — confirms EXPOSE 80
   CLI equivalent: docker inspect phase2-storefront

8. Containers panel → phase2-storefront → "Exec" tab
   Type: whoami
   Expected output: appuser   (confirms non-root)
   Type: ls /usr/share/nginx/html
   Expected output: index.html, assets/ (compiled React output)
   CLI equivalent: docker exec phase2-storefront whoami
```

### Docker Desktop tips for Phase 2

- **Image layers tab** is the key feature for this phase. Every Dockerfile instruction maps to one or more layers. Look for which `RUN` creates the largest layer — it is usually `npm ci`. In the prod image you won't see that layer at all because Stage 1 is discarded.
- To see the **build context size** reported by Docker Desktop, watch the "Build" output in the terminal — Docker Desktop does not display it in the GUI, but you can open Docker Desktop → Settings → "Build" tab to see recent build history with durations.
- Use the **Images panel size column** to do the before/after `.dockerignore` comparison. Even though both final images are small in this phase, the habit of checking image size here will matter in Phase 8 where you optimise single-stage images.

### What Docker Desktop cannot do in Phase 2

- Docker Desktop cannot show the **build context transfer size** (the "Sending build context" number). You must watch the WSL2 terminal output for this critical measurement.
- Docker Desktop's Exec tab cannot run multi-line shell scripts interactively. Use the WSL2 terminal for any `docker exec` session that needs more than one command.

## Key Docker concepts covered

- **`FROM`** — sets the base image; every subsequent instruction builds on top of it
- **`WORKDIR`** — sets the working directory inside the container; cleaner than `RUN cd`
- **`COPY`** — copies files from the build context (your machine) into the image layer
- **`RUN`** — executes a command during the build and commits the result as a new layer
- **`EXPOSE`** — documents the port the app listens on (does not publish to the host)
- **`CMD`** — the default command to run when the container starts; exec form is preferred
- **`USER`** — switches the running user; always switch away from root before `CMD`
- **Layer caching** — Docker reuses cached layers if the instruction and its inputs haven't changed; copying manifests before source maximises cache hits
- **Build context** — the directory tree sent to the Docker daemon before building; `.dockerignore` removes unnecessary files to keep it small and fast
- **Multi-stage builds** — using multiple `FROM` instructions in one Dockerfile so build tools never reach the final image; the serve stage imports only compiled output via `COPY --from=<stage>`
- **Non-root user** — creating and switching to a dedicated system user reduces the blast radius if a container is compromised

## Image size comparison

Run this after completing the build steps:

```bash
docker images phase2-storefront --format "table {{.Tag}}\t{{.Size}}"
```

| Tag | Expected size | What it contains |
|-----|--------------|-----------------|
| `prod` | ~10–15 MB | nginx:stable-alpine + compiled JS/CSS only |
| `no-ignore` | ~10–15 MB | Same — two-stage build discards node_modules regardless |

**Key insight:** In this two-stage Dockerfile, `.dockerignore` mainly reduces **build context transfer time** and **build cache correctness**, not final image size. In a single-stage build (without a separate build stage), `.dockerignore` would be the only thing preventing `node_modules/` from landing in the image.

Build context size comparison (watch the terminal output):

| Scenario | Build context size |
|----------|--------------------|
| Without `.dockerignore` (after `npm install`) | ~150–300 MB |
| With `.dockerignore` | < 1 MB |

## Validation checklist

### Via CLI

- [ ] `docker build -t phase2-storefront:prod .` completes without errors
- [ ] `docker images phase2-storefront` shows the image under 50 MB
- [ ] `docker run -d --name phase2-storefront -p 3000:80 phase2-storefront:prod` starts cleanly
- [ ] `docker ps` shows `phase2-storefront` with status `Up`
- [ ] `curl -I http://localhost:3000` returns `HTTP/1.1 200 OK`
- [ ] `docker exec phase2-storefront whoami` returns `appuser`
- [ ] `docker history phase2-storefront:prod` shows the layer stack
- [ ] Build context size is visibly smaller with `.dockerignore` (compare terminal output)

### Via Docker Desktop

- [ ] `phase2-storefront:prod` appears in Images panel with size < 50 MB
- [ ] Images → `phase2-storefront:prod` → Image layers tab shows all expected layers
- [ ] Containers panel shows `phase2-storefront` with green running status
- [ ] Containers → `phase2-storefront` → Ports tab shows `3000:80`
- [ ] Containers → `phase2-storefront` → Logs tab shows Nginx access log entries
- [ ] Containers → `phase2-storefront` → Exec tab → `whoami` returns `appuser`
- [ ] Containers → `phase2-storefront` → Inspect tab → Cmd shows `nginx -g daemon off;`

## Completion criteria (pass/fail)

| Criterion | How to verify |
|-----------|--------------|
| Image builds successfully | `docker build` exits 0 |
| Container serves the React app at `http://localhost:3000` | `curl http://localhost:3000` returns product listing HTML |
| Image size is under 50 MB | `docker images` size column / Images panel in Docker Desktop |
| `.dockerignore` is present and reduces build context | Compare terminal "Sending build context" line with and without it |
| Each Dockerfile layer is identifiable in Docker Desktop | Images → image → Image layers tab — each layer maps to a Dockerfile instruction |
| Container runs as non-root | `docker exec phase2-storefront whoami` → `appuser` |

## Exercises

1. **Layer cache experiment (CLI + Desktop):** Edit `src/App.jsx` (change a product name) and rebuild. Notice how only the `COPY . .` and `RUN npm run build` layers re-run — the expensive `npm ci` layer is served from cache. Watch the layer timestamps change in the Image layers tab.

2. **Image layer audit (Docker Desktop):** Open Images → `phase2-storefront:prod` → Image layers. Identify which instruction created each layer. Calculate what percentage of the total image size comes from the base `nginx:stable-alpine` vs your application code. CLI equivalent: `docker history phase2-storefront:prod`.

3. **Build context size measurement (WSL2 terminal):** Run `du -sh .` inside the project folder before and after `npm install`, then build with and without `.dockerignore`. Record all four numbers in a table and add it to your README as a personal benchmark.

## Common mistakes in this phase

| Symptom | Cause | Fix |
|---------|-------|-----|
| `npm ci` fails with "missing package-lock.json" | `package-lock.json` not committed or not copied | Run `npm install` locally first to generate the lockfile, then rebuild |
| `COPY . .` sends 200 MB to the daemon | `.dockerignore` missing or not excluding `node_modules/` | Verify `.dockerignore` exists in the same directory as `Dockerfile` and lists `node_modules/` |
| Nginx returns 404 for all routes | `try_files` directive missing from nginx.conf | Use the provided `nginx.conf` with `try_files $uri $uri/ /index.html;` |
| `whoami` returns `root` inside the container | `USER` instruction missing or placed after `CMD` | Ensure `USER appuser` appears before `CMD` in the Dockerfile |
| Layer cache never hits — full rebuild every time | `COPY . .` appears before `RUN npm ci` | Always copy manifests (`package.json`) first, run `npm ci`, then copy source |
| Image size unexpectedly large (>100 MB) | Using `node:20` (full Debian) instead of `node:20-alpine` as build base, or forgetting the second `FROM` stage | Check `FROM` line — must be `node:20-alpine` and must have a second `FROM nginx:stable-alpine` stage |
| `exec format error` when container starts | CRLF line endings in a shell script copied into the container | Run `git config --global core.autocrlf false` and re-clone; for this phase it shouldn't apply since CMD uses exec form |
| Docker Desktop shows the image but size is "N/A" | Image is still being built or pull incomplete | Wait for the build to finish; refresh the Images panel |

## Windows / WSL2 notes

- Run `docker build` from the **WSL2 terminal**, not PowerShell. The build context is read from the filesystem, and WSL2 provides correct file permission metadata that Windows NTFS does not.
- The "Sending build context" message is printed to the WSL2 terminal stdout only — it does not appear in Docker Desktop's UI.
- If you cloned the repo on Windows (NTFS), check for CRLF in text files: `file nginx.conf` should say "ASCII text" not "ASCII text, with CRLF line terminators". If it shows CRLF, run `dos2unix nginx.conf` inside WSL2.
- `npm install` should be run inside the WSL2 terminal (not Windows PowerShell) to generate a lockfile with Linux-compatible paths.

## Cleanup

### CLI

```bash
docker stop phase2-storefront
docker rm   phase2-storefront
docker rmi  phase2-storefront:prod phase2-storefront:no-ignore
# Remove dangling build cache
docker builder prune -f
```

### Docker Desktop

1. Containers panel → `phase2-storefront` → ■ Stop → trash icon (Delete)
2. Images panel → `phase2-storefront:prod` → three-dot menu → Remove
3. Images panel → `phase2-storefront:no-ignore` → Remove
4. Images panel → filter by "dangling" or run `docker image prune -f` in terminal to remove intermediate build layers

## Cheat sheet

| Task | CLI | Docker Desktop |
|------|-----|----------------|
| Build image | `docker build -t phase2-storefront:prod .` | N/A — CLI only |
| List images + sizes | `docker images phase2-storefront` | Images panel (size column) |
| View layer stack | `docker history phase2-storefront:prod` | Images → image → Image layers tab |
| Run container | `docker run -d -p 3000:80 --name phase2-storefront phase2-storefront:prod` | Images → Run button |
| Check running user | `docker exec phase2-storefront whoami` | Containers → Exec tab → `whoami` |
| Stream logs | `docker logs -f phase2-storefront` | Containers → container → Logs tab |
| Inspect container config | `docker inspect phase2-storefront` | Containers → container → Inspect tab |
| Remove build cache | `docker builder prune -f` | Settings → Troubleshoot → Clean build cache |
| Measure context size | Watch "Sending build context" in terminal | N/A — terminal only |

## Interview questions

**Q1: What is the Docker layer cache and how do you optimise a Dockerfile to use it effectively?**
Docker caches the result of each instruction as a layer. If an instruction and all its inputs are unchanged from the previous build, Docker reuses the cached layer instead of re-running it. To maximise cache hits: place slow, infrequently-changing instructions early (e.g. `COPY package.json` then `RUN npm ci`) and fast, frequently-changing ones late (e.g. `COPY . .`). Changing a line invalidates that layer and all layers below it.

**Q2: What is the difference between `CMD` and `ENTRYPOINT`?**
Both define what runs when the container starts. `CMD` provides the default command and arguments — it can be overridden completely by passing a command to `docker run`. `ENTRYPOINT` sets the executable — it cannot be overridden without `--entrypoint`. They are often combined: `ENTRYPOINT` is the executable, `CMD` is the default arguments. For simple services like Nginx, `CMD` alone is sufficient.

**Q3: Why should you never run containers as root in production?**
Root inside a container maps to root on the host kernel. If an attacker exploits a vulnerability in the application, running as root gives them access to the entire container filesystem and potentially a path to host escape via kernel exploits or misconfigured volume mounts. A non-root user limits the blast radius: the attacker is confined to what that user can access.

**Q4: What does `.dockerignore` do and what happens if you omit it in a Node.js project?**
`.dockerignore` tells the Docker daemon which files to exclude from the build context — the directory tree sent from your machine to the daemon before building starts. Without it in a Node.js project, `node_modules/` (100–300 MB) is sent every time you build, dramatically slowing down the context transfer. It can also cause cache invalidation: if `node_modules/` is included in `COPY . .`, any package install locally changes that layer and breaks the cache.

**Q5: What is a multi-stage build and why is it essential for frontend applications?**
A multi-stage build uses multiple `FROM` instructions in one Dockerfile. Each stage can copy artifacts from a previous stage using `COPY --from=<stage>`. For a React app: Stage 1 uses `node:20-alpine` to install dependencies and run `vite build`. Stage 2 uses `nginx:stable-alpine` and copies only the compiled `dist/` folder. The final image contains no Node, no npm, no source code — just Nginx and static files. This reduces the image from ~350 MB to ~10 MB and removes an entire attack surface.

## Next phase

Phase 3 introduces Docker networking: you will create a custom bridge network, connect a React frontend and an Express.js mock API as separate containers, and use container DNS to have the frontend resolve the API by its container name.
