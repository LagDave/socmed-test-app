---
turn: 01
date: 08092026
role: reviewer
by: dave
branch: kylie/friends-ui-change → dev
spec: plans/08072026-50-friends-tone-down/spec.html
verdict: ship-it
status: open
addresses: []
---

# Review turn 01 — reviewer (dave)

PR #83 · `kylie/friends-ui-change` → `dev` · Plan 50 Friends visual tone-down.

## Summary

Frontend-only visual calibration. Implementation matches Locked decisions (Rev 6) and Done criteria: one Messages-style card, no canvas / nested strip / heavy Friends shadow, mutual-count chip removed, compact left-aligned empty states. No Constitution must-fix findings. Approve for merge to `dev`.

## Findings

### R1 — concern — empty-state mobile action layout
- **Where:** `frontend/src/index.css` (`.friends-empty-state` / `@media max-width 480px`)
- **Issue:** Action uses `width: 100%` without flex-wrap/stack; overflows if `action` is passed. Spec locked “responsive stack only when needed.”
- **Disposition:** Open for a future caller; not blocking — current `FriendsPage` empty states omit `action`.

### R2 — advisory — stale Context/Risk prose in spec
- **Where:** `plans/08072026-50-friends-tone-down/spec.html` (Context; Risk)
- **Issue:** Still describes divider-only / centered empty state; Locked decisions + code are left-aligned single card.
- **Disposition:** Ignored for merge — Locked / Done / Rev log govern parity.

### R3 — advisory — PR test-plan boxes unchecked
- **Where:** PR #83 body
- **Issue:** Checklist empty while acceptance artifact is Passed.
- **Disposition:** Ignored for merge — plan acceptance is source of truth.

## Constitution
- Scope stays on Friends markup + `.friends-*` CSS; shared `.feed-card` untouched (blast-radius mitigation held).
- No §14.2 / §17.1 / §17.2 violations in the diff.

## Spec parity
- T1–T3 and Done checklist satisfied by code + Passed acceptance (A1–A4).
- `FriendsRequestForm.tsx` listed in T1 files but unchanged in TSX; strip background removed via CSS — acceptable.

## Verdict
**ship-it** — ready to merge into `dev`.
