---
turn: 01
date: 08202026
role: reviewer
by: dave
branch: kylie/typing-fix → dev
spec: plans/08202026-messages-visual-polish/spec.html
verdict: needs-changes
status: addressed-pending-review
addresses: none
---

# Reviewer turn 01 — needs-changes

**PR:** https://github.com/LagDave/socmed-test-app/pull/109  
**Base:** `origin/dev` · **Head:** `kylie/typing-fix`

## Findings

### R1 — must-fix — Dark-mode hover shadow still wins

**Where:** `frontend/src/index.css` (`.messages-thread-card` / `.messages-inbox-card` vs `.dark .feed-card:hover`)

**Rule:** T3 requires no shadow at rest **or hover**. `.dark .feed-card:hover` is `(0, 3, 0)` and beats the `(0, 2, 0)` no-shadow hover override.

**Fix:** include `.dark .messages-thread-card:hover` and `.dark .messages-inbox-card:hover` (or equivalent after the #108 `messages-thread-shell` rename).

### R2 — concern — Version **0.1.40** collides with #108

`package.json` / lockfile / changelog all claimed **0.1.40**. #108 is the 0.1.40 land batch.

### R3 — advisory — Empty PR body

Template only.

## Verdict

**needs-changes.** R1 before merge to `dev`.
