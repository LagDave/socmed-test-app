---
turn: 01
date: 08022026
role: reviewer
by: dave
branch: kylie/share-button-ui → dev
spec: plans/07302026-26-share-button/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — share button UI + caption composer (PR #56)

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/56

Extends plan 26 (share button) with caption composer, `SharePostDialog`, and backend `{ body? }` on share. Feature direction is good; merge blocked on **plan scope update** and **acceptance**.

## Findings

### R1 — No plan revision for new scope
**Severity:** must-fix  
**Where:** `plans/07302026-26-share-button/spec.html` (original ship-it scope)

PR adds caption composer, `POST …/share { body? }`, `ShareAttribution`, `ShareSuccessNotice` — beyond original one-click reshare spec. No Revision Log entry or new plan folder documents the expanded scope.

**Fix:** Append Rev N to plan 26 spec (or create `plans/08022026-41-share-button-ui/`) covering caption, dialog UX, and API body validation.

### R2 — No acceptance artifact for new flows
**Severity:** must-fix  
**Where:** (missing updated) `test-results.json`

Original plan 26 acceptance does not cover caption composer, nested embed polish, or optional body on share API.

**Fix:** Add acceptance items for: open dialog → optional caption → reshare appears on feed; empty caption share; invalid body rejected server-side.

### R3 — Share API validation
**Severity:** concern  
**Where:** `src/services/PostService.ts` share path

Verify `body` is optional, trimmed, max-length enforced, and share still requires auth + original post visibility. Quick read suggests OK — confirm in acceptance A-item.

## What's good

- Layering preserved (controller → service)
- UI components extracted (`SharePostDialog`, etc.)
- Feed + detail both route through composer instead of silent one-click share

## Merge gate

R1 plan revision + R2 acceptance before merge.

Also posted as **Changes requested** on the PR.
