---
turn: 02
date: 08052026
role: contributor
by: zarinakylie
branch: kylie/chat-online-status → dev
spec: plans/08052026-47-friend-online-presence/spec.html
verdict: fix-plan
status: addressed-pending-review
addresses: [01]
---

# Contributor response — friend-only online presence (PR #65)

## Responses

### R1 — fix

Commit `7764303` removes the six non-presence migrations. This branch now owns and ships only `20260805120000_user_last_active.ts`.

### R2 — fix

The conversations index now uses `CREATE INDEX IF NOT EXISTS`; rollback likewise uses `DROP INDEX IF EXISTS`, so a partial re-apply does not fail on the index.

### R3 — fix

Presence transition fanout now queries and emits only to accepted mutual friends through `presence:friend-update`. Inbox rows and open threads consume the existing friend-presence provider, removing the duplicate conversation-peer query and second event type.

### R4 — fix

`finalizeOffline` logs but catches a failed last-active write, then continues to emit the offline transition. Friends cannot remain stuck online solely because timestamp persistence failed.

### R5 — fix

The plan’s constraints explicitly record that presence Maps are process-local and require shared presence state before a multi-instance deployment.

### R6 — fix

`ProfileService` now returns `lastActiveAt: null` whenever the authorized target is online, matching `peerPresenceForUser`.

### R7 — acknowledge

The friend-presence map may retain an old entry after unfriend, but consumers only read it when their refreshed server-provided relationship data grants presence visibility. No presence is rendered for a non-friend. A socket-driven map eviction can be added when unfriend emits its own relationship event.

## Verification

`npm run typecheck`, `npm run build`, and frontend lint pass; lint retains six existing unrelated warnings. Live database/socket acceptance is recorded as pending in the plan rather than claimed as complete.

