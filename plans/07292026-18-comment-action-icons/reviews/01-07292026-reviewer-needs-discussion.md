---
turn: 01
date: 07292026
role: reviewer
by: dave
branch: kylie/comment-action-icons → dev
spec: plans/07292026-18-comment-action-icons/spec.html
verdict: needs-discussion
status: open
addresses: none
---

# Review — comment action icons (PR #17)

**Verdict:** needs discussion  
**PR:** https://github.com/LagDave/socmed-test-app/pull/17

Comment/reply icon UX looks solid and accessible. The PR also ships the full friends messenger (~2.5k lines) under a comment-icons title — scope needs clarification before a clean merge path.

## Findings

### R1 — Dual feature under one PR / title
**Severity:** concern (scope)

PR title/body speak to comment action icons, but the diff includes the full messenger stack (plan 17) plus comment-icon work (plan 18). Hard to review and revert independently; overlaps PRs #16 / #18.

**Fix:** Prefer landing messenger via #16 (after its race fix), keep this PR to comment/reply icons only — or retitle + document both deliverables explicitly and drop duplicate messenger PRs.

### R2 — Post-unfriend access inconsistency
**Severity:** concern  
**Where:** messages service (list / reactions vs send / open)

After unfriend, `send` / `open` are blocked but `listMessages` / reactions can still allow participant access — inconsistent “friends-only” story.

**Fix:** Align policy (block all participant ops after unfriend, or document read-only history explicitly in the spec).

### R3 — Conversations / unread N+1
**Severity:** concern  
**Where:** `listConversations` / `unreadCount`

Per-conversation queries will hurt as chat volume grows.

**Fix:** Batch / join in SQL.

### R4 — Inbox list does not poll
**Severity:** concern  
**Where:** Messages inbox UI

Nav badge can update while list unread chips stay stale.

**Fix:** Poll inbox (or refetch on badge change / focus).

### R5 — Cancel flag / bare catch nitpicks
**Severity:** advisory

`ThreadView` load success path may ignore cancel (setState-after-unmount). Bare `catch` on conversation create can swallow non-unique errors.

## What’s good

- Comment/reply icons beside reaction bars with `aria-label`s
- Feed post body no longer navigates to detail; comments link to `#comments`
- Messenger layering (routes → controller → service → models) and upload URL validation look sound when scoped as its own PR

## Discussion / merge path

1. Decide: split messenger out (recommended) vs keep stacked and retitle.
2. If messenger stays: address R2–R4 (same themes as PR #16 review).
3. Comment-icon slice itself is otherwise shippable.

Also posted as a **comment** on the PR (discussion, not Changes requested).
