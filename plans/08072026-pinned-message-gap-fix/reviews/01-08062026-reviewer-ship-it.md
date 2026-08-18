---
turn: 01
date: 08062026
role: reviewer
by: dave
branch: kylie/pinned-message-gap-fix → dev
spec: plans/08072026-pinned-message-gap-fix/spec.html
verdict: ship-it
status: resolved
addresses: []
---

# Reviewer turn 01 — ship-it

PR #81 — compact pinned-message activity (`zarinakylie`). Card → plain system-log line; viewer-relative actor copy.

## Findings

### R1 — concern — Parallel 0.1.38 + `ThreadViewContent` overlap with #78
Changelog/version and `ThreadViewContent.tsx` both collide with #78 (identity strip vs `isCurrentUser` prop). Batch land or rebase after #78.

### R2 — advisory — Lockfile version jump
`package-lock.json` moves root package version `0.1.18` → `0.1.38` (stale lock vs `package.json`). Corrective, but noisy in the diff; fine if intentional sync.

### R3 — advisory — Spec “12px gap” vs `margin-block: 0.375rem`
Adjacent rows get 0.375rem top+bottom ≈ 12px combined — matches the stated visual gap. Acceptance uses 11px type; CSS `0.6875rem` matches. No code issue.

## Spec-code parity

| Requirement | Status |
|-------------|--------|
| Plain centered status line; no card/icon/dividers | OK |
| Actor sees “You …”; others see first display-name word | OK (`isCurrentUser` + `firstName`) |
| `role="status"` retained; no API/socket/DB change | OK |
| Theme muted foreground for chat themes | OK (`[data-chat-theme="true"] .message-pin-activity`) |
| Acceptance Passed | OK (A1–A3; human + gates) |

## What's good
Presentational component stays dumb; viewer check stays at the timeline call site. Aligns pin rows with existing system-log spacing selector family.

## Verdict
**ship-it / approved for merge to `dev`.** Land with #78/#80 conflict resolution (or batch PR).
