---
turn: 01
date: 08012026
role: reviewer
by: dave
branch: kylie/reply-to-chat → dev
spec: plans/07312026-29-reply-to-chat/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — reply to chat (PR #44)

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/44

Messenger-style quote replies are well-shaped end-to-end: migration + FK, server validation, join-hydrated `replyTo` on list/create/socket, composer preview, in-bubble quote strips, unsent-original handling, inbox `↩` prefix, and touch/hover action UX. Layering and authz on `replyToMessageId` (same conversation, target not unsent) look correct.

Merge is blocked on missing plan artifacts / acceptance, plus a socket-effect dependency issue.

## Spec parity

| Spec / PR claim | Code | Status |
|-----------------|------|--------|
| Flat thread + inline quotes | `MessageQuoteStrip`, no nesting | OK |
| Hover ↩ beside react | `MessageHoverActions` | OK |
| Reply to any non-unsent message | `MessageService.send` validation | OK |
| Composer preview (name + snippet/thumb) | `MessagesPage` preview bar | OK |
| Reply-to-reply allowed | FK only, no depth limit | OK |
| Tap quote → scroll deferred v1 | No scroll handler on strip | OK (deferred) |
| Inbox `↩` + reply body | `ConversationListRow.snippet` | OK |
| Plan folder + acceptance artifact | **Not on branch** | **Gap** |
| Manual acceptance checklist | PR body items unchecked | **Gap** |

`plans/07312026-29-reply-to-chat/` is referenced in the PR body and CHANGELOG but is absent from the branch (spec, `test.html`, `test-results.json`). Only the review trace directory is added by this turn.

## Findings

### R1 — Plan folder and acceptance artifact missing from branch
**Severity:** must-fix  
**Constitution:** §20.5 — every executed plan ships `test.html` + `test-results.json`; `-d` cannot finalize without passing acceptance or waivers.  
**Where:** repo root — no `plans/07312026-29-reply-to-chat/spec.html`, `test.html`, or `test-results.json`  
**Issue:** PR and CHANGELOG cite a completed plan, but the spec and Layer-2 acceptance checklist are not in the repo; manual acceptance items in the PR remain unchecked.  
**Fix:** Land the plan folder from the planning worktree (spec + acceptance JSON/HTML with results or written waivers). Re-run manual acceptance on dev/staging after `npm run migrate`.

### R2 — Socket `useEffect` re-subscribes when reply target changes
**Severity:** must-fix  
**Where:** `frontend/src/pages/MessagesPage.tsx` — socket listener effect deps include `replyToMessage?.id`  
**Issue:** Picking or clearing a reply target tears down and rebinds all message socket handlers. Events arriving during that window can be dropped; the effect does not need `replyToMessage` in its dependency array for handler registration.  
**Fix:** Keep `replyToMessage?.id` in a ref (`replyTargetIdRef`) read inside `applyMessagePatch`; limit effect deps to `[conversationId, user?.id]`.

### R3 — Quoting messages stay stale when socket is down
**Severity:** concern  
**Where:** `MessagesPage.tsx` — poll merge path vs `patchReplyTargetsUnsent` on socket unsend  
**Issue:** When a peer unsends an original, socket clients patch in-memory messages that quote it via `patchReplyTargetsUnsent`. The HTTP poll fallback only merges the returned page; older quoting messages already loaded via pagination are not patched if the socket is disconnected.  
**Fix:** Apply `patchReplyTargetsUnsent` after poll merge when any returned message has `isUnsent`, or re-fetch the visible window.

### R4 — No automated tests for new reply contract
**Severity:** concern  
**Constitution:** §20.1 / §20.2 — service tests should cover contract and error paths.  
**Where:** `MessageService.send` reply validation; `MessageModel.listWithReplyContext` join  
**Issue:** No tests exist for invalid cross-conversation `replyToMessageId`, unsent target rejection, or join hydration / unsent parent shaping. (The repo has no `MessageService` tests today; this feature adds non-trivial validation worth covering.)  
**Fix:** Add vitest cases mirroring `MessageService.ts` paths: happy reply, wrong conversation, unsent target, unsent parent reflected in `replyTo.isUnsent`.

### R5 — `findByIdWithReply` uses empty conversation id
**Severity:** advisory  
**Where:** `src/models/MessageModel.ts` — `listWithReplyContext("", { limit: 1, ids: [id] })`  
**Issue:** Works because `ids` bypasses the conversation filter, but the empty string is a magic value that obscures intent.  
**Fix:** Split a dedicated `findByIdWithReply` query or pass an explicit optional `conversationId` parameter.

### R6 — Unused `messageQuotePreview` export
**Severity:** advisory  
**Where:** `frontend/src/components/MessageQuoteStrip.tsx`  
**Issue:** Exported helper is never imported; composer uses inline preview logic in `MessagesPage`.  
**Fix:** Remove export or reuse in composer for DRY.

### R7 — Bundled `delivered_at` migration
**Severity:** advisory  
**Where:** `database/migrations/20260731140000_message_delivered_at.ts`  
**Issue:** Unrelated to reply-to-chat; increases review surface. Changelog rationale (branch parity) is reasonable.  
**Fix:** OK to keep if team wants parity; otherwise split to a chore PR.

## What's good

- Migration: nullable `reply_to_message_id` with FK `ON DELETE SET NULL` and composite index
- Server: Zod + same-conversation + not-unsent gates before insert; `replyTo` embedded on list/create/reaction/unsend/socket via join
- UI: quote strip, composer preview + cancel, clears on send/thread change/unsent target
- Touch: `useCanHover` + tap-to-reveal actions beside bubble (fixes clip + mobile)
- API client: clearer errors on empty/non-JSON responses when migrate/API is down
- Typecheck passes on PR head

## Merge gate

1. **R1** — land plan folder + passing (or waived) acceptance before merge.  
2. **R2** — fix socket effect deps / use ref.  
3. **R3–R4** — address or explicitly waive with reason.  
4. **R5–R7** — optional follow-up.

Also posted as **Changes requested** on the PR.
