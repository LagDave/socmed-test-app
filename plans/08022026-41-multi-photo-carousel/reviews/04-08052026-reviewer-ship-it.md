---
turn: 04
date: 08052026
role: reviewer
by: dave
branch: kylie/fix-pr57-postcard-layout-regression → dev
spec: plans/08022026-41-multi-photo-carousel/spec.html
verdict: ship-it
status: resolved
addresses: none
---

# Review — PostCard layout regression fix (PR #58)

**Verdict:** ship it  
**PR:** https://github.com/LagDave/socmed-test-app/pull/58

Small, targeted restore of feed media stage wrapping and embedded action-row layout that PR #57 regressed. Scope is one file; no auth, API, or migration risk.

## Findings

None blocking.

### R1 — advisory · Verify on both surfaces
**Severity:** advisory  
**Where:** `frontend/src/components/PostCard.tsx` (`wrapFeedMediaStage`, embedded action row)

Confirm on staging: (1) feed standalone photo still gets `post-media-stage` centering, (2) profile/timeline embedded cards keep reaction row without the breakout border treatment, (3) multi-photo gallery path unchanged.

## What's good

- Minimal diff; reuses existing `variant` prop instead of a parallel layout system
- Does not touch multi-photo gallery behavior beyond the stage wrapper
- Clear PR description tying the restore to PR #41 / #51 intent

## Merge gate

Approve. Smoke-check feed + profile PostCard after merge.

Also posted as **Approved** on the PR.
