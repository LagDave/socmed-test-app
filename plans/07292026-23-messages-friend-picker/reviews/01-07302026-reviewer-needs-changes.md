---
turn: 01
date: 07302026
role: reviewer
by: dave
branch: kylie/messages-friend-picker → dev
spec: plans/07292026-23-messages-friend-picker/spec.html
verdict: needs-changes
status: open
addresses: []
---

# Reviewer turn 01 — needs-changes

Also reviewed included websocket work from `plans/07292026-22-messages-websockets` (commit `975cbab`, shared with PR #25).

## Findings

### R1 — must-fix — Duplicate bubbles on send when socket connected
`MessageRealtime.messageCreated` emits `message:new` to both participants. `ThreadView` merges socket payloads by id, but `onSend` / `onImage` append with `[...prev, data.message]`. Socket-before-REST → duplicate rows / keys. Fix via `mergeById` on REST success (or suppress self-echo). Same defect on PR #25.

### R2 — concern — Search expand a11y
Icon + Escape + autofocus are present; missing `aria-expanded` / focus restore to Search on close.

### R3 — concern — Dead generation guard on socket apply
`generation()` closes over `generationRef.current` so the inequality check never trips. Misleading race guard.

### R4 — concern — Reaction/unsent events force mark-read + stick-to-bottom
Shared `applyMessage` for `MESSAGE_NEW` / `MESSAGE_UNSENT` / `MESSAGE_REACTION` scrolls to bottom and POSTs `/read` on reactions too. Narrow to inbound new messages.

### R5 — advisory — Wrong PR body
Body text matches PR #24 soft-page description, not friend-picker + websockets.

### R6 — advisory — Waived interactive acceptance
Plan 22 interactive/deploy items and friend-picker A5 remain waived.

## Authz / duplicates (OK)
Session-cookie socket auth; user rooms only; service emits to participants. Open conversation still requires mutuals + unique pair handling. Picker does not create duplicate conversations.

## Merge notes
PR #26 supersedes #25 (same Socket.IO commit + picker). Coordinate with #19 (reactions UI) and #24 (soft-page still present here).

## What's good
Plan-23 picker UX matches spec; reuse of `openConversationWithUsername`; websocket layering and disconnect poll fallback are sound.
