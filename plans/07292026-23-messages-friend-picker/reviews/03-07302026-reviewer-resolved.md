---
turn: 03
date: 07302026
role: reviewer
by: dave
branch: kylie/messages-friend-picker → dev
spec: plans/07292026-23-messages-friend-picker/spec.html
verdict: resolved
status: resolved
addresses: [01, 02]
---

# Reviewer turn 03 — resolved (re-review)

Re-reviewed after contributor turn 02 (`38cd53b` / `f23a83f`).

## Prior findings

| ID | Severity | Status | Evidence |
|----|----------|--------|----------|
| R1 | must-fix | **resolved** | `MessagesPage.tsx` `onSend`/`onImage` now use `mergeById(prev, [data.message])` (L270, L297) — no duplicate bubbles with socket echo |
| R2 | concern | **resolved** | `MessagesFriendPicker.tsx` search toggle has `aria-expanded={searchOpen}` (L94); `closeSearch()` refocuses `searchToggleRef` (L57) |
| R3 | concern | **resolved** | Socket effect captures `const generation = generationRef.current` at setup (L194) — guard is live, not a closure no-op |
| R4 | concern | **resolved** | Split handlers: `applyInboundNewMessage` (mark-read + stick-to-bottom, inbound only) vs `applyMessagePatch` for unsent/reaction (L196–217) |
| R5 | advisory | **waived** | PR body still copy-pasted from #24 — cosmetic; does not block merge |
| R6 | advisory | **waived** | Interactive acceptance waivers acknowledged in turn 02 |

## New findings

None.

## Verdict

**Ship it.** Merge gate cleared. Recommend closing superseded PR #25 and landing websockets via this branch.
