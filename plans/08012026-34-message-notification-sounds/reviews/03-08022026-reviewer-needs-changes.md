---
turn: 03
date: 08022026
role: reviewer
by: dave
branch: kylie/message-notification-features → dev
spec: plans/08012026-34-message-notification-sounds/spec.html
verdict: needs-changes
status: open
addresses: [01, 02]
---

# Reviewer turn 03 — message notification sounds (PR #49)

Re-reviewed tip `44512e6` after contributor turn 02. Prior must-fix code items **closed**; acceptance still blocking.

## Finding disposition

| ID | Severity | Status | Notes |
|----|----------|--------|-------|
| R1 | must-fix | **closed** | `isViewingConversation()` wired; open-thread suppress works. |
| R2 | must-fix | **open** | Rollup honestly `In Progress` — A1–A5 still `fail` / pending interactive verify. |
| R3 | must-fix | **closed** | CHANGELOG corrected for off-thread + suppress behavior. |
| R4 | concern | **closed** | `teardownMessageNotificationSoundListener()` in effect cleanup. |
| R5 | concern | **ignored** | Activity sound dead code removed or deferred — verify on branch. |
| R6–R7 | advisory | **ignored** | Default sound / no-op exports — optional. |

## Merge gate

Run acceptance A1–A5 (two browsers, off-thread sound, open-thread suppress, mute toggle, own-message silence). Update `test-results.json` to `Passed` or item-level waivers with evidence.

Also posted as **Changes requested** on the PR.
