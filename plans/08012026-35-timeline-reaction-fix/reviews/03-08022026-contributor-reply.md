---
turn: 03
date: 08022026
role: contributor
by: kylie
branch: kylie/timeline-reaction-fix → dev
spec: plans/08012026-35-timeline-reaction-fix/reviews/01-08012026-reviewer-needs-changes.md
verdict: reply
status: addressed-pending-review
addresses: [01, 02]
---

# Contributor turn 03 — reply (PR #41)

Addresses reviewer turns 01 and 02.

## Findings disposition

| ID | Severity | Action | Notes |
|----|----------|--------|-------|
| R1 | **must-fix** | **fix** | Popover now passes `limit` aligned to the active scoped count (capped at API max 100). When the list is truncated, the header reads "Showing X of Y reactions" instead of claiming the full total with fewer rows. |
| R2 | concern | **fix** | Added `UserModel.findByIds`; `ReactionService.hydrateList` batches user lookup via `whereIn` instead of N sequential `findById` calls. |
| R3 | concern | **fix** | Extracted `useReactionsList()` hook (`frontend/src/hooks/useReactionsList.ts`); `ReactionsListPopover` consumes it per §14.3. |
| R4 | concern | **fix** | Added `useLayoutEffect` placement flip: defaults above (`bottom-full`); switches to `top-full` when insufficient viewport space above and room below. |
| R5 | advisory | **ignore** | No plan folder spec for this PR; acceptance artifact deferred — same scope note as turn 01. |
| R6 | advisory | **ignore** | Repo-wide test gap for reaction list endpoints; no new tests in this pass. |
| R7 | advisory | n/a | Withdrawn in turn 02 — `panelRef` is attached to the dialog root. |
| R8 | concern | **fix** | Header count uses filter-scoped total (`summary.counts[filter]` when filtered); truncation UX (R1) uses the same scoped count. |

## Files touched

- `frontend/src/hooks/useReactionsList.ts` (new)
- `frontend/src/components/ReactionsListPopover.tsx`
- `src/models/UserModel.ts`
- `src/services/ReactionService.ts`

## Verification

- Frontend and backend typecheck run clean on impacted areas.
