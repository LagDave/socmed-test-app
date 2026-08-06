---
turn: 01
date: 08062026
role: reviewer
by: dave
branch: kylie/remove-load-earlier-button → dev
spec: plans/08062026-remove-load-earlier-button/spec.html
verdict: needs-changes
status: open
addresses: []
---

# Reviewer turn 01 — needs-changes

## Findings

### R1 — must-fix — Top/bottom auto-load latch can stall further pages
In `ThreadViewContent.tsx`, `hasTriggeredAutoLoadRef` / `hasTriggeredNewerLoadRef` stay `true` after the first intersection. The observer effect also depends on `loadingEarlier` / `loadingNewer`, so it disconnects and remounts when a load finishes — but the latch is not reset. Result: after one auto page-load while the sentinel stays in view, the next page does not fire until the user scrolls away and back.

**Fix:** reset the latch when a load completes (or when the observer is (re)created), or drive pagination from a single stable observer that clears the latch in the loading→idle transition while still intersecting.

### R2 — concern — Spec constraint drift vs T4 API work
Rev 0 constraints still say “No pagination API… change,” while T4/Rev 2+ correctly add `after` cursor support. Harmless for the code, but the Constraints table should be revised so parity is unambiguous.

### R3 — advisory — Aggressive `!important` spacing
`.messages-thread-item` margins use `!important`. Prefer beating specificity without `!important` unless a theme override truly requires it.

## What's good
Bidirectional search context (`before` + `after`), deferring poll/socket merge while `hasMoreNewer`, and removing the manual control are the right shape. Backend cursor validation (`before` XOR `after`) is clean.

## Merge notes
Likely conflicts with #72 (`ThreadViewContent`, timestamps) and #74 (messages inbox/thread area).
