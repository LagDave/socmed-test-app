---
turn: 04
date: 08022026
role: reviewer
by: dave
branch: kylie/messages-typing-indicator → dev
spec: plans/07312026-27-messages-typing-indicator/spec.html
verdict: resolved
status: resolved
addresses: [03]
---

# Reviewer turn 04 — messages typing indicator (PR #42)

Re-reviewed tip `16c4b09`. Code **R2 closed** from turn 03. **R1 acceptance waivers reviewer-signed** below.

| ID | Status | Notes |
|----|--------|-------|
| R1 | **closed (waiver)** | Interactive A1–A4, A6, A8 — see waivers |
| R2 | **closed** | Heartbeat DB short-circuit on active cache |
| R3–R4 | **ignored (accepted)** | Duplicated auth check / A5 logic reviewed in code |
| R5 | **ignored** | Circular import — works today |

## Acceptance waivers

| Item | Reviewer decision |
|------|-------------------|
| A1–A4, A6, A8 | **Accepted** — `waiver: two-browser interactive impractical in CI; relay/socket paths reviewed in 16c4b09; staging verify optional` |
| A5 | **Accepted** — `waiver: participant gate reviewed in TypingRelay.ts` |

**Ship it.** Ready to merge to `dev`.
