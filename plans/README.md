# Socmed plans — sequential execution

Execute **in order**. Stop after plan **09**; DNS is human-owned.

| Seq | Folder | Feature |
|-----|--------|---------|
| 01 | `07272026-01-caddy-edge-migration` | Apache → Caddy (alloro-dev) |
| 02 | `07272026-02-socmed-repo-scaffold` | GH repo + scaffold + shadcn B&W |
| 03 | `07272026-03-socmed-auth` | Auth |
| 04 | `07272026-04-socmed-profiles` | Profiles |
| 05 | `07272026-05-socmed-posts-feed` | Posts + feed |
| 06 | `07272026-06-socmed-comments` | Linear comments |
| 07 | `07272026-07-socmed-friendships` | Friend requests + mutuals |
| 08 | `07272026-08-socmed-media-uploads` | Photo uploads |
| 09 | `07272026-09-socmed-deploy-caddy` | Deploy wiring; leave DNS |
| 10 | `07282026-10-header-theme-toggle` | Header light/dark toggle |
| 11 | `07282026-11-comment-replies` | One-level comment replies |
| 12 | `07282026-12-comment-timestamps` | Relative timestamps on feed, comments, replies |

## Branch → host (hard rule)

- `main` → `socmed.rustinedave.com` (primary)
- `dev` → `socmed-dev.rustinedave.com`

## Human leftover after 09

Point both A records to `168.144.128.47` (see plan 09 `DNS.md` once written).
