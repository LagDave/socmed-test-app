---
turn: 01
date: 08092026
role: reviewer
by: dave
branch: kylie/message-both-react → dev
spec: plans/08072026-message-both-react/spec.html
verdict: ship-it
status: open
addresses: []
---

# Reviewer turn 01 — ship-it

PR #87 — `kylie/message-both-react` (`zarinakylie`). Frontend-only: show every non-zero message reaction on the bubble badge.

## Findings

### R1 — Hardcoded tint percent · advisory
`§4.2` — `MessageBubbleRow.tsx` themed badge uses `_14%` inline in `color-mix`; count threshold is correctly named. Spec Rev 6 documents the value. Optional extract later.

### R2 — File over single-purpose size tier · advisory
`§13.1` — `MessageBubbleRow.tsx` ~402 lines (presentational target ~200–300). Pre-existing; this change is a small net add under the ~800 ceiling.

### R3 — Empty PR body · advisory
GitHub PR summary/test plan unchecked; plan acceptance (`test-results.json` passed) is the real evidence.

## Spec-code parity

| Requirement | Status |
|-------------|--------|
| Non-zero counts in `REACTION_OPTIONS` order | OK |
| Count only when > 1 | OK (`MINIMUM_COUNT_FOR_REACTION_TOTAL`) |
| Side-by-side distinct / single+count matching | OK |
| Preserve geometry / status spacing | OK |
| Themed light tint + border + black count (Rev 6) | OK |
| No API/DB/types/picker changes | OK |
| Acceptance A1–A4 | OK (`passed`) |

## Evidence checked
- `gh pr diff 87` / `gh pr view 87` — base `dev`; +127/−14; files: `MessageBubbleRow.tsx`, plan artifacts, `CHANGELOG.md`, version bump.
- Constitution Part III checklist: no new §14.2 / §17.1 / §17.2 violations; no backend touch.
- Spec status Completed; Revision Log Rev 7 finalizes `0.1.38`.

## Verdict
**ship-it** — merge to `dev`.
