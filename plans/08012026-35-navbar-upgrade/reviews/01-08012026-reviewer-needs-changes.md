---
turn: 01
date: 08012026
role: reviewer
by: dave
branch: kylie/navbar-upgrade → dev
spec: plans/08012026-35-navbar-upgrade/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — navbar upgrade (PR #50)

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/50

Visual polish direction is right: `AppNavbar` / `NavIconLink` extraction, shared `.app-navbar-*` tokens, ProfileAvatar `xs`, and slimmer `AppShell` all look good. Typecheck/build pass. Three must-fix items block merge on active-state and tap-target correctness.

## Findings

### R1 — Feed NavLink missing `end`
**Severity:** must-fix  
**Where:** `frontend/src/components/AppNavbar.tsx` (Feed `NavIconLink`)

`NavLink to="/"` without `end` is active on every route in React Router v7. The Home pill stays elevated on Friends, Messages, profile, etc. — the pill-cluster active state (core deliverable) never reflects the current page.

**Fix:** Add optional `end` to `NavIconLink`; pass `end` on the Feed link.

### R2 — Profile dropdown strips elevation
**Severity:** must-fix  
**Where:** `AppNavbar.tsx` — `DropdownMenuContent`

`DropdownMenuContent` includes `shadow-none`, overriding `.profile-dropdown-menu` box-shadow. Menu renders flat vs profile-page dropdowns — contradicts spec.

**Fix:** Remove `shadow-none`; rely on shared `.profile-dropdown-menu` styling.

### R3 — Profile trigger below 36px tap target
**Severity:** must-fix  
**Where:** `.app-navbar-profile-trigger`

Plan 35 risk table requires 36px min tap targets. Trigger wraps a 32px (`h-8`) avatar with no padding.

**Fix:** Give `.app-navbar-profile-trigger` 36px min dimensions; center the xs avatar inside.

## What's good

- Component extraction keeps `AppShell` readable
- Shared CSS tokens for navbar chrome consistency
- ProfileAvatar size variant reuse
- Typecheck/build green

## Merge gate

Fix R1–R3 before merge. Re-request review after contributor turn.

Also posted as **Changes requested** on the PR.
