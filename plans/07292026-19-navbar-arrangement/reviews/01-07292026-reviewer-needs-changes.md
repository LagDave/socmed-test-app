---
turn: 01
date: 07292026
role: reviewer
by: dave
branch: kylie/navbar-arrangement → dev
spec: plans/07292026-19-navbar-arrangement/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — navbar arrangement (PR #18)

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/18

AppShell navbar rearrangement (three-zone header, Messages/Notifications/Profile right, theme + logout in Profile dropdown) looks clean. Merge is blocked on scope: the full friends messenger (plan 17) is bundled under a navbar-arrangement title (plan 19), plus poll/race and N+1 concerns on the messenger side.

## Findings

### R1 — PR title/scope vs contents
**Severity:** must-fix

Full messenger (plan 17) ships under “navbar arrangement” (plan 19); empty PR description. Hard to review/revert. Overlaps PRs #16 / #17.

**Fix:** Split PRs (recommended: messenger via #16, navbar-only here) **or** retitle + document both deliverables and close duplicate messenger PRs.

### R2 — Thread poll / load race
**Severity:** concern  
**Where:** `ThreadView` load + ~2.5s poll

Doesn’t cancel safely and fully replaces message state — race/flicker; can fight in-flight send/unsend. Same class of bug as PR #16 R1.

**Fix:** Generation token / abort; don’t apply stale responses; avoid clobbering optimistic local state.

### R3 — Conversations / unread N+1 + stacked polling
**Severity:** concern

`listConversations` / `unreadCount` N+1 per conversation; badge poll + thread poll stack load.

**Fix:** Batch queries; consider shared unread source.

### R4 — Profile mutual check + active path prefix
**Severity:** concern  
**Where:** Profile message entry / `isProfileActive`

Mutual check fetches all mutuals. `pathname.startsWith(profilePath)` can false-positive (`alice` vs `alice2`).

**Fix:** Exact segment match for active profile; cheaper mutual check.

### R5 — Post-unfriend + create catch + no CI
**Severity:** concern / advisory

Post-unfriend read/react still allowed while send is gated. Bare `catch` on conversation create races. No CI checks on the branch. Inbox list doesn’t refresh; partial `api/messages.ts`.

## What’s good

- Backend layering and auth/friend/imageUrl allowlist look sound
- Navbar change itself: grid zones, Messages badge, Profile dropdown (Profile · Switch mode · Log out)
- Entry points from Friends mutuals + mutual Profile

## Merge gate

1. Resolve R1 (split or retitle/document) before merge.
2. If messenger stays in this PR: fix R2 (and align with #16 must-fix).
3. Address or waive R3–R5.

Also posted as **Changes requested** on the PR.
