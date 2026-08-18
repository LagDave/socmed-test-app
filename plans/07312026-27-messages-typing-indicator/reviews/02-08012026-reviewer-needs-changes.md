---
turn: 02
date: 08012026
role: reviewer
by: dave
branch: kylie/messages-typing-indicator → dev
spec: plans/07312026-27-messages-typing-indicator/spec.html
verdict: needs-changes
status: open
addresses: [01]
---

# PR #42 re-review — messages typing indicator (branch restored)

Re-reviewed `kylie/messages-typing-indicator` → `dev` at `fa1def3` after branch repair (Rev 3). Confirmed diff is **typing-indicator only** — no timeline/message-reaction code from PR #41. Three commits: feature (`c45ba20`), turn-01 trace (`1ec44b4`), branch-repair docs (`fa1def3`).

**Summary:** Scope and architecture remain sound; typecheck passes on tip. Turn-01 must-fix items **R1** (acceptance evidence) and **R2** (heartbeat DB short-circuit) are **still open**. No code changes address R2–R6 since turn 01. Merge remains blocked on R1 + R2.

## Branch scope confirmation

| Check | Result |
|-------|--------|
| Files in diff vs `dev` | 16 files, all typing-indicator / plan artifacts |
| Reaction/timeline files in diff | **None** |
| `src/realtime/TypingRelay.ts` | Present — typing relay only |
| `MessageReaction` / reaction routes in diff | **Absent** |

Branch corruption resolved; PR scope matches Plan 27.

## Turn-01 finding status

| ID | Severity | Status | Notes |
|----|----------|--------|-------|
| R1 | must-fix | **open** | `test-results.json` unchanged — A1, A2, A3, A4, A6, A8 still `pass` with empty `evidence` and “deferred to PR” waivers |
| R2 | must-fix | **open** | `handleTypingStart` still calls `ConversationModel.findById` before `wasActive` check on every heartbeat |
| R3 | concern | **open** | `peerId` / `isParticipant` still duplicated vs `MessageService` |
| R4 | concern | **open** | No automated or manual evidence for A5 non-participant gate |
| R5 | advisory | **open** | Circular import `io.ts` ↔ `TypingRelay.ts` unchanged |
| R6 | advisory | **ignored** | Flat `components/` layout — consistent with messenger; no action this PR |

## Spec–code parity (unchanged from turn 01)

| Area | Status |
|------|--------|
| Socket events `typing:start` / `typing:stop` / `typing:update` | Match |
| Server TTL ~3s, client debounce 300ms + 2s heartbeat | Match |
| Participant gate before relay | Match (logic duplicated — R3) |
| `TypingIndicator` + `useTypingIndicator` | Match |
| Thread above composer + inbox snippet override | Match |
| No migrations / no new deps | Match |
| Acceptance rollup `Passed` | **Drift** — R1 |
| Server “ignore duplicate starts within TTL” mitigation | **Partial** — relay deduped, DB not — R2 |

## Findings (carried forward)

### R1 — must-fix · §20.5 — acceptance evidence still missing

**Where:** `plans/07312026-27-messages-typing-indicator/test-results.json` — A1, A2, A3, A4, A6, A8

**Issue:** Turn 01 parked interactive verification on this re-review. No contributor commit since turn 01 adds dated evidence. Waivers alone do not satisfy `-d` / merge gate.

**Fix:** Run two-browser checklist on localhost or staging; populate `evidence` fields with date + outcome. Re-run rollup.

---

### R2 — must-fix · spec Decision 6 — heartbeat still hits DB

**Where:** `src/realtime/TypingRelay.ts:60–79`

**Issue:** Unchanged. Each client heartbeat (~2s) triggers `findById` even when `expiryTimers.has(key)` would prove prior validation.

**Fix:** Short-circuit active keys: refresh TTL timer only, skip DB. Cache `peerId` in the timer map entry on first validation.

---

### R3 — concern · §4.3 — participant helpers duplicated

**Where:** `TypingRelay.ts:25–37` vs `MessageService.ts:84–97`

**Fix:** Extract shared helpers; defer to follow-up if R1+R2 land first, but do not let this drift long.

---

### R4 — concern · §20.2 — no proof for A5

**Fix:** Unit/integration test or manual socket harness with recorded evidence.

---

### R5 — advisory — circular import

**Fix:** Optional `rooms.ts` extraction in follow-up.

## New observations (turn 02)

- **N1 (info):** Rev 3 / `fa1def3` correctly documents branch repair; no functional regression from corruption episode.
- **N2 (info):** Typecheck green on `fa1def3` — A7 holds.
- No new must-fix issues beyond R1–R2.

## Verdict

**needs-changes** — same blockers as turn 01. Ship after R1 (acceptance evidence) and R2 (heartbeat DB short-circuit). R3–R4 recommended before or immediately after merge; R5 optional.
