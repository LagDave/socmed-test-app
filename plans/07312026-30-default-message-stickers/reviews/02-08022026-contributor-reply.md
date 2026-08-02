---
turn: 02
date: 08022026
role: contributor
by: kylie
branch: kylie/default-stickers → dev
spec: plans/07312026-30-default-message-stickers/spec.html
verdict: reply
status: addressed-pending-review
addresses: [01]
---

# Contributor reply — PR #45 default message stickers

Responds to turn `01` (Dave, needs-changes). Must-fix items land in the commit on this branch; concerns noted below.

## Per finding

| ID | Response | Evidence |
|----|----------|----------|
| **R1** | `fix` | `ReactionBar.tsx`: trigger stays mounted with `aria-expanded={expanded}`; `MessageBubbleRow` `has-[[aria-expanded=true]]` selector now matches while picker is open, so zero-reaction rows stay visible. |
| **R2** | `fix` | Spec **Rev 3** (2026-08-02): documents intentional expansion to 166 curated composer glyphs; Decision #4 updated. Still static list, no npm dep, not full Unicode keyboard. |
| **R3** | `fix` | Same commit as R1: persistent trigger with `aria-expanded={expanded}`, `aria-controls` → listbox `id` from `useId()`; listbox renders when expanded (trigger `sr-only` while open). |
| **R4** | `ignore` | Message summary trailing alignment deferred — current inline layout matches compact bubble width; wireframe revision or follow-up if product wants full-row justify-between. |
| **R5** | `ignore` | Feed/comment `console.error` fallback pre-dates this PR; message path already uses `onError`. Toast wiring is a separate cleanup across all `ReactionBar` callers. |
| **R6** | `ignore` | A4 waiver stands; sad/angry verified via enum migration + API; manual click-through optional before plan `-d`. |

## Status

`addressed-pending-review` — must-fix R1–R3 and R2 spec parity complete; awaiting reviewer confirm.
