# Migrations — Feed UI Upgrade (Plan 36)

## Expected (execute-time)

| Engine | File | Change |
|--------|------|--------|
| PostgreSQL / Knex | `database/migrations/20260801140000_post_image_urls.ts` | Add nullable `posts.image_urls` jsonb column; backfill existing rows from `image_url` via `jsonb_build_array(image_url)`. Guard with `hasColumn`. |

## Notes

- `image_url` is kept as the first URL for backward compatibility with clients that only read the legacy field.
- Multi-photo posts require `image_urls`; deploy must run `npm run migrate` before multi-photo create/hydrate works in production.
- Rev 5 follow-up added this migration alongside composer multi-select (≤10 photos) and centered inset `PostMediaGallery` layouts.
