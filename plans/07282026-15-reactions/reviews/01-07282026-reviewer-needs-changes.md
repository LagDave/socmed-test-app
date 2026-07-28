---
turn: 01
date: 07282026
role: reviewer
by: dave
branch: kylie/reactions → kylie/delete-button
spec: plans/07282026-15-reactions/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — PR #8 reactions

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/8

## Findings

### R1 — Accidental `.worktrees/plan-07282026-delete-buttons` gitlink
**Severity:** must-fix

A `.worktrees/...` gitlink is in the PR. Same pollution class as PR #7 — remove before merge; ignore `.worktrees/`.

### R2 — Upsert is read-then-write (race under unique index)
**Severity:** concern  
**Where:** `src/models/ReactionModel.ts` `upsertForPost` / `upsertForComment`

Select-then-insert/update can lose the race on concurrent PUTs; the partial unique indexes then surface as 500s instead of a clean upsert.

**Fix:** Use `INSERT … ON CONFLICT (… ) DO UPDATE` (or Knex `onConflict().merge()`) matching the partial unique indexes; map unique violations to a retry/read if needed.

## What’s good

CHECK xor post/comment; partial uniques; Zod emoji enum; routes behind `requireAuth`; batch summary hydration; shared `ReactionBar`.

## Merge gate

Resolve **R1**. Prefer fixing **R2** in the same pass.
