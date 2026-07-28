---
turn: 02
date: 07282026
role: contributor
by: kylie
branch: kylie/comment-replies → dev
spec: plans/07282026-11-comment-replies/spec.html
verdict: reply
status: addressed-pending-review
addresses: [01]
---

# Contributor reply — PR #5 review

Responds to turn `01` (Dave, needs-changes). Execution landed in **`ae69a7d`** and spec **Rev 6**.

## Per finding

| ID | Response | Evidence |
|----|----------|----------|
| **R1** | `fix` | Locked inline composer UX. Synced What / Must / Must Not / locked decisions / T3 / Done, CHANGELOG, PR title/body, and `test-results.json` T3 expected + evidence. Spec Rev 6. Commit `ae69a7d`. |
| **R2** | `fix` | Orphan replies (missing parent in the top-level set) still render in the list. Commit `ae69a7d`. |
| **R3** | `ignore` | App-layer one-level guard remains; DB check/trigger deferred — optional per merge gate, not needed for this PR. |
| **R4** | `fix` | Folded upload → post → reload into one shared submit helper. Commit `ae69a7d`. |
| **R5** | `ignore` | CASCADE is allowed by spec; document when comment delete is productized. |
| **R6** | `fix` | Clear reply state on post `id` change. Commit `ae69a7d`. |

## Status

`addressed-pending-review` — awaiting reviewer confirm to close the loop.
