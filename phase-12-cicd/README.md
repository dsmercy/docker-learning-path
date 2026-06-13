# Phase 12 — CI/CD Pipeline

**Workflow:** `Code Push → Lint → Build → Trivy Scan → Push → Deploy`

## What this phase teaches

| Topic | Where to see it |
|---|---|
| GitHub Actions workflow | `.github/workflows/docker.yml` |
| Image tagging: `latest` + git SHA | `docker/metadata-action` → `tags:` block |
| Build caching in CI | `cache-from: type=gha` / `cache-to: type=gha,mode=max` |
| Trivy CVE gate (fails pipeline on CRITICAL) | `aquasecurity/trivy-action` → `exit-code: '1'` |
| Deploy from CI-built image | `docker-compose.prod.yml` — pulls from Docker Hub |
| Environment-specific Compose file | `docker-compose.prod.yml` vs local `docker compose build` |

## Setting up Docker Hub credentials in GitHub Actions

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret name | Value |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (not password) — create at hub.docker.com → Account Settings → Security |

## How the pipeline works

```
Push to main
  └─ lint job
       └─ build-and-scan job
            ├─ docker/build-push-action (API) → load to local daemon (no push yet)
            ├─ trivy-action (API) → exit 1 if CRITICAL CVEs found
            ├─ docker/build-push-action (API) → push to Docker Hub ✅
            ├─ docker/build-push-action (frontend) → load
            ├─ trivy-action (frontend) → exit 1 if CRITICAL CVEs found
            └─ docker/build-push-action (frontend) → push ✅
```

## Image tags

Every push to `main` produces two tags per image:
- `latest` — always points to the most recent build
- `sha-<7-char-git-sha>` — immutable, traceable to the exact commit

```bash
# Pull both tags locally and compare in Docker Desktop Images panel:
docker pull youruser/phase12-api:latest
docker pull youruser/phase12-api:sha-abc1234
```

## Deploy from CI-built images (after pipeline pushes)

```bash
export DOCKERHUB_USERNAME=youruser
docker compose -f docker-compose.prod.yml up -d
```

## Build caching — before vs after

| Run | Cold (no cache) | Warm (GHA cache) |
|---|---|---|
| API build | ~60s | ~15s |
| Frontend build | ~90s | ~20s |

## Deliberate CVE test (how to trigger a pipeline failure)

Change the API base image to an old vulnerable one:
```dockerfile
# In api/Dockerfile, temporarily change:
FROM node:14-alpine   # old image with known critical CVEs
```
Push to a branch — the Trivy step will exit code 1 and block the push step.

## Docker Desktop usage in CI/CD

CI pipelines run headless on GitHub Actions servers — Docker Desktop is not used during the pipeline run itself.

**Before pushing:** test locally with Docker Desktop before encoding commands in the workflow YAML.

**After the pipeline pushes an image:**
```bash
docker pull youruser/phase12-api:sha-abc1234
```
Then inspect in Docker Desktop → Images panel: verify layers, size, and Scout CVE tab.

## Completion checklist

- [ ] `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets configured in GitHub
- [ ] Push to `main` triggers the pipeline automatically
- [ ] Pipeline completes in under 5 minutes with layer caching
- [ ] Images tagged with `latest` and git SHA — both visible in Docker Desktop Images panel after pull
- [ ] Changing base image to `node:14-alpine` fails the pipeline at the Trivy step
- [ ] `docker compose -f docker-compose.prod.yml up -d` runs the CI-built image locally
