---
turn: 01
date: 08092026
role: reviewer
by: dave
branch: kylie/notification-update → dev
spec: plans/08072026-50-reaction-share-notifications/spec.html
verdict: needs-changes
status: open
addresses: []
---

# Review turn 01 — PR #84 (`kylie/notification-update` → `dev`)

Reviewer pass on reaction/share notifications. Backend layering and uniqueness design are largely right; merge is blocked on realtime semantics for emoji updates, Like copy vs locked contract, and migration hygiene.

## Findings

### R1 — must-fix — Emoji upsert re-emits `notification:new`
- **Where:** `src/services/ReactionService.ts` (all `setOn*`) → `NotificationService.publishCreated` after every `upsertReaction`
- **Contract:** Spec Must requires a **socket count update** on create/update/delete. It does not authorize treating an emoji change as a new notification. `frontend` activity sound listens to `NOTIFICATION_NEW` (3s same-id dedupe only).
- **Issue:** Switching emoji on an existing alert re-plays activity sound and signals “new” even when `is_read` is preserved and unread count is unchanged.
- **Fix:** Distinguish insert vs update; `notification:new` only on insert; `publishCountUpdated` on insert, update, and delete.
- **Constitution:** Failure-mode / activity correctness (Level 2 hazard called out in the spec). Closest Articles: §3.3 (errors/events carry accurate context), §5.4 spirit (server is source of truth for what “new” means).

### R2 — must-fix — Like row copy ignores “liked” (spec-code parity)
- **Where:** `frontend/src/pages/NotificationsPage.tsx` · `NotificationAction`
- **Contract:** Spec data table + T4: render Like as “liked”; wire + A1 expect “liked your post”. Backend `messageFor` already implements this; UI does not use `item.message`.
- **Issue:** `"like"` takes the generic “reacted [glyph] …” branch.
- **Fix:** Special-case `"like"` → “liked your {target}”, or append a Revision Log entry that deliberately retires “liked” and update A1.

### R3 — must-fix — Restored duplicate migrations must not merge to `dev`
- **Where:** `database/migrations/20260801140000_message_edited_at.ts`, `…04160000_conversation_pins.ts`, and the early-return guard on `…06130000_conversation_pins.ts`
- **Contract / §10.3:** Feature schema change is only `20260807130000_notification_reaction_activity.ts`. Rev 3 local history recovery is not shared migration history.
- **Issue:** Duplicate timestamps/functions; out-of-order pending migrations on DBs that already applied later files; ambiguous `conversation_pins` ownership on rollback.
- **Fix:** Remove restored files from this PR before merge; keep the notification migration only.

### R4 — concern — `messageFor` non-Like uses enum keys (`haha`) not glyphs
- **Where:** `src/services/NotificationService.ts`
- **Fix:** Map to glyph/label, or keep `message` aligned with what clients may display.

### R5 — concern — No tests for upsert/delete uniqueness paths
- **§20.1 / §20.2:** Highest-risk new model/service behavior has no automated proof.
- **Fix:** Add focused tests (duplicate upsert → one row, `is_read` preserved, targeted delete, self-skip).

### R6 — advisory — NotificationsPage continues to accrete type/fetch logic
- **§14.3 / §15.1:** Acceptable under “no broad rewrite”; extract on the next notification touch.

## What looks good
- Routes → services → models respected; no new service-layer `db()` (§7.1 / §7.4).
- Reaction + notification (and share + notification) are transactional (§10.5); realtime publish is after commit.
- Partial unique indexes + merge preserve `is_read`; deletes are target-scoped; self-actions no-op.
- `ACTIVITY_NOTIFICATION_TYPES` shared by HTTP counts and `NotificationRealtime`.
- Deep links and share targeting of the original post match the contract.

## Verdict
**needs-changes** — address R1–R3 before merge to `dev`. R4–R5 should be fixed or explicitly waived in the contributor turn.
