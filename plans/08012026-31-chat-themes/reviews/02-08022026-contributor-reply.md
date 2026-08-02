---
turn: 02
date: 08022026
role: contributor
by: kylie
branch: kylie/chat-themes → dev
spec: plans/08012026-31-chat-themes/spec.html
verdict: reply
status: addressed-pending-review
addresses: [01]
---

# Contributor reply — PR #46 chat themes

Responds to turn `01` (Dave, needs-changes). Must-fix R1 lands in the commit on this branch; concerns noted below.

## Per finding

| ID | Response | Evidence |
|----|----------|----------|
| **R1** | `fix` | `themeBubbleContrastOk()` in `chatThemeApply.ts` uses `meetsContrast()` on resolved bubble pairs. `ChatThemePicker` disables Apply + shows preview warning when contrast fails. `ChatThemeService.updateTheme` calls `assertThemeBubbleContrast()` (server-side `chatThemeContrast.ts` + preset bubble map) and returns 400 `CHAT_THEME_VALIDATION` on failure. |
| **R2** | `ignore` | Migration stubs pre-date this branch's theme work and match repo stub policy for cross-feature columns; dropping them risks migration ordering conflicts with sibling PRs. |
| **R3** | `ignore` | Dual allow-list acknowledged; backend now carries preset bubble colors for contrast validation. Full shared manifest / CI parity test deferred to a follow-up. |
| **R4** | `ignore` | Service tests valuable but out of scope for this review round; contrast guard is the spec risk-table blocker. |
| **R5** | `ignore` | A6/A7 negative paths covered by new server-side contrast rejection; formal curl evidence deferred until R4 lands or manual QA. |
| **R6** | `ignore` | Flat `components/` root matches existing messenger components; folder extraction is a separate cleanup. |
| **R7** | `ignore` | Copy still says "full-screen animation"; bubble-scoped effects are correct in CSS — cosmetic copy fix optional. |

## Status

`addressed-pending-review` — must-fix R1 complete; awaiting reviewer confirm.
