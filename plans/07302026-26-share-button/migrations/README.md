# Migrations — 07302026-26-share-button

## Expected (execute-time)

| Engine | File (suggested) | Change |
|--------|------------------|--------|
| PostgreSQL / Knex | `database/migrations/20260730180000_post_shares.ts` | Add nullable `posts.shared_from_post_id` → `posts(id)` `ON DELETE SET NULL`, index `shared_from_post_id`. Guard with `hasColumn`. |

## Notes

- No separate `shares` table in v1 — a share is a `posts` row that points at the original.
- Wrapper posts use empty `body` and null `image_url`; display content comes from the hydrated original.
- Landed at execute on 2026-07-30 (`npm run migrate` Batch 6).
