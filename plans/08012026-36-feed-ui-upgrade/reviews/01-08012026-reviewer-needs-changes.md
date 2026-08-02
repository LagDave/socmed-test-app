---
turn: 01
date: 08012026
role: reviewer
by: dave
branch: kylie/feed-ui-upgrade → dev
spec: plans/08012026-36-feed-ui-upgrade/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — Feed UI upgrade + multi-photo follow-up

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/51

Strong composer polish and the multi-photo gallery work are directionally right. Merge is blocked on **spec–code parity drift** (Rev 5 reversed media layout and added backend scope without updating locked sections), a **composer file-picker cancel bug**, and **stale plan migration docs**.

## Findings

### R1 — Spec / Done / constraints still describe full-bleed + frontend-only; Rev 5 changed both
**Severity:** must-fix

Rev 5 intentionally reversed Decision #4 (full-bleed → centered inset `PostMediaGallery`) and added `image_urls` migration + API payload changes. The spec **What**, **Done**, **Must not** (“Backend, schema, or API changes”), wire mock, and T3 task text still describe full-bleed and frontend-only. `test-results.json` was updated for centered galleries, but the spec body and Done checklist still claim full-bleed and mark those items ☑.

`plans/README.md` seq 36 blurb still says “full-bleed media.”

**Fix:** Append Rev 6 (or edit locked sections per process) so What / Done / Must not / T3 / README match shipped behavior: centered inset galleries, multi-photo (≤10), and the `20260801140000_post_image_urls` migration. Reconcile Done ☑ items with actual acceptance evidence — don’t check full-bleed when code is inset.

### R2 — Plan `migrations/README.md` contradicts shipped migration
**Severity:** must-fix  
**Where:** `plans/08012026-36-feed-ui-upgrade/migrations/README.md`

README still reads “No database migrations. Frontend-only visual polish.” PR adds `database/migrations/20260801140000_post_image_urls.ts`.

**Fix:** Document the `image_urls` jsonb column, backfill from `image_url`, and note deploy must run migrations before multi-photo posts work.

### R3 — Photo picker cancel leaves composer stuck in “Opening…”
**Severity:** must-fix  
**Where:** `frontend/src/components/FeedComposer.tsx` (`pickingPhotos`)

`setPickingPhotos(true)` runs on file input `click`; it clears only in `onChange`. Canceling the native picker does not fire `change`, so the Photos control can remain spinner + “Opening…” indefinitely and block further picks (label stays in picking state).

**Fix:** Reset `pickingPhotos` on `window` `focus` after opening the picker (same pattern as blur-safe collapse), or use `input.oncancel` with a focus fallback for Safari.

### R4 — `JSON.stringify` + type cast for jsonb insert is fragile
**Severity:** concern  
**Where:** `src/models/PostModel.ts` (`image_urls` insert), `src/utils/postImages.ts`

Insert uses `(JSON.stringify(urls) as unknown as PostRow["image_urls"])`. Knex/pg normally accept a JS array for jsonb; manual stringify risks double-encoding or a stored JSON **string** primitive if driver binding changes. `resolvePostImageUrls` only handles arrays — no parse fallback — so a mis-serialized row would silently collapse multi-photo posts to `image_url` only.

**Fix:** Pass `urls` directly to Knex; add a narrow parse guard in `resolvePostImageUrls` if string values are possible; add a round-trip test (create with 2 URLs → hydrate returns both).

### R5 — Partial multi-upload failure leaves orphan files
**Severity:** concern  
**Where:** `frontend/src/components/FeedComposer.tsx` (`Promise.all` uploads)

If upload 3 of 5 fails, earlier uploads may already be on disk with no post row referencing them.

**Fix:** Document as known limitation or switch to sequential upload with rollback/compensation (delete uploaded files on failure) — at minimum surface which file failed.

### R6 — No automated tests for new post-image validation / hydration
**Severity:** concern  
**Where:** `src/services/PostService.ts`, `src/utils/postImages.ts`, `database/migrations/20260801140000_post_image_urls.ts`

§20.1: new boundary validation (`UPLOAD_PATH_RE`, max 10 URLs) and hydration helper have no unit tests. Regression risk on the bug this PR claims to fix (photo create → detail error).

**Fix:** Add service tests for valid/invalid `imageUrls`, empty arrays, legacy `imageUrl`-only rows, and hydrated `imageUrls` length.

### R7 — Composer preview blob URLs not revoked on unmount
**Severity:** advisory  
**Where:** `frontend/src/components/FeedComposer.tsx`

Multi-image previews create several `createObjectURL` handles; unmount without cleanup leaks until navigation. `clearImages`/`removeImage` revoke on explicit actions only.

**Fix:** `useEffect` cleanup revoking all previews in `imagesRef` on unmount.

### R8 — Client accepts file types server rejects
**Severity:** advisory  
**Where:** `FeedComposer.tsx` `IMAGE_EXT_RE` (includes `.svg`, `.heic`) vs `uploadImage.ts` ALLOWED mimetypes

User can attach HEIC/SVG in UI; upload fails at POST with a generic error.

**Fix:** Align client `accept` / filter with server ALLOWED set, or extend server allowlist deliberately.

## What’s good

- Collapsed composer pill + inline Post row reads cohesive; expanded blur-safe collapse is thoughtful
- `PostMediaGallery` layouts (1–4+) and `.post-media-stage` centering match Rev 5 intent
- `showActionLabels` / `showActionLabels` gating keeps profile timeline on prior styling
- Server-side URL path validation (`UPLOAD_PATH_RE`) on create — good §5.2/§11.2 boundary
- Migration backfills `image_urls` from legacy `image_url`; `image_url` kept as first URL for compat
- Frontend build (`tsc -b && vite build`) passes on branch tip

## Merge gate

1. **R1** — Sync spec Rev 6 + Done + README with centered inset + multi-photo backend scope.
2. **R2** — Fix plan migrations README.
3. **R3** — Fix picker cancel / stuck “Opening…” state.
4. **R4–R6** — Address or document with written waivers before re-review.
5. **R7–R8** — Optional follow-up.

Also posted as **Changes requested** on PR #51.
