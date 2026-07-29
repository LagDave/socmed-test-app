---
turn: 01
date: 07282026
role: reviewer
by: dave
branch: kylie/comment-replies → dev
spec: plans/07282026-11-comment-replies/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — one-level comment replies

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/5

Backend reply validation + Knex migration look good. Merge is blocked on **spec–code / acceptance parity** for the composer UX.

## Findings

### R1 — Spec / PR / CHANGELOG / acceptance drift on composer placement
**Severity:** must-fix

Spec What / Must / Must Not / locked decisions / T3 still require a **fixed bottom** composer and forbid duplicating it under comments. Rev 5 + Done + shipped UI use an **inline** composer under the parent. PR title/body and CHANGELOG still describe fixed-bottom.

`test-results.json` T3 is marked `pass` with evidence that the bottom form “stays put with replyTo chip” — that does not match the final code. Interactive UI was waived.

**Fix:** Lock one UX and sync PR body, CHANGELOG, What / Must / Must Not / Done, and T3 expected + evidence (or re-run T3). Until then, “Completed” / “Passed” is false.

### R2 — `groupComments` silently drops orphan replies
**Severity:** concern  
**Where:** `frontend/src/pages/PostDetailPage.tsx` (`groupComments`)

Replies whose `parentId` is missing from the top-level set never render. CASCADE makes true orphans unlikely; bad rows still vanish with no signal.

**Fix:** Surface unused reply IDs (fallback / promote / log), or enforce integrity server-side.

### R3 — One-level nesting is app-only (no DB guard)
**Severity:** concern  
**Where:** `src/services/CommentService.ts`, migration `20260728180000_comment_parent.ts`

Service correctly rejects nested parents. Raw inserts can still create deeper trees that the UI hides (see R2).

**Fix (optional):** DB trigger / check that a parent row has `parent_id IS NULL`.

### R4 — Duplicated submit/upload paths
**Severity:** advisory  
**Where:** `PostDetailPage.tsx` `onComment` / `onReply`

Near-identical upload → post → reload. Once UX is locked, fold into one submit helper.

### R5 — CASCADE delete of parent wipes others’ replies
**Severity:** advisory  
**Where:** migration `onDelete("CASCADE")`

Allowed by spec; call out in product/API docs when comment delete is exposed.

### R6 — Stale `replyTo` across post navigation
**Severity:** advisory  
**Where:** `PostDetailPage.tsx`

`useEffect([id])` reloads data but does not `clearReply()`. Clear on `id` change.

## What’s good

- Same-post + top-level parent validation → `COMMENT_VALIDATION` 400
- Flat list + client grouping; Reply only on parents; indent via `border-l` / `pl-6`
- Migration: nullable self-FK, CASCADE, useful index
- Types hydrated end-to-end; no new deps

## Merge gate

1. Resolve R1 (composer UX + docs/acceptance sync).
2. Address or explicitly document R2.
3. R3–R6 optional / follow-up.

Also posted as **Changes requested** on the PR.
