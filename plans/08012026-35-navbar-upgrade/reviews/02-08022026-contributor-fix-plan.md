---
turn: 02
date: 08022026
role: contributor
by: kylie
branch: kylie/navbar-upgrade → dev
spec: plans/08012026-35-navbar-upgrade/spec.html
verdict: fix-plan
status: addressed-pending-review
addresses: [01]
---

# Contributor response — navbar upgrade (PR #50)

## R1 — Feed NavLink missing `end`
**fix** — Added optional `end` prop to `NavIconLink`; Feed link passes `end` so `/` is active only on the feed route.

## R2 — Profile dropdown strips elevation
**fix** — Removed `shadow-none` from `DropdownMenuContent`; `.profile-dropdown-menu` shadow applies.

## R3 — Profile trigger tap target
**fix** — `.app-navbar-profile-trigger` now has `min-width` / `min-height` of 2.25rem (36px); xs avatar centered inside.

**Commit:** (this turn)
