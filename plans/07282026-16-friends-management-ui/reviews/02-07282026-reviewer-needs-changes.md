---
turn: 02
date: 07282026
role: reviewer
by: dave
branch: kylie/ui-beautification → main
spec: plans/07282026-16-friends-management-ui/spec.html
verdict: needs-changes
status: open
addresses: [01]
---

# Review — PR #9 follow-up (stub migrations + reinforce turn 01)

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/9  
**Addresses:** turn 01 (still open)

Turn 01 (scope mismatch + base branch) remains unresolved. This turn adds a new must-fix found on a thorough re-read and reinforces related UI honesty issues.

## Findings

### R1 — Title/scope vs shipped tip (from turn 01)
**Severity:** must-fix  
**Status:** still open

PR title/plan say Friends + Edit Profile UI; tip still ships notifications + feed-seen (and related stack) against `main`. Split or retitle + expand plan/acceptance; do not merge as currently framed.

### R2 — Base is `main` while feature stack is `dev` / #6–#8 (from turn 01)
**Severity:** concern  
**Status:** still open

Align base with the agreed chain to avoid duplicate migration history / conflict pain.

### R3 — Empty stub migrations steal version IDs
**Severity:** must-fix  
**Where:** `database/migrations/20260728180000_comment_parent.ts`, `database/migrations/20260728190000_reactions.ts`

Both files are no-ops:

```ts
export async function up(_knex: Knex): Promise<void> {}
export async function down(_knex: Knex): Promise<void> {}
```

Comments claim they exist so a shared local DB stays “happy,” but on a clean DB / CI they:
- consume the `20260728180000` / `20260728190000` version slots without creating `comment_parent` / reactions schema, and
- collide with the real migrations owned by earlier stacked PRs (#7 / #8) once those land.

**Fix (pick one, prefer 1):**
1. **Delete the stubs** from this PR and rebase/stack onto the branch that owns the real migrations; **or**
2. If this PR must temporarily stand alone, **do not** reuse those timestamps — leave schema work to the owning PRs and keep this PR UI-only.

Do not ship no-op migrations that reserve another feature’s version IDs.

### R4 — `OnlineDot` always “online”
**Severity:** concern  
**Where:** `frontend/src/pages/FriendsPage.tsx` — `<OnlineDot isOnline />`

Every mutual friend row hard-codes `isOnline` truthy. Spec Rev 3 notes there is no presence API yet, but the UI still presents a green pip + `title`/`aria-label` “Online”, which is misleading.

**Fix:** Remove the pip until real presence exists, or render a clearly non-status affordance (and drop the “Online” accessible name). Documenting “visual only” in the revision log does not make a false status OK for a11y.

## Merge gate

1. Resolve **R1** (turn 01) and **R3** (stub migrations) before merge.
2. Clarify **R2** base; fix or remove **R4** OnlineDot.
3. Turn 01 remains the primary scope gate; this turn does not waive it.

Also posted as an additional **Changes requested** / PR comment.
