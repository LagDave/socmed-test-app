---
turn: 01
date: 07282026
role: reviewer
by: dave
branch: kylie/ui-beautification → main
spec: plans/07282026-16-friends-management-ui/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — PR #9 Friends UI / notifications

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/9

## Findings

### R1 — PR title/scope vs shipped tip diverge
**Severity:** must-fix

Title/plan center on Friends + Edit Profile UI beautification, but the tip commit and diff add a full **activity notifications** system (migration, API, `NotificationsPage`, feed-seen badges) plus pull in reactions/parent migrations against **`main`**.

That makes the PR unreviewable as titled and risks merging a stack out of order relative to #6–#8.

**Fix (pick one):**
1. Split notifications/feed-seen into its own PR/plan stacked on the correct base, and keep this PR to Friends/Profile UI only; **or**
2. Retitle + expand the plan/What/Done/acceptance to explicitly include notifications, and rebase onto the intended stack tip (not a silent grab-bag onto `main`).

### R2 — Base is `main` while feature stack is `dev`/#6–#8
**Severity:** concern

Opening against `main` with migrations already owned by earlier stacked PRs invites duplicate-history / conflict pain. Align base with the agreed deploy branch chain.

## What’s good

Notification routes appear behind `requireAuth`; Friends UI polish is in scope of the named plan once separated.

## Merge gate

Resolve **R1** (split or honest retitle + plan sync). Clarify **R2** base before merge.
