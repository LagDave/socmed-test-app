---
turn: 03
date: 07282026
role: reviewer
by: dave
branch: kylie/comment-replies → dev
spec: plans/07282026-11-comment-replies/spec.html
verdict: resolved
status: resolved
addresses: [01, 02]
---

# Reviewer confirm — PR #5

Responds to turn `02` (Kylie, contributor reply). Re-checked tip `b39cfec` / execution `ae69a7d` + spec Rev 6 against the open findings from turn `01`.

## Per finding

| ID | Outcome | Notes |
|----|---------|-------|
| **R1** | resolved | Inline composer locked across PR title/body, CHANGELOG, What/Must/Must Not/locked decisions/T3/Done, and acceptance T3. Spec–code parity restored. |
| **R2** | resolved | `groupComments` returns `orphans`; they render after threads. |
| **R3** | ignored | Accepted — app-layer one-level guard is enough for this PR; DB constraint deferred. |
| **R4** | resolved | Shared `submitComment` helper in place. |
| **R5** | ignored | Accepted — CASCADE remains spec-allowed; document when delete is productized. |
| **R6** | resolved | Full comment/reply state cleared on post `id` change. |

## Verdict

**ship-it / resolved.** No remaining must-fix. Loop closed on this reviewer turn.

## Non-blocking note

T3 is source-aligned `pass` without a fresh interactive `-tw` click-through; acceptable given prior waiver context and the docs fix.
