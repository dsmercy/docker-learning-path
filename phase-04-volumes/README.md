# Phase 4 — Docker Volumes

## What this phase teaches

You will create a named Docker volume, mount it into a container, and prove that data written inside the container survives across `docker stop`, `docker rm`, and even replacement with a brand-new container. The project is a minimal wishlist API that writes items to a JSON file on the volume. The Docker Desktop **Volumes → Data tab** gives you a visual file browser to confirm persistence without needing to exec into a container.

## Prerequisites

- Phase 3 complete (Docker networking, container DNS, port mapping)
- Docker Desktop running with WSL2 backend

## Estimated effort

2 days — Week 2–3 of the overall plan

## Architecture

```
Host (Windows 11 / WSL2)
└── Named volume: wishlist-data
      └── /data/wishlist.json   ← written by the API, persists forever

Docker Engine
└── Container: wishlist-api  (node:20-alpine, non-root appuser)
      └── /data/               ← mount point of wishlist-data volume
            └── wishlist.json

Host port mapping:
  localhost:3001  →  wishlist-api:3001
```

```
Persistence proof sequence:

  1. docker run  (container v1 + volume)  →  POST /wishlist  →  data written to volume
  2. docker stop + docker rm (container v1 deleted)
  3. docker run  (container v2 + same volume)  →  GET /wishlist  →  data still there ✅
```

## Folder structure

```
phase-04-volumes/
├── api/
│   ├── server.js        # Express — GET/POST /wishlist, DELETE /wishlist/:id, GET /health
│   ├── package.json
│   ├── Dockerfile       # node:20-alpine, non-root appuser, /data mount point
│   ├── .dockerignore
│   └── .gitignore
└── README.md
```

## Quick start

Run all commands from your **WSL2 terminal** inside `phase-04-volumes/`.

```bash
# ── 1. Build the API image ────────────────────────────────────────────────────
docker build -t phase4-wishlist:latest ./api

# ── 2. Create the named volume ────────────────────────────────────────────────
docker volume create wishlist-data

# Verify it exists
docker volume ls | grep wishlist-data

# ── 3. Run the container with the volume mounted ──────────────────────────────
docker run -d --name wishlist-api -p 3001:3001 -v wishlist-data:/data phase4-wishlist:latest

# ── 4. Confirm the API is healthy ─────────────────────────────────────────────
curl http://localhost:3001/health
# Expected: {"status":"ok","service":"wishlist-api","dataFile":"/data/wishlist.json"}

# ── 5. Add items to the wishlist ──────────────────────────────────────────────
curl -s -X POST http://localhost:3001/wishlist -H "Content-Type: application/json" -d '{"name":"Mechanical Keyboard","price":129.99}'

curl -s -X POST http://localhost:3001/wishlist -H "Content-Type: application/json" -d '{"name":"USB-C Hub","price":49.99}'

curl -s -X POST http://localhost:3001/wishlist -H "Content-Type: application/json" -d '{"name":"Monitor Stand","price":39.99}'

# Verify items are saved
curl http://localhost:3001/wishlist
# Expected: JSON array of 3 items

# ── 6. PERSISTENCE TEST 1: survive container stop + start ────────────────────
docker stop wishlist-api
docker start wishlist-api
curl http://localhost:3001/wishlist
# Expected: same 3 items ✅

# ── 7. PERSISTENCE TEST 2: survive container deletion + recreation ────────────
docker stop wishlist-api
docker rm   wishlist-api

# Volume is NOT deleted by docker rm — only the container is gone
docker volume ls | grep wishlist-data   # still exists ✅

# Start a brand-new container with the same volume
docker run -d --name wishlist-api -p 3001:3001 -v wishlist-data:/data phase4-wishlist:latest

curl http://localhost:3001/wishlist
# Expected: same 3 items ✅ — data was never in the container, always in the volume

# ── 8. Delete an item ─────────────────────────────────────────────────────────
# Replace <id> with the actual id from the GET response above
curl -X DELETE http://localhost:3001/wishlist/<id>
curl http://localhost:3001/wishlist
# Expected: 2 items remaining

# ── 9. Browse the volume file directly (no exec needed) ──────────────────────
# Docker Desktop → Volumes → wishlist-data → Data tab
# Or via CLI helper container:
docker run --rm -v wishlist-data:/data alpine cat /data/wishlist.json
```

## Commands reference

