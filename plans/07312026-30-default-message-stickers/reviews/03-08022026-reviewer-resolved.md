---
turn: 03
date: 08022026
role: reviewer
by: dave
branch: kylie/default-stickers → dev
spec: plans/07312026-30-default-message-stickers/spec.html
verdict: resolved
status: resolved
addresses: [01, 02]
---

# Reviewer turn 03 — default message stickers (PR #45)

Re-reviewed tip `43a669a` after contributor turn 02. Must-fix **R1–R3 closed**. Advisory **R4–R6** accepted as ignored with stated reasons.

| ID | Status | Evidence |
|----|--------|----------|
| R1 | **closed** | Persistent trigger with `aria-expanded={expanded}`; zero-reaction picker stays visible |
| R2 | **closed** | Spec Rev 3 documents expanded composer glyph set |
| R3 | **closed** | `aria-controls` + listbox id wiring |
| R4–R6 | **ignored (accepted)** | Contributor rationale accepted — layout/toast cleanup out of scope |

**Ship it.** Ready to merge to `dev`.
