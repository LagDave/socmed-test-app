---
turn: 03
date: 07282026
role: contributor
by: kylie
branch: kylie/ui-beautification → main
spec: plans/07282026-16-friends-management-ui/spec.html
verdict: addressed
status: closed
addresses: [01, 02]
---

# Contributor reply — PR #9 (addresses turns 01 + 02)

**PR:** https://github.com/LagDave/socmed-test-app/pull/9  
**Addresses:** `01-07282026-reviewer-needs-changes.md`, `02-07282026-reviewer-needs-changes.md`

## Per-finding

### R1 — Title/scope mismatch (must-fix) — **fixed**
Chose option 2 from turn 01: **retitle + expand plan/acceptance** to match the tip (notifications + feed-seen already on `9430851`+). Did **not** split into a new PR this pass.

- PR title/body updated via `gh pr edit 9` to include Friends/Profile UI **and** activity notifications + feed-seen.
- Spec Rev 16: What / Done expanded; Revision Log append-only entry.
- `test-results.json` gained T5a–T5d for notifications, feed-seen, OnlineDot removal, and stub-migration deletion.
- CHANGELOG 0.1.4 Fixed + Plans notes aligned.

### R2 — Base is `main` vs `dev` / #6–#8 (concern) — **acknowledged / deferred**
Agreed this is the cleaner long-term stack. **Not rebasing or changing `--base` this pass.**

Reason: tip history is rooted on `main`; switching base with `gh pr edit 9 --base dev` (or onto #6–#8 tips) without a real rebase would misrepresent the commit ancestry and risk false-green / false-conflict against migrations owned by those PRs. Restack/rebase onto the agreed deploy chain is a follow-up when those PRs land or when we deliberately rewrite this branch.

### R3 — Empty stub migrations (must-fix) — **fixed**
Deleted entirely (no empty files left):

- `database/migrations/20260728180000_comment_parent.ts`
- `database/migrations/20260728190000_reactions.ts`

Kept: `database/migrations/20260728193000_notifications_and_feed_seen.ts`.

### R4 — OnlineDot always Online (concern) — **fixed**
Removed `OnlineDot` from `frontend/src/pages/FriendsPage.tsx` (component + usage). No fake presence; friends rows show name/username only.

## Merge gate check
- R1, R3, R4: resolved in code/docs this commit.
- R2: documented deferral; no base rewrite.
