---
turn: 01
date: 08182026
role: reviewer
by: dave
branch: kylie/friends-ui-revamp → dev
spec: plans/08152026-friends-ui-revamp/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Reviewer turn 01 — needs-changes

**PR:** https://github.com/LagDave/socmed-test-app/pull/94  
**Base:** `origin/dev` (`6a329fd`) · **Head:** `9991139` · 2 commits, +1123/−271

## Findings

### R1 — must-fix — T7 is not done; acceptance A1–A6 are still pending

Spec status is still **In Progress**. The Done list is unchecked. `test-results.json` is **In Progress**: A1–A6 `pending` with empty evidence; only A7 (typecheck/lint/build) is `pass`.

**Rule:** §20.5 — *Every plan executed via `-x`/`-i` produces a `test.html` + `test-results.json` acceptance checklist … and `-d` cannot finalize until it passes or each failure is waived with a reason.*

The spec’s own T7 / Done gate is the merge gate: *“Migration, typecheck, lint, build, and isolated acceptance evidence are recorded.”* A7’s note already says A7 is **not** a waiver for API and isolated-runtime checks.

**Fix:** Run A1–A6 against an isolated runtime (and the synthetic graph in A4). Record evidence, or a written `waiver` per item. Then flip spec status / test-results rollup. Do not merge on source inspection.

### R2 — must-fix — Suggestion `isOnline` is a new presence disclosure, not the friend-only path

`FriendshipService.suggestions` sets `isOnline: isUserOnline(row.id)` for users who are **not** accepted friends. The established presence path does not do that:

- `PresenceRealtime.emitPresenceUpdates` emits `presence:friend-update` only to `listAcceptedMutualIds`.
- `FriendPresenceProvider` only listens for that event.
- Spec **Done**: *“Presence is supplied only by the established authenticated presence path.”*
- Spec **locked DTO** also lists `online state` on suggestions.

Those two statements conflict. The implementation picks the DTO and reads the **global** socket map, which is exactly the Level 3 privacy surface this plan named.

Consequences:

1. `GET /api/friends/suggestions` tells the viewer whether a non-friend is online.
2. Suggested dots / “Active now” will **not** live-update (no socket fanout to this viewer).
3. `FriendListRow` treats `isOnline !== undefined` as `canViewPresence`, so suggestion rows claim the mutual-friend presence contract.

**Fix (pick one, then Rev the spec):**

1. **Recommended:** Drop `isOnline` from the suggestion DTO. Do not pass presence into `FriendListRow` / `FriendPresenceAvatar` for suggested users (no dot, no “Active now”). Keep presence on the Friends view only.
2. Explicit spec Rev: one-shot REST presence for friends-of-friends is allowed, live updates are not, and this is an exception to friend-only emit. Do **not** expand Socket.IO emit to suggestion viewers (blast radius).

### R3 — concern — Suggestions failure blanks Friends and Requests

`useFriendsInbox.refresh` uses `Promise.all([getFriendsInbox(), getMutualFriends(), getFriendSuggestions()])`. One suggestions 500/timeout sets the page error and leaves `incoming` / `mutuals` empty.

**Rule:** failure-mode thinking (partial failure). Friends/Requests are the existing product; suggestions are additive.

**Fix:** Fetch suggestions in a separate try. If it fails, still render Friends/Requests and show a suggestions-only error/empty state.

### R4 — concern — `role="tablist"` without a complete tab pattern

`FriendsPage` uses `role="tablist"` / `role="tab"` / `aria-controls` / arrow keys, but:

- Unselected tabs are not `tabIndex={-1}` (no roving tabindex). Tab order walks all three tabs.
- Inactive panels are unmounted, so `aria-controls` points at IDs that are not in the DOM.

A2 expects Tab **and** arrow-key view selection.

**Fix:** Either implement WAI-ARIA tabs (roving tabindex, `hidden`/keep panels mounted) or drop tab roles and keep plain toggle buttons with `aria-pressed`.

### R5 — concern — `FriendsPage()` overshoots §13.2

**Rule:** §13.2 — *Max ~50 lines per component function/handler.* `FriendsPage` is 408 lines; the exported function is ~320 lines. Spec T5 already allowed extracting a suggestion row “only if it keeps page functions under the Constitution size limit.”

`FriendActions` is a start. Extract the three view panels (`FriendsPanel`, `RequestsPanel`, `SuggestedPanel`) so the page orchestrates and does not own all markup.

### R6 — advisory — PR body is still the empty template

Title “Kylie/friends UI revamp” and an unfilled `.github/pull_request_template.md`. The plan folder is the real description. Fill Summary + Test plan (and link the spec) before the next review round.

### R7 — advisory — Spec hero still says Seq 50

T7 / Rev 9 / `plans/README.md` use sequence **62**. Hero eyebrow still says Seq 50. Hygiene only; fix in the same spec pass as R1.

## What’s good

- `frontend/src/api/friends.ts` is the right §12.1 analog (`api/messages.ts`); the hook no longer inlines client paths.
- Suggestion DTO omits email/bio/cover. Query lives in `FriendshipModel` (§7.4), is parameterized, and is capped at `FRIEND_SUGGESTION_LIMIT = 6`.
- Composite indexes `(status, user_a)` / `(status, user_b)` match the lookup. Route is behind `requireAuth`.
- `UserModel.findByIds` for mutuals removes the old N+1 `findById` loop.
- Search people is on-demand username request (Rev 2). Unfriend stays behind overflow + existing `ConfirmDialog`.
- Declined candidates may reappear, matching the locked decision.
- `db.raw` + `.rows` matches `ConversationModel`’s pg pattern. Not a new layering violation.

## Authz / privacy (open)

`GET /api/friends/suggestions` is authenticated. Exclusion of self / accepted / pending is in SQL. **R2** is the remaining privacy issue (non-friend `isOnline`).

## Merge notes

Do not land this in the same production cut as **#93**. #93 promotes current `origin/dev` (through #92) and does **not** include #94. Close loop: #91 is already closed as superseded.

## Verdict

**needs-changes.** R1 and R2 before merge to `dev`.
