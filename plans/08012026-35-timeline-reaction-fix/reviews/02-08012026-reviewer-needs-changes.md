---
turn: 02
date: 08012026
role: reviewer
by: dave
branch: kylie/timeline-reaction-fix → dev
spec: plans/08012026-35-timeline-reaction-fix/reviews/01-08012026-reviewer-needs-changes.md
verdict: needs-changes
status: open
addresses: [01]
---

# Reviewer turn 02 — needs-changes (PR #41)

Re-review of `3460c24` (tip). Turn 01 reviewed `c268b75`; the only commit since is `3460c24` (`docs: add reviewer trace`), which lands turn 01 on the branch. **No application-code changes address turn 01 findings.**

## Turn 01 disposition

| ID | Severity | Status | Notes |
|----|----------|--------|-------|
| R1 | **must-fix** | **open** | Unchanged. Popover header still derives `totalCount` from `ReactionSummary`; fetch at `ReactionsListPopover.tsx:57–61` never passes `limit`; API defaults to 50 (`ReactionModel.ts:156`). |
| R2 | concern | **open** | Unchanged. `ReactionService.hydrateList` still N+1 via `Promise.all(rows.map → UserModel.findById)` (`ReactionService.ts:82–83`). |
| R3 | concern | **open** | Unchanged. **§14.3** — inline `useEffect` + `api.get` in `ReactionsListPopover.tsx:47–76`; no `useReactionsList()` hook. |
| R4 | concern | **open** | Unchanged. Dialog anchored `bottom-full right-0` (`ReactionsListPopover.tsx:93`) with no flip/clamp. |
| R5 | advisory | **open** | Unchanged. **§20.5** — no `test.html` / `test-results.json` for who-reacted behavior. |
| R6 | advisory | **open** | Unchanged. **§20.1** — no automated tests for list service/controller paths. |
| R7 | advisory | **withdrawn** | Turn 01 was incorrect: `panelRef` is attached to the dialog root (`ReactionsListPopover.tsx:90`). |

## New findings (turn 02)

| ID | Severity | Finding |
|----|----------|---------|
| R8 | concern | When an emoji filter chip is active, the header still shows aggregate `totalCount` (all reaction types) while the list fetches only that emoji (`ReactionsListPopover.tsx:36–37`, `:57`, `:96–97`). Header should reflect the active filter count. |

### R1 detail (still blocking)

> ⚠️ **Constitution violation — correctness (count/list alignment)**
> **Where:** `frontend/src/components/ReactionsListPopover.tsx:36–37,96–97`, `src/models/ReactionModel.ts:156`, `src/services/ReactionService.ts:28–31`
> **Issue:** UI states full summary total; API returns at most 50 rows with no truncation UX.
> **Fix:** Pass `limit` aligned to displayed count (cap at API max 100), or show explicit truncation ("Showing 50 of 60"), or paginate/load-more.
> **Severity:** must-fix

### R2 detail

> **§7.1** chain is respected (Routes → Controller → Service → Model), but **hydrateList** should batch users — add `UserModel.findByIds` or join in `ReactionModel.listForTarget`.

### R8 detail

**Where:** `ReactionsListPopover.tsx` — `totalCount` always sums all `presentTypes`; `filter` only affects query string.

**Fix:** When `filter !== "all"`, header count = `summary.counts[filter]`; truncation logic (R1) should use the same scoped count.

## What's still good

- Layout fix (`PostCard.tsx:246`) — embedded action row no longer uses `POST_MEDIA_BREAKOUT`.
- Backend layering, Zod validation, `requireAuth` on both GET routes unchanged and sound.
- Reaction summary button a11y (`ReactionBar.tsx:261–271`) and click-outside for picker + list remain solid.

## Merge gate

1. **R1 must be fixed** before merge.
2. **R2, R3, R4, R8:** fix or contributor waiver in turn 03.
3. **R5, R6:** advisory — defer with note acceptable.
4. **R7:** closed (withdrawn).

**Verdict: needs-changes** — R1 remains open; no code changes since turn 01.
