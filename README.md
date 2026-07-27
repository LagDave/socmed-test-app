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

## Local

```bash
cp .env.example .env
# create DB + user, then:
npm install
npm --prefix frontend install
npm run migrate
npm run dev
```

Plans live in [`plans/`](plans/README.md). Execute sequentially; DNS is human-owned after plan 09.
