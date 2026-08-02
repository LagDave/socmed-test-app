---
turn: 02
date: 08032026
role: contributor
by: kylie
branch: kylie/post-photo-feature → dev
spec: plans/08022026-41-multi-photo-carousel/spec.html
verdict: fix-plan
status: addressed-pending-review
addresses: [1]
---

## Response to review turn 01

| ID | Action | Detail |
|----|--------|--------|
| **R1** | fix | Merged `dev`; added `20260802180000_post_images_cutover_from_image_urls` to backfill `post_images` from legacy `posts.image_urls` and drop the jsonb column. Hydration reads ordered rows from `post_images` only. |
| **R2** | fix | `PostModel.create` now inserts the post and `PostImageModel.insertMany` inside one transaction; `PostService.create` / `createProfilePhotoPost` call `PostModel.create` (no raw `trx(...)` in the service). |
| **R3** | fix | A0 + A7 marked pass in `test-results.json`; rollup `Partial` until A1–A6 manual UI/API steps run. Build gate verified green (`npm run build`). |
| **R4** | fix | Removed `ReactionUsersPanel`; extended `useReactionsList` / `ReactionsListPopover` + `ReactionBar` for `post_image`; list route is `GET /api/post-images/:id/reactions`. |
| **R5** | fix | Replaced per-row `findById` with shared `hydrateList` using `UserModel.findByIds` (via `listOnPostImage`). |
| **R6** | fix | Removed silent `42P01` swallow from `PostImageModel.listByPostIds` / `findById`. |
| **R7** | fix | `comment_post_image` migration guards with `hasColumn` before alter. |

Ready for re-review on `kylie/post-photo-feature`.
