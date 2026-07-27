# Socmed Test App

Black-and-white social platform (auth, posts, linear comments, friends).

## Stack

- Backend: Express + Knex + PostgreSQL (`src/`)
- Frontend: React 19 + Vite + Tailwind + shadcn (`frontend/`)
- Edge: Caddy on `alloro-asia`

## Branches → hosts

| Branch | Host |
|--------|------|
| `main` | `socmed.rustinedave.com` |
| `dev` | `socmed-dev.rustinedave.com` |

## Local (recommended)

Postgres in Docker; API + Vite on the host so edits hot-reload.

```bash
# 1. DB only
docker compose up -d

# 2. migrate once (against localhost:55432)
npm run migrate

# 3. API + web with watch
npm run dev
```

| Service | URL / port |
|---------|------------|
| Web UI (Vite) | http://localhost:5180 |
| API | http://localhost:3210 |
| Postgres | `localhost:55432` (`socmed` / `socmed` / `socmed_local`) |

Stop API/web containers if they were started earlier (they bind the same ports):

```bash
docker compose --profile full stop api web
```

Optional full Docker stack (no hot reload):

```bash
docker compose --profile full up --build -d
```

## Deploy

GitHub Actions auto-deploys on push:

| Branch | Host | Port |
|--------|------|------|
| `dev` | `socmed-dev.rustinedave.com` | 3201 |
| `main` | `socmed.rustinedave.com` | 3200 |

Manual re-run: **Actions → Deploy → Run workflow**.

Required repo secrets (`Settings → Secrets and variables → Actions`):

| Secret | Value |
|--------|-------|
| `DEPLOY_SSH_PRIVATE_KEY` | PEM / private key for the deploy user |
| `DEPLOY_SSH_HOST` | `168.144.128.47` |
| `DEPLOY_SSH_USER` | `root` |

Local/manual (same script the Action runs):

```bash
./scripts/deploy.sh dev
./scripts/deploy.sh main
```

Plans live in [`plans/`](plans/README.md). Execute sequentially; DNS is human-owned after plan 09.
