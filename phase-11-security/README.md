# Phase 11 — Security Hardening

**Project:** Harden the Phase 7 stack — no new application features.

## What this phase teaches

| Hardening technique | Where applied | How to verify |
|---|---|---|
| Non-root user | `api/Dockerfile` → `USER appuser` | `docker exec phase11-api whoami` → `appuser` |
| Read-only root filesystem | `docker-compose.yml` → `read_only: true` | `docker exec phase11-api touch /test` → permission denied |
| Docker secrets | `docker-compose.yml` → `secrets:` block | `docker inspect phase11-api` → Env has no connection string |
| Drop all Linux capabilities | `docker-compose.yml` → `cap_drop: [ALL]` | `docker inspect phase11-api` → CapAdd: null |
| Resource limits (memory + CPU) | `docker-compose.yml` → `deploy.resources.limits` | Docker Desktop → Stats tab shows ceiling |
| Image CVE scanning (Trivy) | CLI workflow below | Zero critical CVEs on production images |
| Image CVE scanning (Scout) | Docker Desktop → Images → Scout tab | Same CVE data, GUI view |

## Quick start

```bash
docker compose up -d --build
```

## Verify secrets are NOT in environment variables

```bash
# Should show PORT and NODE_ENV — no connection string
docker inspect phase11-api --format '{{json .Config.Env}}'
```

Docker Desktop: Containers → phase11-api → **Inspect tab** → look for `Env` — confirm no `mongodb://` string.

The secret is only accessible inside the container at `/run/secrets/mongodb_uri`.

## Verify read-only filesystem

```bash
docker exec phase11-api touch /test
# Expected: touch: /test: Read-only file system
```

## Verify non-root

```bash
docker exec phase11-api whoami
# Expected: appuser
```

## CVE scanning with Trivy

```bash
# Install Trivy: https://github.com/aquasecurity/trivy#installation
# On Windows via Scoop:
scoop install trivy

# Scan the API image
trivy image phase-11-security-api:latest

# Scan the MongoDB image
trivy image mongo:7.0
```

## CVE scanning with Docker Scout (Docker Desktop)

1. Open Docker Desktop → Images panel
2. Click `phase-11-security-api` image
3. Click **Docker Scout** tab
4. Review Critical / High / Medium / Low CVE counts
5. Click **Recommendations** to see suggested safer base image tags

CLI equivalent:
```bash
docker scout cves phase-11-security-api:latest
docker scout recommendations phase-11-security-api:latest
```

## Resource limits

Memory and CPU limits are set in the `deploy.resources.limits` block.
Docker Desktop → Containers → any container → **Stats tab** — the memory graph will plateau at the limit.

```bash
docker stats phase11-api phase11-db
```

## Completion checklist

- [ ] `docker exec phase11-api whoami` returns `appuser` (non-root)
- [ ] `docker exec phase11-api touch /test` returns read-only error
- [ ] `docker inspect phase11-api` Env shows no MongoDB connection string
- [ ] Docker Scout tab shows zero critical CVEs on production images
- [ ] Trivy CLI scan matches Scout findings
- [ ] Stats tab shows memory stays below configured limit under load
