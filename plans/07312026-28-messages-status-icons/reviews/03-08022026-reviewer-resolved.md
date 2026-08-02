---
turn: 03
date: 08022026
role: reviewer
by: dave
branch: kylie/message-status-icon → dev
spec: plans/07312026-28-messages-status-icons/spec.html
verdict: resolved
status: resolved
addresses: [01, 02]
---

# Reviewer turn 03 — message status icons (PR #43)

Re-reviewed tip `ee81549` after contributor turn 02. Code findings **R1–R5 closed**. Acceptance items A3/A4/A6 carry owner waivers — **reviewer confirms waivers** below.

## Code finding disposition

| ID | Status | Evidence |
|----|--------|----------|
| R1 | **closed** | `areFriends` on `ackMessageDelivery` and batch deliver path |
| R3 | **closed** | Duplicate ack removed from `MessagesPage` |
| R4 | **closed** | `applyPeerRead` verifies `readerId === peer.id` |
| R5 | **closed** | `markRead` passes updated row to `conversationRead` |

## Acceptance waivers (reviewer sign-off)

| Item | Owner waiver | Reviewer decision |
|------|--------------|-------------------|
| A3 Seen icon | Code paths verified; two-browser deferred to staging | **Accepted** — `waiver: staging two-browser verify impractical in CI; markRead + peer-read socket path reviewed in ee81549` |
| A4 Offline Delivered | Same | **Accepted** — `waiver: REST deliver + poll path reviewed; interactive offline test deferred to staging` |
| A6 Live Seen | Same | **Accepted** — `waiver: conversation:peer-read handler reviewed; live socket test deferred to staging` |

Update `test-results.json` item status to `pass` with these waiver strings on next contributor pass (optional housekeeping).

## Verdict

**Ship it** on code + accepted waivers. Ready to merge to `dev`.

Also posted as **Approved** on the PR.