### Volume

| Command | What it does | When to use it |
|---------|-------------|----------------|
| `docker volume create wishlist-data` | Creates a named volume | Once before first run |
| `docker volume ls` | Lists all volumes | Verify volume exists |
| `docker volume inspect wishlist-data` | Shows driver, mount point (WSL2 path), creation date | Debugging |
| `docker volume rm wishlist-data` | Permanently deletes the volume and all its data | Cleanup only |
| `docker volume prune` | Removes all unused (unattached) volumes | Clean up after testing |

### Run / Mount

| Command | What it does | When to use it |
|---------|-------------|----------------|
| `docker run -v wishlist-data:/data ...` | Mounts the named volume at `/data` inside the container | Every run — volume persists data across container lifecycles |
| `docker run -v wishlist-data:/data:ro ...` | Mounts the volume read-only | When a container should read but not write |
| `docker run -v $(pwd)/data:/data ...` | Bind mount — maps a host directory into the container | Development / local file editing |

### Inspect

| Command | What it does |
|---------|-------------|
| `docker volume inspect wishlist-data` | Full JSON: driver, mountpoint, labels, creation date |
| `docker run --rm -v wishlist-data:/data alpine cat /data/wishlist.json` | Read the volume's JSON file without exec-ing into the API container |
| `docker run --rm -v wishlist-data:/data alpine ls -la /data` | List all files in the volume |

### Clean

| Command | What it does |
|---------|-------------|
| `docker stop wishlist-api && docker rm wishlist-api` | Removes the container; volume survives |
| `docker volume rm wishlist-data` | Deletes the volume and all wishlist data permanently |
| `docker system prune -f --volumes` | Removes all stopped containers, unused images, AND unused volumes |

## Core concepts explained

### Named volumes vs bind mounts

| | Named volume | Bind mount |
|--|-------------|------------|
| **Syntax** | `-v wishlist-data:/data` | `-v /home/user/data:/data` |
| **Location** | Managed by Docker inside the WSL2 VM | A directory on the host filesystem |
| **Use case** | Databases, persistent state, anything that needs Unix permissions | Development — editing source files live |
| **Windows gotcha** | Stored in WSL2 VM — accessible only via Docker Desktop or helper container | NTFS doesn't support Unix permissions; file permission changes inside container don't persist |
| **Performance** | Fast — stays in WSL2 VM | Slower for write-heavy workloads on Windows (NTFS ↔ WSL2 translation) |

**Rule of thumb:** use named volumes for anything that needs to survive container recreation. Use bind mounts for development hot-reload. Never use bind mounts for database data directories on Windows.

### Volume lifecycle — independent from containers

This is the most important concept in Phase 4:

```
docker rm <container>   →  container deleted, volume UNTOUCHED
docker volume rm <vol>  →  volume (and all data) deleted permanently
docker compose down     →  containers and networks removed, volumes UNTOUCHED
docker compose down -v  →  containers, networks, AND volumes removed
```

A volume only dies when you explicitly ask Docker to delete it. This means:
- Your PostgreSQL data survives container crashes and upgrades (Phase 7).
- Forgetting `-v` on `docker compose down` is safe — data is preserved.

### Where named volumes live on Windows

Named volumes are stored inside the WSL2 virtual machine at:
```
\\wsl$\docker-desktop-data\data\docker\volumes\wishlist-data\_data
```

You can technically navigate there in Windows Explorer, but **don't**. The path is inside the WSL2 VM's virtual disk. Use Docker Desktop → Volumes → Data tab instead, which is the supported, safe way to browse volume contents on Windows.

### Bind mount permission problem on Windows

If you tried `-v C:\Users\you\data:/data` on Windows, the NTFS filesystem doesn't support Unix-style permissions (`chown`, `chmod`). When Node tries to write a file with the correct owner, it works — but permission bits aren't preserved, and some tools (PostgreSQL, Redis) refuse to start if their data directory has wrong permissions. Named volumes live in the Linux-native WSL2 filesystem and have proper Unix permission support.

## Docker Desktop — what to watch in this phase

### Step-by-step GUI actions

