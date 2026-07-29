---
turn: 01
date: 07302026
role: reviewer
by: dave
branch: Kylie/revamp-messages-feature → dev
spec: plans/07292026-22-messages-websockets/spec.html
verdict: needs-changes
status: open
addresses: []
---

# Reviewer turn 01 — PR #25 / plan 22

## Verdict
needs-changes

## Findings

### R1 — must-fix — Sender duplicate messages (REST append vs socket)
- **Files:** `frontend/src/pages/MessagesPage.tsx` (`onSend`, `onImage`); emit order in `src/services/MessageService.ts` (`send` → `publishRealtime` before return)
- **Evidence:** Socket handler uses `mergeById`; send success uses `[...prev, data.message]`. Server emits `message:new` to the sender’s `user:{id}` room before the HTTP response completes, so the optimistic/REST append commonly races and duplicates the same message id in the thread UI.
- **Fix:** On REST success, `setMessages((prev) => mergeById(prev, [data.message]))` (same as socket path). Optionally skip applying `message:new` for `senderId === self` if you want a single writer—but merge-by-id is the minimum.

### R2 — concern — Interactive acceptance waived (A1–A7)
- **Files:** `plans/07292026-22-messages-websockets/test-results.json`
- **Evidence:** A1–A7 status `fail` with waivers; rollup “Passed” only via waivers + A8/A9/T0.
- **Ask:** Author or reviewer smoke A2, A5, A6 locally before merge; A7 after Caddy/deploy.

### R3 — concern — Stacking with PR #26
- **Evidence:** `origin/Kylie/revamp-messages-feature` is an ancestor of `origin/kylie/messages-friend-picker`. PR #26 file list includes this PR’s entire websocket surface plus friend-picker.
- **Ask:** Explicit land order — merge #25 then rebase #26, or close #25 and ship websockets through #26.

### R4 — concern — Caddy / WSS deploy gate
- **Files:** `plans/07292026-22-messages-websockets/Caddyfile.socmed.socketio.md`
- **Evidence:** Snippet not applied on box in this PR; A7 waived.
- **Ask:** Apply `/socket.io*` handle (or document reliance on Caddy default upgrade) and verify WSS on socmed-dev.

### R5 — advisory — No-op generation guard on socket handler
- **Files:** `frontend/src/pages/MessagesPage.tsx` (socket `useEffect` / `applyMessage`)
- **Evidence:** `const generation = () => generationRef.current` compared to `generationRef.current` is always equal. Poll path correctly snapshots the number.
- **Fix:** Snapshot at effect entry, or remove.

### R6 — advisory — Inbox reload storm
- **Files:** `frontend/src/pages/MessagesPage.tsx` (`InboxView`); `src/realtime/MessageRealtime.ts` (`messageCreated`)
- **Evidence:** Both `MESSAGE_NEW` and `CONVERSATION_UPDATED` trigger `reloadInbox` for one send.
- **Fix:** Debounce or listen to a single event.

### R7 — advisory — Realtime module reads models
- **Files:** `src/realtime/MessageRealtime.ts` → `ConversationModel.countUnreadConversations`
- **Note:** Prefer unread via `MessageService` so realtime stays fan-out only (§7.1 spirit).

### R8 — advisory — Session revoke vs long-lived socket
- **Files:** `src/realtime/io.ts`
- **Note:** Auth at handshake only; revoked session lives until disconnect/reconnect. OK for v1.

## What's good
Cookie session handshake; server-only `user:{id}` joins; REST mutations + push; friends check on send; per-viewer reaction payloads; poll gated on disconnect; listener cleanup; Vite WS proxy; SPA excludes `/socket.io`.

## Merge notes
GitHub `mergeable: MERGEABLE`. Coordinate with PR #26 (likely supersedes if landed first). Deploy needs Caddy/WSS confirmation.

## Status
open — awaiting contributor fix for R1 and merge-path decision for R3.
