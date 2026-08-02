---
turn: 01
date: 08012026
role: reviewer
by: dave
branch: kylie/message-delete-conversation → dev
spec: plans/08012026-33-message-delete-conversation/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — delete conversation for you only (PR #48)

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/48

Reviewed against Code Constitution and delete-for-you-only auth requirements. **Authz model is sound** — participant check, per-user hide columns, scoped `message_user_deletions`, peer isolation, and deleter-only realtime are correct. Blocked on spec parity and layering before merge.

## Findings

### R1 — Spec artifact missing
**Severity:** must-fix  
**Where:** branch root / `CHANGELOG.md`

CHANGELOG marks `plans/08012026-33-message-delete-conversation` as Completed, but the plan folder (spec, acceptance checklist) is not in the branch. Land the spec or correct the changelog claim.

**Fix:** Add plan folder with spec + acceptance artifacts, or update CHANGELOG to reflect missing plan.

### R2 — §7.4 inline DB in service
**Severity:** must-fix  
**Where:** `src/services/MessageService.ts` — `deleteConversationForUser`

`MessageService.deleteConversationForUser` writes `conversations` via `trx(...).update()` directly. Knex belongs in models. Use `ConversationModel.setHidden` (already added) with a `trx` parameter instead of duplicating patch logic in the service.

**Fix:** Route hide-column updates through `ConversationModel` with transaction support.

### R3 — Transaction read off-connection
**Severity:** concern  
**Where:** `MessageService.deleteConversationForUser`

`ConversationModel.findById` inside `db.transaction` uses the default pool, not `trx`. Pass `trx` into model reads within the transaction.

### R4 — No automated auth tests
**Severity:** concern

Add service/route tests for non-participant → forbidden, deleter-only hide/deletions, and peer inbox/history unchanged.

### R5 — Pagination cursor sparsity
**Severity:** advisory

Pagination `before` cursor may produce sparse pages when many messages are deleted-for-viewer.

## What's good

- Delete-for-you-only semantics preserve peer history
- Swipe UI and scoped deletions align with Messenger-style UX
- Realtime events scoped to deleter only
- Participant authz on delete path

## Merge gate

1. **R1** — land plan folder or fix changelog
2. **R2** — model-layer writes for hide columns
3. **R3/R4** — address or waive in contributor turn

Also posted as **Changes requested** on the PR.
