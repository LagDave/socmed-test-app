---
turn: 01
date: 08052026
role: reviewer
by: dave
branch: kylie/chat-search → dev
spec: (none in PR — review trace only)
verdict: needs-changes
status: open
addresses: none
---

# Review — conversation message search (PR #63)

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/63

Authz and ILIKE binding look solid. Merge blocked on **migration stacking** and jump-to / auto-backread gaps. **No plan folder shipped with this PR.**

## Findings

### R1 — Branch hygiene / stacked migrations
**Severity:** must-fix  
**Where:** `database/migrations/`

| Migration | Also in |
|-----------|---------|
| `20260803140000_conversation_theme_log.ts` | #59, #64 |
| `20260801140000_message_edited_at.ts` | #64 (and duplicates `011500` already on `dev`) |
| `20260804120000_message_search_index.ts` | #64 |

Search only needs the trgm index. Landing order across #59/#63/#64 will fight over the same files.

**Fix:** Keep only `message_search_index` here (or rebase onto the PR that owns the others) and drop the rest. Coordinate ownership of the search index with #64.

### R2 — Jump-to leaves a broken timeline
**Severity:** concern  
**Where:** `focusSearchResult` / ThreadView

Only merges the single hit into the loaded window — no `before=` backfill. Selecting an old match can show recent page + one orphan older message with a chronological hole.

**Fix:** Backfill surrounding messages (or load a window around the hit) before focusing.

### R3 — Auto-load earlier can stall
**Severity:** concern  
**Where:** `ConversationMessageList` IntersectionObserver

`hasTriggeredAutoLoadRef` is not reset correctly when the sentinel stays intersecting after a page loads; further auto-loads can stop until the user scrolls away.

### R4 — ThreadView at §13.1 ceiling (~799 lines)
**Severity:** concern  

Split helped, but the orchestrator is at the limit. Next change should pull a `useConversationThread` hook.

### R5 — `CREATE EXTENSION "pg_trgm"`
**Severity:** concern  

Confirm staging/prod allow `pg_trgm` before merge; otherwise migrate fails.

### R6 — Search pagination half-implemented
**Severity:** advisory  

API returns `hasMore` after LIMIT 51 but no cursor; UI says “latest 50” — fine if intentional.

## Authz / SQL (no finding)

- `requireAuth` + `assertParticipant` before query
- Bound `whereILike` with escaped wildcards — not injectable
- Excludes unsent + viewer deletions

## What's good

- Clean layering: route → controller → service → model
- Frontend search hook: debounce, AbortSignal, request-id races
- `MessagesPage` slimmed; search UI split into panel + highlight helper (no HTML injection)
- Trgm GIN partial index is the right shape

## Merge gate

Resolve **R1** (and preferably R2–R3 / confirm `pg_trgm`) before merge.

Also posted as **Changes requested** on the PR.