```
1. Run: docker volume create wishlist-data
   Docker Desktop → Volumes panel (left sidebar)
   wishlist-data appears instantly with driver "local"
   CLI equivalent: docker volume ls

2. Volumes panel → click wishlist-data → "Inspect" tab
   See: driver (local), mountpoint (WSL2 internal path), creation date
   CLI equivalent: docker volume inspect wishlist-data

3. Volumes panel → click wishlist-data → "Data" tab
   At this point: empty (no container has written anything yet)
   CLI equivalent: docker run --rm -v wishlist-data:/data alpine ls /data

4. Start the container: docker run -d --name wishlist-api -p 3001:3001 -v wishlist-data:/data phase4-wishlist:latest
   POST a few items: curl -X POST http://localhost:3001/wishlist -H "Content-Type: application/json" -d '{"name":"Keyboard","price":129}'

5. Volumes panel → wishlist-data → "Data" tab (refresh)
   wishlist.json now appears in the file browser — click it to view the contents
   CLI equivalent: docker run --rm -v wishlist-data:/data alpine cat /data/wishlist.json

6. PERSISTENCE TEST via Docker Desktop:
   Containers panel → wishlist-api → ■ Stop button
   Containers panel → wishlist-api → trash icon (Delete)
   Volumes panel → wishlist-data → Data tab
   wishlist.json is STILL THERE ✅ — the container is gone but the volume persists

7. Start a new container: docker run -d --name wishlist-api -p 3001:3001 -v wishlist-data:/data phase4-wishlist:latest
   Volumes panel → wishlist-data → Data tab
   Same wishlist.json, same contents ✅

8. Containers panel → wishlist-api → "Inspect" tab → scroll to "Mounts"
   Shows the volume name, source (host path in WSL2), destination (/data), mode (rw)
   CLI equivalent: docker inspect wishlist-api --format '{{json .Mounts}}'

9. To prove volumes are independent of containers:
   docker volume rm wishlist-data  (while no container is attached)
   Volumes panel → wishlist-data is gone
   Start the container again — GET /wishlist returns empty array []
   The data is gone because the volume was deleted, not the container
```

### Docker Desktop tips for Phase 4

- The **Volumes → Data tab** is the standout Docker Desktop feature for this phase. It lets you browse, view, and even edit files inside a named volume directly from the Windows GUI — no `docker exec`, no helper containers needed. Use it as your primary way to verify that the wishlist JSON is being written and persisted.
- After deleting and recreating the container, open the Data tab **before** making any API calls to prove the data was never in the container — it was always in the volume.
- The **Inspect tab** on a volume shows the WSL2-internal mountpoint path. It looks like `/var/lib/docker/volumes/wishlist-data/_data`. This is inside the WSL2 VM — not directly accessible from Windows Explorer without navigating the `\\wsl$` share, which is unsupported for volume paths.

### What Docker Desktop cannot do in Phase 4

- Docker Desktop's Volumes Data tab is **read-only for most volume types** — you can view files but you should not rely on editing them through the GUI in production. For programmatic access, use a helper container or `docker exec`.
- Docker Desktop **cannot create a named volume** through the GUI — use `docker volume create` in the terminal.

## Validation checklist

### Via CLI

- [ ] `docker volume ls` shows `wishlist-data` with driver `local`
- [ ] `docker volume inspect wishlist-data` returns valid JSON with mountpoint
- [ ] `curl http://localhost:3001/health` returns `{"status":"ok",...}`
- [ ] `curl -X POST ...` adds items and `GET /wishlist` returns them
- [ ] Items persist after `docker stop` + `docker start`
- [ ] Items persist after `docker stop` + `docker rm` + new `docker run` with same volume
- [ ] `docker volume rm wishlist-data` removes volume; new container starts with empty wishlist
- [ ] `docker exec wishlist-api whoami` returns `appuser`

### Via Docker Desktop

- [ ] Volumes panel shows `wishlist-data` after `docker volume create`
- [ ] Volumes → `wishlist-data` → Data tab shows `wishlist.json` after first POST
- [ ] Volumes → `wishlist-data` → Data tab still shows `wishlist.json` after container is deleted
- [ ] Volumes → `wishlist-data` → Inspect tab shows mountpoint and driver
- [ ] Containers → `wishlist-api` → Inspect → Mounts section shows volume binding to `/data`
- [ ] After `docker volume rm`, the volume disappears from Volumes panel

## Completion criteria (pass/fail)

