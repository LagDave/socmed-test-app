---
turn: 01
date: 08012026
role: reviewer
by: dave
branch: kylie/message-status-icon → dev
spec: plans/07312026-28-messages-status-icons/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — message status icons (PR #43)

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/43

Sender-facing Sent / Delivered / Seen icons, the `delivered_at` migration, socket ack + peer-read events, and `MessageStatusIcon` are structurally aligned with Plan 28 and existing messenger patterns. Merge is blocked on a missing authz gate and unverified core acceptance paths.

## Findings

### R1 — `ackMessageDelivery` skips friendship gate
**Severity:** must-fix  
**Constitution:** §5.4 — re-enforce every check server-side; spec Constraints Must — "Respect participant + friendship gates on ack handler"  
**Where:** `src/services/MessageService.ts` (`ackMessageDelivery`)

`send()` rejects non-friends via `FriendshipModel.areFriends`, but `ackMessageDelivery()` only calls `assertParticipant`. After an unfriend, a former peer can still ack inbound messages and flip the sender's icon to Delivered.

**Fix:** Mirror the `send()` friendship check in `ackMessageDelivery` (and consider the same gate on `markInboundUndeliveredAsDelivered` / `listMessages` batch path).

### R2 — Core Seen / Delivered acceptance not verified
**Severity:** must-fix  
**Where:** `plans/07312026-28-messages-status-icons/test-results.json` (A3, A4, A6)

Three behavioral items that define the feature — Seen icon (A3), offline REST Delivered (A4), live Seen without reload (A6) — are marked **fail** with author waivers only ("two-browser deferred"). Sent + Delivered happy path is spot-checked; the read-receipt half of the feature is unproven at merge time.

**Fix:** Run two-browser acceptance for A3, A4, and A6; update `test-results.json` to **pass** with evidence, or obtain an explicit written waiver from the human owner before merge.

### R3 — Duplicate `message:ack` emissions on open thread
**Severity:** concern  
**Where:** `frontend/src/hooks/useMessagesSocket.ts` (`onMessageNew`) and `frontend/src/pages/MessagesPage.tsx` (`applyInboundNewMessage`)

Both listeners emit `MESSAGE_ACK` for the same inbound `message:new` when the recipient has the thread open. Backend `markDelivered` is idempotent, but this doubles socket traffic and splits ack responsibility across two modules.

**Fix:** Keep a single ack owner — either the global hook (covers inbox/background) **or** the thread listener, not both. Prefer the hook and drop the thread-level emit.

### R4 — `applyPeerRead` ignores `readerId`
**Severity:** concern  
**Where:** `frontend/src/pages/MessagesPage.tsx` (`applyPeerRead`)

Handler updates `peerLastReadAt` whenever `conversationId` matches, without verifying `payload.readerId === peer.id`. A malformed or replayed payload could advance Seen state incorrectly.

**Fix:** Guard with `payload.readerId === peer?.id` (or derive expected peer id from thread state) before calling `setPeerLastReadAt`.

### R5 — `markRead` passes stale conversation into `conversationRead`
**Severity:** concern  
**Where:** `src/services/MessageService.ts` (`markRead`)

After `ConversationModel.markRead` returns `updated`, `MessageRealtime.conversationRead` still receives the pre-update `conversation` row while `conversationPeerRead` uses `updated`. Unlikely to break status icons, but unread refresh for the reader may lag.

**Fix:** Pass `updated` to `conversationRead` (or reload once and reuse).

### R6 — Hardcoded check stroke color in Delivered icon
**Severity:** advisory  
**Constitution:** §4.2 — extract magic values to named constants  
**Where:** `frontend/src/components/MessageStatusIcon.tsx` (`DeliveredIcon`, `#ffffff`)

Sent/Delivered blue uses `MESSAGE_STATUS_BLUE`; the check stroke on Delivered uses a bare `#ffffff`.

**Fix:** Add e.g. `MESSAGE_STATUS_CHECK_ON_BLUE` next to `MESSAGE_STATUS_BLUE`, or reuse an existing token.

## What's good

- Migration + idempotent `MessageModel.markDelivered` / batch inbound deliver on `listMessages`
- Sender-facing `message:delivered` and `conversation:peer-read` events wired through `MessageRealtime`
- `MessageStatusIcon` + `deriveMessageStatus` keep presentation separate from thread state
- `ProfileAvatar` `xs` size for Seen state; aria-labels per status
- `mergeById` preserves `deliveredAt` across poll merges
- Tap-to-toggle timestamps (Rev 3) documented in spec revision log

## Merge gate

1. Resolve **R1** (friendship gate on ack / deliver paths).
2. Resolve **R2** (A3, A4, A6 acceptance evidence or owner waiver).
3. Address or explicitly waive **R3–R5**.
4. **R6** optional / follow-up.

Also posted as **Changes requested** on PR #43.
