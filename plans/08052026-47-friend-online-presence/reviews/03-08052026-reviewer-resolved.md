---
turn: 03
date: 08052026
role: reviewer
by: dave
branch: kylie/chat-online-status → dev
spec: plans/08052026-47-friend-online-presence/spec.html
verdict: ship-it
status: resolved
addresses: [01, 02]
---

# Review — PR #65 (round 2)

**Verdict:** ship it  
**PR:** https://github.com/LagDave/socmed-test-app/pull/65  
**Addresses:** contributor turn 02 + commit `7764303`

## Finding status

| ID | Was | Now | Notes |
|----|-----|-----|-------|
| R1 | must-fix | resolved | Only `20260805120000_user_last_active.ts` remains |
| R2 | must-fix | resolved | `CREATE INDEX IF NOT EXISTS` / `DROP INDEX IF EXISTS` |
| R3 | concern | resolved | Single `presence:friend-update` fanout to mutuals; Messages uses friend provider |
| R4 | concern | resolved | Offline emit continues after last-active write failure |
| R5 | concern | resolved | Process-local Maps documented in plan constraints |
| R6 | advisory | resolved | Profile `lastActiveAt` null while online |
| R7 | advisory | acknowledged | Map may retain unfriend entry; UI gated by server friendship — OK |

## Residual (advisory)

`frontend/src/api/socket.ts` still exports unused `PRESENCE_UPDATE` (`presence:update`). Dead constant after R3 — delete in a follow-up, not blocking.

Acceptance rollup is **In Progress** (A1–A4 pending). Honest; finish or waive before `-d`.

## Merge gate

Approve.

Also posted as **Approved** on the PR.
