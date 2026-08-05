---
turn: 01
date: 08052026
role: reviewer
by: dave
branch: kylie/chat-online-status → dev
spec: (none in PR — review trace only)
verdict: needs-changes
status: open
addresses: none
---

# Review — friend-only online presence (PR #65)

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/65

Core presence design is sound (friend-gated HTTP + socket fanout, grace timer + versioning, multi-socket). Merge blocked on **foreign migration stacking** and a non-idempotent index. **No plan folder shipped with this PR.**

## Findings

### R1 — Migration stacking from #59 / #63 / #64
**Severity:** must-fix  
**Where:** `database/migrations/`

Six migrations that are not presence work and are not on `dev`:

| Migration | Source |
|-----------|--------|
| `20260801140000_message_edited_at.ts` | redundant vs `dev` `011500` |
| `20260803140000_conversation_theme_log.ts` | #59 |
| `20260804120000_message_search_index.ts` | #63 |
| `20260804160000_conversation_pins.ts` | #64 |
| `20260804170000_message_pins.ts` | #64 |
| `20260804180000_message_pin_activities.ts` | #64 |

**Keep only** `20260805120000_user_last_active.ts`. Rebase onto `dev` after the other PRs land, or drop the foreign files now.

### R2 — Non-idempotent `conversations_user_b` index
**Severity:** must-fix  
**Where:** `database/migrations/20260805120000_user_last_active.ts`

`last_active_at` is `hasColumn`-guarded; the index is not. Partial re-apply fails.

**Fix:** `CREATE INDEX IF NOT EXISTS` or `hasIndex` guard.

### R3 — Dual fanout cost on every presence transition
**Severity:** concern  
**Where:** `PresenceRealtime.emitPresenceUpdates`

Lists all friends + all conversation peers, then emits two event types (with overlap). Prefer one friend channel, or emit chat presence only to open-thread subscribers.

### R4 — Offline finalize can leave friends stuck online
**Severity:** concern  
**Where:** `finalizeOffline`

Timer cleared before DB write/emit; if DB throws, no offline emit runs while in-memory already offline.

**Fix:** Emit offline even when DB write fails, or re-arm timer on failure.

### R5 — Process-local presence Maps
**Severity:** concern  

Fine for single-node; document that or add shared presence before multi-instance.

### R6 — Profile returns `lastActiveAt` while online
**Severity:** advisory  

Align with `peerPresenceForUser` (null while online).

### R7 — Client map not cleared on unfriend
**Severity:** advisory  

Stale green dots until refetch.

## Authz / privacy

Friend-only on profile HTTP, posts/comments, inbox/thread, and both socket events. `toPublicUser` does not leak `last_active_at`. No must-fix privacy leak found.

## What's good

- Grace + versioning handles tab flicker / reconnect well
- ProfileController passes `viewerId` for authorized presence
- Clean FE split: provider + hooks + thin indicators
- Mutual-friend set batched on hydrate paths

## Merge gate

Strip foreign migrations (R1) → idempotent index (R2) → prefer R4 before ship. Then re-review.

Also posted as **Changes requested** on the PR.
