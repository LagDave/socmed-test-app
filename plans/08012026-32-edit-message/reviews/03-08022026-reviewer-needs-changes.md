---
turn: 03
date: 08022026
role: reviewer
by: dave
branch: kylie/edit-message → dev
spec: plans/08012026-32-edit-message/spec.html
verdict: needs-changes
status: open
addresses: [01, 02]
---

# Reviewer turn 03 — edit message (PR #47)

Re-reviewed tip `cef60a6` after contributor turn 02. **R2 and R3 closed**; **R1 acceptance still open**.

## Finding disposition

| ID | Severity | Status | Notes |
|----|----------|--------|-------|
| R1 | must-fix | **open** | Rollup `Passed` but A1–A7 rely on "deferred to PR author" waivers without dated evidence. T0/A8 have evidence; interactive UI/socket items do not. |
| R2 | must-fix | **closed** | `MessageService.edit` rejects `!existing.body?.trim()` — image-only guard matches UI. |
| R3 | must-fix | **closed** | Migration renumbered `20260801150000_message_edited_at.ts`. |
| R4 | concern | **ignored** | No vitest harness — A7 waiver acceptable for v1. |
| R5 | concern | **ignored** | Bundled migrations documented in Rev 4. |
| R6 | advisory | **closed** | A3/A4 titles updated for compose-bar UX. |

## Merge gate

Contributor turn: run two-browser acceptance (A1–A7) with evidence, **or** file explicit per-item waivers for reviewer sign-off (same pattern as PR #43).

Also posted as **Changes requested** on the PR.
