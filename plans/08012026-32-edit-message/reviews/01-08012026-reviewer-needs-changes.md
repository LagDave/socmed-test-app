---
turn: 01
date: 08012026
role: reviewer
by: cursor-agent
branch: kylie/edit-message → dev
spec: plans/08012026-32-edit-message/spec.html
verdict: needs-changes
status: open
addresses: []
---

# Review turn 01 — needs changes

PR [#47](https://github.com/LagDave/socmed-test-app/pull/47) (`kylie/edit-message` → `dev`). Reviewed against `plans/08012026-32-edit-message/spec.html` (Rev 4), Code Constitution, and `gh pr diff 47`.

## Verdict

**Needs changes** — core edit flow is well structured (service authz mirrors unsend, realtime wired, Messenger-style compose UX documented in Rev 3), but several spec/process gates are open before merge.

## Findings

### R1 — Acceptance checklist not passed (must-fix)

**Spec / AGENTS §20.5:** Plan status is **Completed**, yet `plans/08012026-32-edit-message/test-results.json` rollup is **In Progress**. Only T0 and A8 pass; A1–A7 (UI flows, peer socket, inbox snippet, API deny path) remain **pending** with no waivers.

**Fix:** Run the acceptance checklist (or `-tw` contained runtime), record evidence in `test-results.json`, and align spec status with rollup **Passed** (or add written waivers per item).

---

### R2 — Server does not block image-only edits (must-fix)

**Spec:** Locked decision #2 and Done checklist — *"Non-senders, unsent messages, and **image-only messages** cannot be edited."* Frontend hides Edit when `!message.body?.trim()`, but `MessageService.edit` has no equivalent guard.

**Where:** `src/services/MessageService.ts` — `edit()` validates empty trim only when `!existing.image_url`, so a client can `PATCH` an image-only row and add or change caption text despite UI hiding Edit.

**Constitution — §5.4:** *"Every authorization and validation check is authoritative on the server, regardless of what the frontend does."*

**Fix:** Reject when the stored message has no editable text, e.g. `if (!existing.body?.trim()) throw new AppError("MESSAGE_VALIDATION", "This message has no text to edit.");` before applying body changes (still allow image+caption rows that already have trimmed body per decision #7).

---

### R3 — Duplicate migration timestamp prefix (must-fix)

**Spec risk table:** *"Migration ID collision → Deploy failure — verify timestamp before merge."*

**Where:** Two new files share `20260801140000`:
- `database/migrations/20260801140000_conversation_chat_themes.ts`
- `database/migrations/20260801140000_message_edited_at.ts`

Knex orders lexicographically today, but duplicate prefixes block parallel feature branches and violate the spec's collision mitigation.

**Fix:** Renumber `message_edited_at` (and plan README) to a unique unused timestamp, e.g. `20260801150000_message_edited_at.ts`.

---

### R4 — No automated coverage for edit authz paths (concern)

**Spec T2 verify / risk mitigation:** *"Sender can PATCH body; **peer denied**; unsent denied; reaction summary preserved."*

**Constitution — §20.2:** Cover contract, error paths, and tenant scope.

Repo still has no `MessageService` tests; this PR adds none. Manual acceptance item A7 is also pending. Not blocking if acceptance A7 passes with evidence, but add at least a service-level test (or documented API curl evidence in A7) before a follow-up if test harness lands.

**Recommendation:** Pass A7 in acceptance artifact; consider vitest cases for forbidden/unsent/image-only when test infra exists.

---

### R5 — Out-of-scope migrations bundled in edit PR (concern)

**Where:** PR adds four migrations; only `edited_at` is in the edit-message spec. `reply_to`, `delivered_at`, and `chat_themes` are restored for local parity (Rev 4 / changelog) but expand blast radius and merge conflict surface with other messenger PRs.

**Recommendation:** Split or confirm no overlapping migration PRs on `dev`; document in PR body why restore belongs here vs a chore PR.

---

### R6 — Stale acceptance copy for UX (advisory)

Rev 3 moved edit UX to bottom `MessageComposeBar`; items A3/A4 titles still say *"inline edit"*. Update steps/expected text so human runners match Messenger-style flow.

---

## Observations

- Backend layering is clean: route → thin controller → `MessageService.edit` → `MessageModel.updateBody`; realtime `message:edited` + `conversation:updated` matches unsend pattern.
- Messenger-style compose bar (Rev 3) is reasonable; bubble ring highlight + bottom bar is coherent.
- Idempotent migration guards for `edited_at` fix the 500 on unmigrated DBs — good follow-up in `937075a`.
- `MessageComposeBar` extraction reduces duplication in `MessagesPage` — good hygiene.

## Ship criteria

Close **R1–R3** (must-fix). Re-run acceptance; request re-review when `test-results.json` rollup is **Passed** or waivers are explicit.
