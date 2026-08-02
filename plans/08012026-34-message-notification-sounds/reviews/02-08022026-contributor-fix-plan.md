---
turn: 02
date: 08022026
role: contributor
by: kylie
branch: kylie/message-notification-features → dev
spec: plans/08012026-34-message-notification-sounds/spec.html
verdict: fix-plan
status: addressed-pending-review
addresses: [01]
---

# Contributor response — message notification sounds (PR #49)

## R1 — Open-thread suppress
**fix** — Extended `MessageSoundContext` with `pathname` from `useLocation()` in `useMessageNotificationSound`. Added `getOpenConversationIdFromPathname()` and `isViewingConversation()` in `notificationSounds.ts`; bridge handler returns early when viewing `/messages/:conversationId` for the inbound message.

## R2 — Acceptance rollup
**fix** — Top-level status set to `In Progress` (A1–A5 pending interactive verify). A2 notes/evidence updated to match implemented suppress helpers; A1/A5 notes corrected to bridge handler paths.

## R3 — CHANGELOG
**fix** — 0.1.18 entry now states off-thread playback with suppress on open conversation thread.

## R4 — Socket listener leak on unmount
**fix** — Effect cleanup now calls `teardownMessageNotificationSoundListener()`.

## R5 — Dead activity sound code
**ignore** — Spec Q3 bundles `activity.wav` for future bell plan; defer removal to avoid scope creep this turn.

## R6 / R7
**ignore** — Advisory; out of scope for this review round.

**Commit:** (this turn)
