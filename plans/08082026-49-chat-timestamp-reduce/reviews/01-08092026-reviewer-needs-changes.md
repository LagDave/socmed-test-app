---
turn: 01
date: 08092026
role: reviewer
by: dave
branch: kylie/chat-timestamp-reduce → dev
spec: plans/08082026-49-chat-timestamp-reduce/spec.html
verdict: needs-changes
status: open
addresses: []
---

# Review — PR #88 Chat timestamp reduction

**Verdict:** needs-changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/88  
**Base:** `dev`

## Findings

### R1 — Unrelated notifications commit stacked under this plan
**Severity:** must-fix

`b904728` (`fix(notifications): handle unknown notification types`) edits `NotificationsPage.tsx` (unknown-type fallback). Spec T1/T2 and out-of-scope list cover only the message-gap formatter. Same commit also sits under `kylie/pin-message-arrow`.

**Fix:** Drop/rebase off `b904728` for this PR, or land notifications in its own PR/plan. Tip should be formatter + plan artifacts + changelog only.

### R2 — Completed status / changelog omit the notifications delta
**Severity:** concern

Spec Rev 5 + CHANGELOG 0.1.38 describe only the compact time separator. Merging the current tip would ship notifications UI behavior without plan/acceptance/changelog coverage.

**Fix:** Resolve with R1 (preferred), or expand plan + acceptance + changelog if intentionally shipping both (not recommended on this branch name).

### R3 — PR description still template
**Severity:** advisory

Fill Summary / Test plan for the formatter change (and confirm stack cleanup).

## Spec-code parity (intended scope)

| Requirement | Status |
|-------------|--------|
| Time-only label via `formatMessageTimeSeparator` | OK (`toLocaleTimeString` hour + 2-digit minute) |
| Invalid-date → empty string | OK |
| Sole timeline consumer unchanged | OK (`ThreadViewContent.tsx`) |
| 10-minute threshold / day separators / grouping untouched | OK |
| No notifications / other surfaces | FAIL — `NotificationsPage.tsx` in PR via `b904728` |

## What's good

Formatter change is minimal and correctly scoped to the named helper; invalid-date path preserved; acceptance A1/A2 recorded for the chat behavior.

## Merge gate

Do not approve until **R1** is resolved (clean tip vs `dev`). Re-review after rebase/split.
