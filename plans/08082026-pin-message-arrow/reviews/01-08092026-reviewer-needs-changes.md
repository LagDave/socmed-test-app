---
turn: 01
date: 08092026
role: reviewer
by: dave
branch: kylie/pin-message-arrow → dev
spec: plans/08082026-pin-message-arrow/spec.html
verdict: needs-changes
status: open
addresses: []
---

# Review turn 01 — reviewer (dave)

PR #89 (`kylie/pin-message-arrow` → `dev`). Pin-caret implementation matches the plan; an unrelated notifications change must leave this PR before merge.

## Findings

### R1 — must-fix — Out-of-scope `NotificationsPage.tsx`
- **Where:** `frontend/src/pages/NotificationsPage.tsx` (commit `fix(notifications): handle unknown notification types`)
- **Issue:** Spec Context/Tasks only authorize `dropdown-menu.tsx` + `MessageBubbleRow.tsx`. This PR widens `NotificationItem.type` to `string`, adds `UNKNOWN_NOTIFICATION_META` / `isNotificationType`, and changes row rendering for unknown types — none of which appear in the plan, Done checklist, or CHANGELOG 0.1.38 entry.
- **Fix:** Remove from this PR (rebase/drop commit) or open a separate PR → `dev`. Keep pin-arrow + plan artifacts + version/changelog as the sole landing.

### R2 — concern — Caret-safe surface only via consumer className
- **Where:** `MessageBubbleRow.tsx` (`overflow-visible` on `DropdownMenuContent`); `dropdown-menu.tsx` still defaults `overflow-hidden`
- **Issue:** Spec risk mitigation called for an unclipped/nested rounded treatment at the wrapper when using the caret. Opt-in arrow export is correct; unclipped treatment is ad hoc on the consumer.
- **Fix:** Optional shared variant, or explicit contributor note that consumer override is intentional. Not a merge blocker if R1 is fixed and A1 evidence stands.

### R3 — advisory — Magic numbers (§4.2)
- **Where:** `MessageBubbleRow.tsx` — `sideOffset={10}`, arrow `width={18}` / `height={9}`
- **Issue:** Layout literals without names.
- **Fix:** Named constants if touching the file again; ignore OK for this visual-only change.

## Spec parity (in-scope)
- T1: `DropdownMenuArrow` exported; defaults unchanged — pass
- T2: top/center placement, text-only Pin/Unpin, open-state toolbar opacity, seam styling (`fill-popover`, `-mt-px`) — pass
- Out-of-scope file present: `NotificationsPage.tsx` — fail (R1)

## Verdict
**needs-changes** — strip notifications scope creep; then re-review for ship.
