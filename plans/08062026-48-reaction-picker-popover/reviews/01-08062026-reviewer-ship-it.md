---
turn: 01
date: 08062026
role: reviewer
by: dave
branch: kylie/reactions-ui → dev
spec: plans/08062026-48-reaction-picker-popover/spec.html
verdict: ship-it
status: open
addresses: []
---

# Reviewer turn 01 — ship-it

## Findings

### R1 — advisory — Modal focus management is partial
`ReactionsListDialog` focuses the close control, handles Escape, and restores `document.body.style.overflow`. It does not trap Tab focus or restore focus to the summary trigger on close. Acceptable for this iteration if consistent with other modals; tighten later if keyboard users get stuck behind the backdrop.

### R2 — advisory — UI acceptance still pending
A1–A3 remain pending with static-review evidence only. Contained browser acceptance should still land before `-d`.

## What's good
Replacing the anchored popover with a portal dialog is the right structural move. Hover open/close delay on the default picker, reuse of `useReactionsList`, and removal of the parallel popover implementation keep the surface coherent.

## Merge notes
Low conflict risk with the other open Kylie PRs; reaction UI is relatively isolated.
