---
turn: 01
date: 08012026
role: reviewer
by: dave
branch: kylie/timeline-reaction-fix → dev
spec: N/A — no plan folder; reviewed against Code Constitution + engineering standards
verdict: needs-changes
status: open
addresses: []
---

# Reviewer turn 01 — needs-changes (PR #41)

Review of `c268b75` — timeline reaction layout fix + who-reacted list (`GET /api/posts/:id/reactions`, `GET /api/comments/:id/reactions`).

**Scope note:** No dedicated plan folder or `spec.html` for this PR. Plan 24 (`07292026-24-reaction-summary-layout`) explicitly excluded who-reacted; this is net-new scope reviewed against engineering standards only.

## Findings

| ID | Severity | Finding |
|----|----------|---------|
| R1 | **must-fix** | Popover header shows full `totalCount` from `ReactionSummary`, but the list API defaults to `limit: 50` and the client never passes `limit`. When total reactions exceed 50, the UI claims e.g. "60 reactions" while rendering at most 50 rows — no truncation footer, pagination, or aligned count. |
| R2 | concern | **§7.1 / performance** — `ReactionService.hydrateList` runs up to 50 sequential `UserModel.findById` calls (`Promise.all(rows.map(...))`). A list endpoint should batch users via `whereIn` or a model join, not N+1 per row. |
| R3 | concern | **§14.3** — `ReactionsListPopover` fetches with inline `useEffect` + `api.get` instead of a `useReactionsList()` hook. Matches existing `ReactionBar` drift but violates the constitution's data-flow chain. |
| R4 | concern | Popover is anchored `bottom-full right-0` with no flip/clamp logic. On feed/profile posts near the viewport top, the dialog can render off-screen. |
| R5 | advisory | **§20.5** — No acceptance artifact (`test.html` / `test-results.json`) for the new who-reacted behavior. |
| R6 | advisory | **§20.1** — No automated tests for new list service/controller paths (repo-wide test gap, but these endpoints add untested surface). |
| R7 | advisory | `panelRef` in `ReactionsListPopover.tsx` is declared but never used. |

### R1 detail

**Where:** `frontend/src/components/ReactionsListPopover.tsx` (header `totalCount`), `src/models/ReactionModel.ts` (`limit ?? 50`), `src/services/ReactionService.ts` (`listQuerySchema`).

**Fix (pick one):** (a) drive header count from `entries.length` when list is truncated and show "Showing 50 of 60"; (b) pass `limit` matching summary total (cap sensibly); (c) add pagination/load-more when `entries.length < totalCount`.

### R2 detail

**Where:** `src/services/ReactionService.ts` — `hydrateList`.

**Fix:** Add `UserModel.findByIds(ids: string[])` (or join users in `ReactionModel.listForTarget`) and map once.

## What's good

- **Layout fix:** Removing `POST_MEDIA_BREAKOUT` from embedded `PostCard` action row keeps reaction controls inside the profile timeline card; `.feed-action-row` CSS still supplies the top border.
- **Backend layering:** Routes → `ReactionsController` → `ReactionService` → `ReactionModel`; query validated with Zod; `requireAuth` on both GET routes.
- **UX:** Reaction summary is a proper button (`aria-haspopup`, `aria-expanded`); click-outside closes picker and list; emoji filter chips when multiple types present; profile links close popover on navigate.
- **Types:** `ReactionEntry` added to `frontend/src/api/types.ts`; frontend typecheck passes on branch tip.

## Merge gate

1. **R1 must be fixed** (count/list alignment or explicit truncation UX).
2. **R2–R4:** fix or document waiver in contributor turn.
3. **R5–R7:** advisory — acceptable to defer with note.

**Verdict: needs-changes** — do not merge until R1 is resolved.
