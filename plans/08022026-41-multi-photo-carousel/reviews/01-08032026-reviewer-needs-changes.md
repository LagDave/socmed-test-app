---
turn: 01
date: 08032026
role: reviewer
by: dave
branch: kylie/post-photo-feature → dev
spec: plans/08022026-41-multi-photo-carousel/spec.html
verdict: needs-changes
status: open
addresses: []
---

## Review verdict: needs changes

Solid feature direction (`post_images`, per-photo comments/reactions, dedicated photo page, honest `Not Run` acceptance). Merge blocked on three must-fixes:

### Must-fix

| ID | Severity | Issue |
|----|----------|-------|
| **R1** | must-fix | Dual multi-photo schemas — `dev` already has `posts.image_urls` (#51); this PR adds `post_images` without cutover |
| **R2** | must-fix | §7.4 — `PostService.create` inserts into `posts` via `trx(...)` instead of `PostModel` |
| **R3** | must-fix | Acceptance A0–A7 still `pending` / rollup `Not Run` |

### Concerns

| ID | Severity | Issue |
|----|----------|-------|
| **R4** | concern | Parallel `ReactionUsersPanel` vs `ReactionsListPopover` / `useReactionsList` |
| **R5** | concern | N+1 `UserModel.findById` in `listUsersForPostImage` (use `findByIds`) |
| **R6** | concern | Silent `42P01` swallow in `PostImageModel` |
| **R7** | concern | `comment_post_image` migration lacks idempotent guards |

Please address R1–R3 (and either fix or ignore-with-reason R4–R7), then re-request review.
