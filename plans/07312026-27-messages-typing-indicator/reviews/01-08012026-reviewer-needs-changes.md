---
turn: 01
date: 08012026
role: reviewer
by: dave
branch: kylie/messages-typing-indicator → dev
spec: plans/07312026-27-messages-typing-indicator/spec.html
verdict: needs-changes
status: open
addresses: []
---

# PR #42 review — messages typing indicator

Reviewed `kylie/messages-typing-indicator` → `dev` against `plans/07312026-27-messages-typing-indicator/spec.html` and the Code Constitution.

**Summary:** Architecture and spec alignment are largely solid — ephemeral `TypingRelay`, debounced client emit, `TypingIndicator` UI, thread + inbox wiring, and event constants all match the locked decisions. Typecheck passes on the branch tip (`c45ba20`). Merge is blocked on acceptance verification and two server-side gaps called out below.

## Spec–code parity

| Area | Status |
|------|--------|
| Socket events `typing:start` / `typing:stop` / `typing:update` | Match |
| Server TTL ~3s, client debounce 300ms + 2s heartbeat | Match |
| Participant gate before relay | Match (logic duplicated — see R3) |
| `TypingIndicator` + `useTypingIndicator` extraction | Match |
| Thread placement above composer | Match |
| Inbox row snippet override | Match |
| No migrations / no new deps | Match |
| Acceptance rollup `Passed` | **Drift** — interactive items waived as “deferred to PR” without evidence (R1) |
| Server spam mitigation “ignore duplicate starts within TTL” | **Partial** — relay deduped, DB lookup not (R2) |

## Findings

### R1 — must-fix · §20.5 (Section 20, Article 5: Every executed plan ships a passing acceptance artifact)

**Rule:** "Every plan executed via `-x`/`-i` produces a `test.html` + `test-results.json` acceptance checklist … and `-d` cannot finalize until it passes or each failure is waived with a reason."

**Where:** `plans/07312026-27-messages-typing-indicator/test-results.json` — items A1, A2, A3, A4, A6, A8

**Issue:** Items are marked `pass` with waivers stating interactive two-browser verification was “deferred to PR/staging,” but no evidence was recorded. Rev 2 explicitly parked verification on this PR review; that work is still outstanding.

**Fix:** Run A1–A4, A6, and A8 on staging or localhost (two browsers, two mutual friends, connected sockets). Update `test-results.json` with dated evidence in the `evidence` field, or fail items with written waivers only for genuinely untestable cases. Rollup must reflect actual results before merge.

---

### R2 — must-fix · §2.1 (Section 2, Article 1: One responsibility per file) + spec Decision 6 mitigation

**Rule:** "A file does one thing." (Applied here to handler efficiency: work done per event should match the event's purpose.)

**Where:** `src/realtime/TypingRelay.ts:60–79` — `handleTypingStart`

**Issue:** Every client heartbeat (`typing:start` every ~2s while composing) calls `ConversationModel.findById` even when `wasActive` is true and the TTL entry already proves a prior participant check. Spec Decision 6 / Risk table mitigation says server should "ignore duplicate starts within TTL window" to limit chatter — relay is deduped, but DB load is not (~30 queries/min per active typer).

**Fix:** Short-circuit when `expiryTimers.has(key)`: refresh the TTL timer only, skip `findById`. Alternatively cache `{ peerId, validatedAt }` in the in-memory map keyed by `conversationId:userId`. Reserve `findById` for the first start in a burst and for explicit `typing:stop`.

---

### R3 — concern · §4.3 (Section 4, Article 3: DRY carefully)

**Rule:** "Deduplicate only genuinely-identical concepts."

**Where:** `src/realtime/TypingRelay.ts:25–37` vs `src/services/MessageService.ts:84–97`

**Issue:** Spec Context says "reuse `assertParticipant` + `peerId` helpers (reuse logic, don't duplicate authz rules)." `TypingRelay` reimplements `peerId` and `isParticipant` inline. If participant rules ever change (e.g. blocked users), typing authz can drift from REST.

**Fix:** Extract shared participant helpers to a small module (e.g. `src/services/messageConversationUtils.ts`) used by both `MessageService` and `TypingRelay`, or export tested helpers from the service layer.

---

### R4 — concern · §20.2 (Section 20, Article 2: Cover the contract, the failures, and the tenant scope)

**Rule:** "Tests cover the `{ success, data, error }` contract, the error/throw paths (not only the happy path), and — for tenant-scoped data — that one tenant cannot read another's rows."

**Where:** `src/realtime/TypingRelay.ts` (no test file); acceptance A5 waived as "logic reviewed"

**Issue:** First client→server socket handlers with a privacy-sensitive participant gate. No automated proof that a non-participant's `typing:start` is ignored and no `typing:update` is relayed (A5).

**Fix:** Add a focused unit/integration test for `handleTypingStart`/`handleTypingStop` covering participant, non-participant, and peer-only relay. Minimum bar: A5 executed manually with evidence if the repo still lacks a vitest harness.

---

### R5 — advisory · observation

**Where:** `src/realtime/io.ts` ↔ `src/realtime/TypingRelay.ts`

**Issue:** Circular import (`io` imports `attachTypingHandlers`, `TypingRelay` imports `emitToUser`). Typecheck passes today; pattern is fragile if module init order changes.

**Fix:** Consider moving `emitToUser` / room helpers to `src/realtime/rooms.ts` to break the cycle (optional follow-up).

---

### R6 — advisory · §12.3 (Section 12, Article 3: Feature folders, not flat dumps)

**Where:** `frontend/src/components/TypingIndicator.tsx`

**Issue:** Messages feature components (`ConversationListRow`, etc.) live flat under `components/` — consistent with existing messenger files, not a regression.

**Fix:** None required for this PR; consider a `components/Messages/` folder in a future cleanup.

## Observations

- Client hooks correctly gate emit on `socketConnected`, filter self `userId`, and clear on `message:new` — matches spec Done criteria.
- `TypingIndicator` uses `aria-live="polite"` and disables dot animation under `prefers-reduced-motion` — good accessibility follow-through.
- Server silently ignores malformed payloads with debug logging — matches event contract.
- No schema migration; changelog and version bump align with plan finalization.

## Verdict

**needs-changes** — ship after R1 (acceptance evidence) and R2 (heartbeat DB short-circuit). Address R3–R4 before or immediately after merge; R5–R6 optional.
