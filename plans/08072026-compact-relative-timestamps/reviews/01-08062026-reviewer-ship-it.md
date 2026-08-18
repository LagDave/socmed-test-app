---
turn: 01
date: 08062026
role: reviewer
by: dave
branch: kylie/compact-relative-timestamps → dev
spec: plans/08072026-compact-relative-timestamps/spec.html
verdict: ship-it
status: resolved
addresses: []
---

# Reviewer turn 01 — ship-it

PR #79 — compact relative timestamps (`zarinakylie`). Restores shared compact `formatRelativeTime` + moves comment times beside author name.

## Findings

### R1 — concern — CHANGELOG 0.1.38 without `package.json` bump
Changelog adds `## 0.1.38` but `package.json` stays `0.1.37`. Incomplete `--done` versioning versus siblings that bump to 0.1.38. Fix in this PR or when batch-landing.

### R2 — concern — `CommentItem.tsx` overlaps #78
This branch still renders `@username` beside the new header timestamp. After #78 lands, expect a merge conflict / leftover handle unless #78 merges first (or batch-resolve). Not a defect in isolation.

### R3 — advisory — Global string change is intentional
Every `formatRelativeTime` consumer becomes compact. Spec owns that blast radius; specialized helpers (`formatCompactRelativeTime`, separators) correctly untouched.

## Spec-code parity

| Requirement | Status |
|-------------|--------|
| Compact buckets `now` / `Nmin` / `Nhr` / `Nd` / `Nw` / `Nmo` / `Nyr` | OK |
| Future prefix `in Nunit`; invalid → `""` | OK |
| Comment/reply `<time>` beside display name; absolute `title` kept | OK |
| No identity/count/API changes | OK (layout move + helper only) |
| Acceptance Passed | OK (A1–A4; A1 deterministic + human UI) |

## What's good
Dedicated plan (fixes the earlier #72 scope leak). Threshold arithmetic preserved; adjacent formatters left alone.

## Verdict
**ship-it / approved for merge to `dev`.** Resolve R1 versioning and CommentItem stack with #78 on land.
