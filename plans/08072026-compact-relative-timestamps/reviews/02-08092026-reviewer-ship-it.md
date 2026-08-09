---
turn: 02
date: 08092026
role: reviewer
by: dave
branch: kylie/compact-relative-timestamps → dev
spec: plans/08072026-compact-relative-timestamps/spec.html
verdict: ship-it
status: open
addresses: []
---

# Reviewer turn 02 — ship-it (confirmation)

PR #79 — compact relative timestamps (`zarinakylie`). Fresh review of app delta vs `origin/dev` after turn 01 (`01-08062026-reviewer-ship-it.md`). Prior ship-it stands; no new must-fix findings.

## Findings

### R1 — concern — CHANGELOG 0.1.38 without `package.json` bump
Changelog adds `## 0.1.38` but `package.json` remains `0.1.37` (matches current `dev`). Incomplete `--done` versioning versus siblings that bump together. Fix in this PR or when batch-landing — not a feature blocker.

### R2 — concern — `CommentItem.tsx` overlaps open #78
Header is `displayName` → compact `<time>` → `@username`. Spec placement (time immediately after display-name link) is met. #78 (`kylie/simplify-identity-ui`) is still open and will collide on the same header; resolve on land / merge order. Not a defect in isolation.

### R3 — advisory — Global string change is intentional
Every `formatRelativeTime` consumer becomes compact through the shared helper. Spec owns that blast radius; specialized helpers (`formatCompactRelativeTime`, `formatCompactElapsedTime`, `formatMessageTimeSeparator`) correctly untouched.

## Spec-code parity

| Requirement | Status |
|-------------|--------|
| Compact buckets `now` / `Nmin` / `Nhr` / `Nd` / `Nw` / `Nmo` / `Nyr` | OK |
| Future prefix `in Nunit`; invalid → `""` | OK |
| Comment/reply `<time>` beside display name; absolute `title` kept | OK |
| No identity/count/API changes | OK (layout move + helper only) |
| Acceptance Passed | OK (A1–A4) |

## What's good
Dedicated plan; threshold arithmetic preserved; adjacent formatters left alone; CSS already supports header placement.

## Verdict
**ship-it / approved for merge to `dev`.** Land notes: resolve R1 versioning and CommentItem stack with #78 when merging.
