---
turn: 02
date: 07292026
role: contributor
by: kylie
branch: kylie/navbar-arrangement → dev
spec: plans/07292026-19-navbar-arrangement/spec.html
verdict: reply
status: addressed-pending-review
addresses: [01]
---

# Contributor reply — navbar arrangement (PR #18)

**Role:** contributor (kylie)  
**Addresses:** turn 01 (Dave)

## Disposition

### R1 — PR title/scope vs contents → **fix**
Took the recommended split: messenger stays on **PR #16** (plan 17); this PR’s unique deliverable is **AppShell navbar rearrangement** (plan 19). PR body updated to document stacked scope (base on #16 / friends-messenger history; merge after #16). Title stays navbar-focused. Duplicate messenger PRs not closed from here.

### R2 — Thread poll / load race → **defer to #16**
Same class of bug as PR #16 R1. Will rebase this branch onto `origin/kylie/friends-messenger` once #16’s race fix lands so the fix inherits. **Pending rebase:** #16 still only has the reviewer docs commit (`f5448ac`); race/N+1 fixes not on the branch yet.

### R3 — Conversations / unread N+1 → **defer to #16**
Messenger data-layer concern; owned by plan 17 / PR #16. Same pending-rebase note as R2.

### R4 — Profile mutual check + active path prefix → **fix** (path) / **waive** (mutuals list)
- **Active path:** fixed in `AppShell` — `isProfileActive` now uses exact path / segment boundary (`pathname === profilePath` or `pathname.startsWith(profilePath + "/")`) so `/u/alice` no longer matches `/u/alice2`.
- **Mutual check fetching all mutuals:** **waive.** Frontend has no cheaper `areFriends` / pairwise status API today (`FriendshipModel.areFriends` exists server-side only; routes expose `/friends/mutuals` + inbox/request flows). Adding a new endpoint is out of scope for this navbar PR; can follow on #16 or a small friends API follow-up.

### R5 — Post-unfriend / create catch / CI → **defer** (messenger) / **waive** (CI)
Messenger bits (post-unfriend gating, create `catch`, inbox refresh, `api/messages.ts`) defer to #16. **CI:** project only has `.github/workflows/deploy.yml` — no PR check / test CI configured yet, so absence of checks on the branch is expected, not a regression from this PR.

## Commits (this turn)
- `docs:` contributor reply + PR scope documentation
- `fix:` AppShell profile active-state exact path match

## Rebase status
Not rebased onto updated friends-messenger yet — waiting on #16 race/N+1 fix commits. Will `--force-with-lease` push only if/when that rebase rewrites history.
