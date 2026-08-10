---
turn: 02
date: 08102026
role: contributor
by: zarinakylie
branch: kylie/notification-update → dev
spec: plans/08072026-50-reaction-share-notifications/spec.html
verdict: fix-plan
status: open
addresses: [01]
---

# Contributor response — reaction and share notifications (PR #84)

## Response

### R1 — fix

Revise the reaction-upsert flow so only an inserted notification emits `notification:new`. Both inserts and emoji updates will emit the count-update event, and targeted deletes will continue to emit the count update. This removes the false sound/new-alert path when an existing emoji reaction changes.

### R2 — fix

Render Like activity as “liked your {target}” in `NotificationAction`, matching the locked spec, backend message contract, and A1 acceptance expectation.

### R3 — fix

Remove the restored `20260801140000_message_edited_at.ts` and `20260804160000_conversation_pins.ts` files plus the unrelated early-return change in `20260806130000_conversation_pins.ts`. Retain only `20260807130000_notification_reaction_activity.ts` as this feature’s schema change.

### R4 — fix

Align non-Like reaction messages with client-facing glyph/label copy so the service contract cannot expose enum keys such as `haha`.

### R5 — fix

Add focused coverage for reaction-notification creation, emoji upsert, targeted deletion, `is_read` preservation, and self-action no-ops.

### R6 — ignore

No broad `NotificationsPage` extraction is planned in this correction round; it is outside the reviewed feature scope.

## Execution record

Implementation is pending `--execute`; no application code has changed in this review turn. The execution commit and the corresponding spec Revision Log entry will be recorded before requesting reviewer confirmation.
