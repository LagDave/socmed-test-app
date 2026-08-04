---
turn: 01
date: 08052026
role: reviewer
by: dave
branch: kylie/chat-ui-improvements → dev
spec: (none in PR — review trace only)
verdict: needs-changes
status: open
addresses: none
---

# Review — messenger UI polish, theme logs, inbox reactions (PR #59)

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/59

UI polish and inbox reaction wiring are solid. Merge blocked on file-ceiling growth, unbounded `theme_log` payloads, and a non-atomic theme-log race. **No plan folder shipped with this PR** — add a proper plan/acceptance artifact before `-d`, or land under an existing messages plan with Rev Log.

## Findings

### R1 — MessagesPage further over §13.1 / §2.4 ceiling
**Severity:** must-fix  
**Where:** `frontend/src/pages/MessagesPage.tsx` (1123 → **1251** lines)

Already over the ~800 hard ceiling on `dev`; this PR adds ~128 more lines. Constitution: *“Never add to a file already over the ceiling — extract.”*

**Fix:** Extract before merge — timeline helpers, `ThreadView` / `InboxView`, or `useThreadMessages` / `useInboxSocket` hooks.

### R2 — Unbounded `theme_log` on every poll
**Severity:** must-fix  
**Where:** `ConversationModel` / `MessageService.listMessages` → FE poll

`theme_log` is append-only jsonb with **no cap**. Every conversation fetch (including ~2.5s poll when socket is down) returns full history.

**Fix:** Cap (e.g. last N=50) on write; avoid resending full history on every poll (delta / open + realtime).

### R3 — Theme-log RMW race
**Severity:** must-fix  
**Where:** `src/models/ConversationModel.ts` `updateTheme`

Classic read-modify-write: concurrent theme updates can drop log entries.

**Fix:** Atomic append, e.g. `theme_log = COALESCE(theme_log, '[]'::jsonb) || ?::jsonb` (plus cap).

### R4 — `toListItem` leaves reaction fields empty
**Severity:** concern  
**Where:** `MessageService.toListItem`

Always returns `lastReaction: null`, `hasUnreadReaction: false` while `listConversations` populates them.

**Fix:** Reuse the same helpers in `toListItem`, or stop returning a full `ConversationListItem` from open.

### R5 — Double inbox reload on reaction/theme
**Severity:** concern  
**Where:** `MessageRealtime` + Inbox socket handlers

Emits `CONVERSATION_UPDATED` **and** typed events; Inbox listens to both → double `reloadInbox()`.

**Fix:** One path only.

### R6 — Bubble grouping ignores system-log neighbors
**Severity:** concern  
**Where:** MessagesPage timeline render

Day separators use timeline neighbors; bubble grouping still uses message-array prev/next, so system logs can sit inside a visual group.

### R7 — No tests for theme-log / unread-reaction SQL
**Severity:** concern  
**Where:** new parse/unread paths (§20.1)

### R8 — “Liked your message” for every emoji
**Severity:** concern  
**Where:** `ConversationListRow`

### R9 — FE/BE theme label drift (“Custom” vs named swatches)
**Severity:** concern  

## What's good

- Participant checks still gate theme + reactions; DB stays in models
- Batch `latestByConversations` avoids N+1 on list
- Theme contrast helpers are a real a11y win
- Migration reversible / `hasColumn`-guarded

## Merge gate

Do not merge until **R1–R3** are fixed. R4–R7 should land in the same pass or carry an explicit waiver.

Also posted as **Changes requested** on the PR.
