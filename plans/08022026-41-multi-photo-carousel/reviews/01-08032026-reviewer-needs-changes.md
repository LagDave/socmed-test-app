---
turn: 01
date: 08032026
role: reviewer
by: dave
branch: kylie/post-photo-feature → dev
spec: plans/08022026-41-multi-photo-carousel/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — multi-photo carousel + per-photo comments/reactions (PR #57)

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/57

Solid feature direction: `post_images` table, per-photo comments/reactions, dedicated photo page, and an honest acceptance rollup (`Not Run`). Merge is blocked on a **schema collision with what’s already on `dev`**, a **§7.4** violation, and **unrun acceptance**.

## Findings

### R1 — Dual multi-photo schemas vs current `dev`
**Severity:** must-fix  
**Where:** this PR’s `post_images` vs `dev`’s `posts.image_urls` jsonb from #51

`dev` already ships multi-photo via `20260801140000_post_image_urls.ts` + `PostMediaGallery`. This PR introduces a parallel first-class `post_images` model (correct per its own spec) without a migration story that reconciles or replaces `image_urls`. Merge-tree shows conflicts across ~17 files (`PostCard`, `FeedComposer`, `PostMediaGallery`, `PostService`, etc.).

**Fix:** Before merge, pick one source of truth (recommend keep `post_images` for per-photo IDs/comments/reactions) and land a Rev that: migrates/backfills from `image_urls` → `post_images`, stops writing jsonb, and documents the cutover. Do not land both as live write paths.

### R2 — §7.4 inline Knex in `PostService.create`
**Severity:** must-fix  
**Where:** `src/services/PostService.ts` — `create`

`PostService.create` inserts into `posts` via `trx("posts").insert(...)` inside a transaction instead of routing through `PostModel`.

> ⚠️ **Constitution violation — §7.4 (All database access lives in `models/`)**  
> **Rule:** "All database access lives in `models/`"  
> **Issue:** Service performs Knex insert on `posts` directly.  
> **Fix:** Add `PostModel.create(..., trx)` (or equivalent) and call it from the transaction alongside `PostImageModel.insertMany`.

### R3 — Acceptance not evidenced
**Severity:** must-fix  
**Where:** `plans/08022026-41-multi-photo-carousel/test-results.json`

Rollup is honestly `Not Run`; A0–A7 are all `pending` with empty evidence. Spec status is **In Progress**. Fine for WIP; not merge-ready until items are `pass` with dated evidence or reviewer-signed waivers.

### R4 — Parallel “who reacted” UI
**Severity:** concern  
**Where:** `frontend/src/components/ReactionUsersPanel.tsx` vs `dev`’s `ReactionsListPopover` + `useReactionsList`

New photo panel reimplements fetch/panel/click-outside instead of extending the shared hook/popover for `post-images`. Pattern drift after #41.

**Fix:** Route photo who-reacted through `useReactionsList` / shared popover (or extract a thin target adapter).

### R5 — N+1 user hydration on photo reactors
**Severity:** concern  
**Where:** `src/services/ReactionService.ts` — `listUsersForPostImage`

`Promise.all(rows.map(UserModel.findById))` — `dev` already uses `UserModel.findByIds` for post/comment lists. Same fix should apply here.

### R6 — Silent missing-table swallow
**Severity:** concern  
**Where:** `src/models/PostImageModel.ts` — `listByPostIds` / `findById`

On Postgres `42P01`, returns empty/`undefined` instead of failing. Hides “forgot to migrate” in prod as “posts have no photos.”

**Fix:** Fail hard in non-test envs (or only soft-fail behind an explicit migrate-compat flag).

### R7 — `comment_post_image` migration not idempotent
**Severity:** concern  
**Where:** `database/migrations/20260802140000_comment_post_image.ts`

Sibling migrations use `hasColumn`/`hasTable` guards; this one always `alterTable`s. Re-run / branch-switch risk.

**Fix:** Guard with `hasColumn("comments", "post_image_id")` (and matching index checks) like the other Aug 2 migrations.

## Observations

- Spec decision to allow image-only via `body: " "` is intentional (Locked 7A) — leave as debt, don’t block on it.
- Photo vs post comment scoping on the FE (`commentsForPostImage(..., null)`) looks correct.
- `Promise.all` uploads can orphan files on partial failure — same known limitation as #51; follow-up OK.
- CHANGELOG still at `0.1.18`; will need a real bump when rebasing onto current `dev` (~`0.1.27`).

## Merge gate

R1 schema cutover vs `image_urls`, R2 §7.4, and R3 acceptance before merge. R4–R7 should be fixed or explicitly ignored with reasons.

Also posted as **Changes requested** on the PR.
