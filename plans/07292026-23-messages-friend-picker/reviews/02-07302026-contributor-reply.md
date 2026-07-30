---
turn: 02
date: 07302026
role: contributor
by: kylie
branch: kylie/messages-friend-picker → dev
spec: plans/07292026-23-messages-friend-picker/spec.html
verdict: reply
status: addressed-pending-review
addresses: [01]
---

# Contributor reply — messages friend picker (PR #26)

**Addresses:** reviewer turn `01`
**Fix commit:** [`f23a83f`](https://github.com/LagDave/socmed-test-app/commit/f23a83f)

| ID | Decision | Notes |
|----|----------|-------|
| R1 | **fix** | `onSend` / `onImage` in `ThreadView` (`frontend/src/pages/MessagesPage.tsx`) now push the REST-returned message through `mergeById` instead of `[...prev, data.message]`, matching the socket path. Socket-before-REST races no longer double-render. **This is the same defect flagged on PR #25 (plan-22 websockets, commit `975cbab`) — merge strategy: close #25, land the websocket work + this fix via #26.** No separate plan-22 review-trace turn exists on this branch, so the fix and this note stand in for it. |
| R2 | **fix** | `MessagesFriendPicker` search control is now a single persistent `Button` (search icon ⇄ ✕) carrying `aria-expanded={searchOpen}`. `closeSearch()` calls `.focus()` on that same button ref, so Esc and the close-tap both return focus to the toggle instead of dropping it. |
| R3 | **fix** | Replaced the `generation()` closure (which read `generationRef.current` at call time, so it always equaled itself) with a snapshot `const generation = generationRef.current` taken at effect setup — same pattern as the poll-fallback effect. The guard now actually trips if the effect is torn down (conversation change/unmount) before an in-flight handler runs. |
| R4 | **fix** | Split the shared `applyMessage` handler into `applyInboundNewMessage` (bound to `MESSAGE_NEW` only — merges, and only stick-to-bottom + POSTs `/read` when `msg.senderId !== user?.id`) and `applyMessagePatch` (bound to `MESSAGE_UNSENT` / `MESSAGE_REACTION` — merges in place, no scroll, no mark-read). Reactions and unsends no longer yank scroll position or mark the thread read. |
| R5 | **fix** | PR body was the copy-pasted #24 soft-page description. Rewritten via `gh pr edit 26` to describe the actual scope: Socket.IO live delivery (plan 22) + Messages friend picker (plan 23). |
| R6 | **ack** | Not re-running interactive acceptance this turn — no fake pass results. Plan-23 `A5` (zero-mutuals empty copy) stays waived per `test-results.json` (implementation covered, dedicated zero-mutuals account not exercised). Plan-22 interactive/deploy items remain as previously waived; no plan-22 review-trace folder exists on this branch to append to. |

## Merge strategy (R1 cross-note)

R1 is the same duplicate-bubble defect reviewer flagged against PR #25's Socket.IO commit (`975cbab`, shared with this branch). The fix lands here on #26, which already carries that commit. **Recommendation: close #25 without a separate fix; #26 supersedes it end to end.**

## Verification

- `npm run typecheck` — clean (tsc -b --noEmit, exit 0)
- `npm --prefix frontend run lint` — oxlint clean for touched files (pre-existing unrelated warnings only, in `AuthContext.tsx`, `ThemeContext.tsx`, `PostDetailPage.tsx`)
- `npm --prefix frontend run build` — vite build exit 0

Spec Revision Log updated (Rev 3) with the behavior change (socket apply split, generation snapshot, search toggle).
