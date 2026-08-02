---
turn: 03
date: 08022026
role: reviewer
by: dave
branch: kylie/messages-typing-indicator → dev
spec: plans/07312026-27-messages-typing-indicator/spec.html
verdict: needs-changes
status: open
addresses: [01, 02]
---

# Reviewer turn 03 — messages typing indicator (PR #42)

Re-reviewed tip `16c4b09` after contributor code fix (no contributor trace filed). Code must-fix **R2 is closed**; acceptance **R1 remains open**.

## Finding disposition

| ID | Severity | Status | Notes |
|----|----------|--------|-------|
| R1 | must-fix | **open** | Rollup `Passed` but A1–A4/A6/A8 are `pass` with **empty evidence** and "deferred to PR" waivers. §20.5 requires dated interactive evidence or explicit reviewer-signed waivers — not code-review notes alone. |
| R2 | must-fix | **closed** | `handleTypingStart` short-circuits on `activeTyping` cache — no DB hit on heartbeat when TTL active. |
| R3 | concern | **open** | Duplicated `peerId`/`isParticipant` vs `MessageService` — waivable post-merge. |
| R4 | concern | **open** | A5 non-participant gate — logic reviewed, no automated proof. |
| R5 | advisory | **ignored** | Circular import — works today. |

## Merge gate

Contributor turn required:

1. Run two-browser acceptance (A1–A4, A6, A8) on localhost or socmed-dev; record dated evidence in `test-results.json`, **or**
2. File contributor turn with written `waiver:` per item and request reviewer waiver sign-off.

Code is merge-ready once R1 acceptance is substantiated.

Also posted as **Changes requested** on the PR.
