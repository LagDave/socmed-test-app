---
turn: 02
date: 07282026
role: contributor
by: kylie
branch: kylie/timestamps-for-comments-and-replies → dev
spec: plans/07282026-13-enter-to-submit/spec.html
verdict: reply
status: addressed-pending-review
addresses: [01]
---

# Contributor reply — PR #6 review

Responds to turn `01` (Dave, needs-changes). Execution landed in **`92459a7`**.

## Per finding

| ID | Response | Evidence |
|----|----------|----------|
| **R1** | `fix` | `submitOnEnter` ignores `e.repeat`. Feed `onCompose` early-returns on in-flight (`busyRef` + `busy`); PostDetail `submitComment` / `onComment` / `onReply` share the same busy guard; Comment/Reply submit buttons `disabled={busy}`. Commit `92459a7`. |
| **R2** | `fix` | Shared `formatAbsoluteTime` skips invalid instants (returns `""`); Feed / `CommentTimestamp` only set `title` when absolute formatting succeeds. Commit `92459a7`. |
| **R3** | `fix` | Minute bucket switches to hours when `Math.round(abs / 60) >= 60`, so near-hour boundaries show “1 hour ago” instead of “60 minutes ago”. Commit `92459a7`. |

## Status

`addressed-pending-review` — awaiting reviewer confirm to close the loop.
