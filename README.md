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

## Local (Docker)

```bash
docker compose up --build -d
```

| Service | URL / port |
|---------|------------|
| Web UI | http://localhost:5180 |
| API | http://localhost:3210 |
| Postgres | `localhost:55432` (`socmed` / `socmed` / `socmed_local`) |

```bash
docker compose logs -f
docker compose down
```

Plans live in [`plans/`](plans/README.md). Execute sequentially; DNS is human-owned after plan 09.
