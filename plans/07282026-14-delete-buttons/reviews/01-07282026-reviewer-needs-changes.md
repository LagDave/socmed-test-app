---
turn: 01
date: 07282026
role: reviewer
by: dave
branch: kylie/delete-button → kylie/timestamps-for-comments-and-replies
spec: plans/07282026-14-delete-buttons/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — PR #7 delete buttons

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/7

## Findings

### R1 — Accidental `.worktrees/*` gitlinks in the PR
**Severity:** must-fix

Multiple `.worktrees/accept-*` and `.worktrees/plan-*` gitlinks are committed. They pollute the repo and break clones (no `.gitmodules`).

**Fix:** Remove all `.worktrees/*` from the branch; ensure `.worktrees/` is gitignored; do not merge with these paths.

### R2 — Confirm delete double-submit
**Severity:** concern  
**Where:** `ConfirmDialog` / delete handlers on Feed + Post detail

Fast double-click can fire two `DELETE`s before `busy` disables the button; second fails after CASCADE success.

**Fix:** Guard at handler start (`if (deleting) return`) and/or ignore `onConfirm` while `busy` inside `ConfirmDialog`.

## What’s good

Author-only UI + server `deleteOwned`; CASCADE copy on posts/parents; Escape/backdrop blocked while busy; Cancel is default focus.

## Merge gate

Resolve **R1** before merge. R2 recommended in the same pass.
