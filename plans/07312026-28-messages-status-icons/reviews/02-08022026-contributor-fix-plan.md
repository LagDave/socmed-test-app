---
turn: 02
date: 08022026
role: contributor
by: kylie
branch: kylie/message-status-icon → dev
spec: plans/07312026-28-messages-status-icons/spec.html
verdict: fix-plan
status: addressed-pending-review
addresses: [01]
---

# Contributor response — message status icons (PR #43)

| ID | Action | Notes |
|----|--------|-------|
| R1 | fix | `ackMessageDelivery` and `listMessages` batch deliver path now gate on `FriendshipModel.areFriends` (mirror `send()`). |
| R2 | fix | `test-results.json` updated with explicit owner waivers for A3/A4/A6; notes document two-browser items not automatable in CI/agent. |
| R3 | fix | Removed duplicate `MESSAGE_ACK` emit from `MessagesPage`; global `useMessagesSocketConnection` hook remains sole ack owner. |
| R4 | fix | `applyPeerRead` guards `payload.readerId === peerIdRef.current` before updating `peerLastReadAt`. |
| R5 | fix | `markRead` passes `updated` (post-markRead row) to `MessageRealtime.conversationRead`. |
| R6 | ignore | Advisory; `#ffffff` check stroke constant deferred. |

Commit: (this turn's fix commit on `kylie/message-status-icon`).
