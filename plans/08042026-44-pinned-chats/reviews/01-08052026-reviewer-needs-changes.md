---
turn: 01
date: 08052026
role: reviewer
by: dave
branch: codex/reconcile-pinned-chats-with-dev → dev
spec: plans/08042026-44-pinned-chats/spec.html
verdict: needs-changes
status: open
addresses: []
---

# Review turn 01 — PR 66 → `dev`

Solid reconciliation overall: shared pins land in current message boundaries, `MessagePinService` keeps `MessageService` under the ceiling, participant/deletion/unsent filters are consistent on the server, and contained acceptance is recorded as Passed.

## Findings

### R1 — concern — Stale pin activity in open threads after unsend

Unsending a pinned message deletes the pin and emits `message:pins-updated` with `pinActivity: null`, so `pinnedMessages` clears but `pinActivities` is left untouched in `ThreadView`. With a live socket, polling is disabled, so the timeline can keep “X pinned a message” until reload.

Inbox is fine: `messageUnsent` already emits `conversation:updated`.

**Fix:** On unsend pin cleanup (server and/or client), drop or replace activities for that `messageId` — e.g. send the refreshed `pinActivities` list, or filter them out in the `MESSAGE_UNSENT` / pins-updated handlers.

### R2 — concern — Spec status/Done lag behind acceptance

Hero pill is still **In Progress**, Done boxes unchecked, while Rev 9 + `test-results.json` say acceptance Passed. That blocks a clean `-d` and misleads the next reviewer.

**Fix:** Set status to Completed (or Needs Revision if R1 is in scope), tick Done items that are actually done, and add a Rev note if R1 stays open.

### R3 — concern — No automated coverage for new pin auth/visibility

`§20.1` / `§20.2` — New `MessagePinModel` / `MessagePinActivityModel` / `MessagePinService` have no mirrored tests. The repo currently has no `.test.ts` suite, and Layer-2 acceptance covers the happy paths — but nonparticipant / hidden / unsent / idempotent pin cases are exactly what should be locked in code.

**Fix:** Prefer at least service/API contract tests for those cases before calling the feature done for good. Acceptable to waive for this PR if the team’s current bar is acceptance-only — say so explicitly.

### R4 — advisory — Ceiling headroom is thin

`§2.4` / `§13.1` — `ThreadView.tsx` ≈ 778 lines, `MessageService.ts` ≈ 762. Extracted helpers were the right move; any further edits in those files need more extraction first.

### R5 — advisory — `message_pin_activities.action` unconstrained

Prefer a DB `CHECK` (or enum) for `pinned` / `unpinned`.

### R6 — advisory — `MessageBubbleRow` leftover `( (`

Cosmetic after widening the overflow menu beyond `mine`; peers correctly get Pin only.

## Observations

- Layering is right: routes thin + auth, controller orchestration, pin logic in `MessagePinService`, DB in models, transactions on pin/unpin/unsend.
- Visibility rules (participant, per-user deletion, unsent) are applied consistently in list/pin/inbox SQL.
- Scope correction dropping private `conversation_pins` matches the spec and acceptance evidence.
- Frontend stays on the typed `api/` + socket path; pin state owned by `ThreadView` as intended.
- PR description is still the empty template — fill Summary/Test plan before merge.

## Verdict

**needs-changes** — primarily **R1** (stale thread pin activity after unsend) and **R2** (spec status/Done parity). R3 is a team-bar call; R4–R6 are fine as follow-ups.
