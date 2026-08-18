# Migrations — 08022026-41-multi-photo-carousel

## Expected (execute-time)

| Engine | File (suggested) | Change |
|--------|------------------|--------|
| PostgreSQL / Knex | `database/migrations/20260802120000_post_images.ts` | Create `post_images` table; backfill from existing `posts.image_url`. |

## Schema (locked)

```sql
post_images (
  id UUID PK DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL FK → posts(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  sort_order SMALLINT NOT NULL,  -- 0-based, contiguous per post
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, sort_order)
)
-- indexes: (post_id, sort_order), post_id
```

## Backfill

- For every `posts` row where `image_url IS NOT NULL`, insert one `post_images` row at `sort_order = 0` with that URL.
- Leave `posts.image_url` populated (first/cover image mirror for backward compat).

## Notes

- v1 cap: **10 images per post** enforced in service layer, not DB constraint.
- No changes to upload middleware — reuse existing `POST /api/uploads` per file.
- `posts.image_url` remains the **cover/first** image on create/update for legacy consumers until all renderers use `imageUrls[]`.