| Criterion | How to verify |
|-----------|--------------|
| Wishlist items persist after `docker stop` + `docker start` | `curl GET /wishlist` after restart returns same items |
| Wishlist items persist after `docker rm` + new `docker run` with same volume | `curl GET /wishlist` on new container returns same items |
| Volume visible in Docker Desktop Volumes panel | Volumes panel shows `wishlist-data` |
| Persistence confirmed visually in Data tab (not just via curl) | Volumes → `wishlist-data` → Data tab → `wishlist.json` present after container deleted |
| `docker volume rm` empties the wishlist on next run | New container returns `[]` from `GET /wishlist` |
| Container runs as non-root | `docker exec wishlist-api whoami` → `appuser` |

## Exercises

1. **Bind mount experiment (WSL2 terminal):** Instead of a named volume, run the container with a bind mount to a directory in your WSL2 home: `docker run -d --name wishlist-bind -p 3002:3001 -v ~/wishlist-data:/data phase4-wishlist:latest`. Add items, then `ls ~/wishlist-data` in your WSL2 terminal to see the file directly on the host. Compare: with named volumes you need Docker Desktop or a helper container to view the file; with bind mounts you can `cat` it directly. Note the trade-offs.

2. **Volume backup (CLI):** Export the volume contents to a tar file on your host: `docker run --rm -v wishlist-data:/data -v $(pwd):/backup alpine tar czf /backup/wishlist-backup.tar.gz -C /data .`. Then extract it: `tar tzf wishlist-backup.tar.gz`. This is the standard pattern for backing up Docker volume data — you will use it in Phase 7 for PostgreSQL.

3. **Read-only mount (CLI + Docker Desktop):** Run a second container using the same volume but mounted read-only: `docker run --rm -v wishlist-data:/data:ro alpine cat /data/wishlist.json`. Confirm it can read the file. Then try writing: `docker run --rm -v wishlist-data:/data:ro alpine sh -c "echo test > /data/test.txt"` — it should fail with "Read-only file system". Check the Inspect tab in Docker Desktop — the mount mode should show `ro`.

## Common mistakes in this phase

| Symptom | Cause | Fix |
|---------|-------|-----|
| `GET /wishlist` returns `[]` after container restart | Container was run without `-v wishlist-data:/data` — data was written to the container layer, not the volume | Always include `-v wishlist-data:/data`; data in the container layer is lost on `docker rm` |
| `docker volume rm wishlist-data` fails with "volume is in use" | A container (even stopped) is still referencing the volume | `docker rm wishlist-api` first, then `docker volume rm wishlist-data` |
| `EACCES: permission denied` writing to `/data` in the container | Volume was pre-created with root ownership before `chown` ran | Use `docker volume rm wishlist-data && docker volume create wishlist-data` and rerun; the Dockerfile's `chown` runs at build time |
| Volumes Data tab in Docker Desktop shows empty even after POSTing items | Viewing before Docker Desktop has refreshed — click the refresh button in the Data tab | Hit the refresh icon in the Volumes → Data tab |
| `docker compose down` deleted my volume | `docker compose down -v` was used — `-v` flag explicitly removes volumes | Use `docker compose down` (no `-v`) to preserve volume data |
| Bind mount from Windows path (`C:\Users\...`) has permission errors | NTFS doesn't support Unix permissions needed by the container process | Use a named volume or a WSL2 Linux path (`/home/user/...`) for bind mounts |
| Data tab shows `wishlist.json` but it appears empty | File was created but nothing was written yet (no POST requests made) | Make at least one `POST /wishlist` request before checking the Data tab |

## Windows / WSL2 notes

- Named volumes are stored inside the WSL2 VM's virtual disk — **not** on your Windows NTFS drive. This is intentional: Linux permissions are preserved correctly, and I/O is fast.
- The volume path shown in `docker volume inspect` (e.g. `/var/lib/docker/volumes/wishlist-data/_data`) is a path **inside the WSL2 VM**, not a Windows path. You cannot navigate to it in Windows Explorer normally.
- To access volume contents from Windows without Docker Desktop: navigate to `\\wsl$\docker-desktop-data\data\docker\volumes\wishlist-data\_data` in Windows Explorer. This works but is unsupported — prefer Docker Desktop's Data tab.
- When using bind mounts in WSL2, always use the Linux path format: `-v /home/yourname/data:/data`. Never use Windows paths (`C:\Users\...`) in `-v` flags — they either fail or behave unexpectedly.
- `docker compose down` (without `-v`) is safe — it does **not** delete named volumes. `docker compose down -v` deletes them. Memorise this difference before Phase 7 when PostgreSQL data is involved.

## Cleanup

### CLI

```bash
# Stop and remove the container (volume survives)
docker stop wishlist-api
docker rm   wishlist-api

# Remove the volume (destroys all wishlist data)
docker volume rm wishlist-data

# Remove the image
docker rmi phase4-wishlist:latest

# One-liner
docker stop wishlist-api 2>/dev/null; \
docker rm   wishlist-api 2>/dev/null; \
docker volume rm wishlist-data 2>/dev/null; \
docker rmi phase4-wishlist:latest 2>/dev/null; \
echo "Phase 4 cleaned up"
```

### Docker Desktop

1. Containers panel → `wishlist-api` → ■ Stop → trash icon (Delete)
2. Volumes panel → `wishlist-data` → Delete button (only appears when no container is using it)
3. Images panel → `phase4-wishlist:latest` → three-dot → Remove

## Cheat sheet

| Task | CLI | Docker Desktop |
|------|-----|----------------|
| Create named volume | `docker volume create wishlist-data` | N/A — CLI only |
| List volumes | `docker volume ls` | Volumes panel |
| Inspect volume | `docker volume inspect wishlist-data` | Volumes → volume → Inspect tab |
| Browse volume files | `docker run --rm -v wishlist-data:/data alpine ls /data` | Volumes → volume → Data tab ✅ |
| Read a file in a volume | `docker run --rm -v wishlist-data:/data alpine cat /data/wishlist.json` | Volumes → volume → Data tab → click file |
| Mount volume into container | `docker run -v wishlist-data:/data ...` | N/A — CLI only |
| View container's mounts | `docker inspect wishlist-api` → Mounts section | Containers → container → Inspect → Mounts |
| Remove volume | `docker volume rm wishlist-data` | Volumes panel → Delete |
| Remove unused volumes | `docker volume prune` | N/A — CLI only |

## Interview questions

**Q1: What is the difference between a named volume and a bind mount? When would you choose each?**
A named volume is managed entirely by Docker — it lives inside the Docker/WSL2 storage area, has proper Unix permissions, and survives container deletion. A bind mount maps a specific host directory into the container — you control the path, and files are visible directly on the host. Use named volumes for persistent state that containers own (databases, app data). Use bind mounts for development (mounting source code so the container sees live edits). On Windows, named volumes are strongly preferred for anything that needs Unix permissions, because NTFS does not support `chmod`/`chown` semantics.

**Q2: If I run `docker rm` on a container that has a named volume mounted, what happens to the volume?**
Nothing — the volume is untouched. `docker rm` only removes the container (its writable layer and metadata). Named volumes have an independent lifecycle. You must explicitly run `docker volume rm <name>` to delete a volume. This independence is the whole point: containers are ephemeral, data is not.

**Q3: What does `docker compose down -v` do differently from `docker compose down`?**
`docker compose down` stops and removes containers and networks but leaves named volumes intact. `docker compose down -v` additionally removes all named volumes declared in the `volumes:` section of the Compose file. This distinction is critical in production: `down` is safe for redeployments, `down -v` permanently destroys all data. Always double-check before running `down -v`.

**Q4: Why shouldn't you use a bind mount to a Windows path (`C:\Users\...`) for a database volume?**
NTFS (Windows filesystem) does not implement POSIX file permissions. When a containerised database like PostgreSQL checks its data directory permissions (e.g. must be owned by the `postgres` user with mode `0700`), the check fails because NTFS cannot represent those permissions. PostgreSQL refuses to start. Named volumes live in the WSL2 VM's ext4 filesystem which does support POSIX permissions, so they work correctly.

**Q5: How would you back up and restore a named Docker volume?**
Back up: spin up a temporary Alpine container with both the volume and a host bind mount, then tar the contents: `docker run --rm -v myvolume:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz -C /data .`. Restore: create a fresh volume and reverse the process: `docker run --rm -v myvolume:/data -v $(pwd):/backup alpine tar xzf /backup/backup.tar.gz -C /data`. This approach works regardless of what is stored in the volume.

## Next phase

Phase 5 introduces Docker Compose: you will replace all the manual `docker run`, `docker network create`, and `docker volume create` commands from Phases 3 and 4 with a single `docker-compose.yml` file, and add Redis for session/cart caching.
