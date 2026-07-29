---
turn: 02
date: 07302026
role: contributor
by: kylie
branch: Kylie/revamp-messages-feature → dev
spec: plans/07292026-22-messages-websockets/spec.html
verdict: reply
status: closed-superseded
addresses: [01]
---

# Contributor turn 02 — PR #25 / plan 22

## Summary
PR #25 is being **closed in favor of #26** (`kylie/messages-friend-picker`), which
is a descendant of this branch and carries the same Socket.IO surface plus the
friend picker. R1 is fixed properly on #26 by another agent. To avoid leaving
this branch's tip broken if anyone merges #25 by mistake before it's closed, the
same R1 fix (plus the low-cost R5 fix) is applied here too, in commit `d1a1ccf`.

## Findings

### R1 — must-fix — Sender duplicate messages
- **fix** — Applied on this branch in commit `d1a1ccf`:
  `onSend`/`onImage` now call `setMessages((prev) => mergeById(prev, [data.message]))`
  instead of `[...prev, data.message]`, matching the socket path's merge-by-id
  behavior in `frontend/src/pages/MessagesPage.tsx`.
- Typecheck (`npm run typecheck`, root + frontend) passes clean on this commit.
- This is redundant with the real fix landing on #26 — kept here only so the
  branch tip isn't left broken for archaeology/accidental-merge purposes. The
  fix that actually ships is on #26.

### R2 — concern — Interactive acceptance waived (A1–A7)
- **acknowledge** — Not re-running or faking A2/A5/A6 on this superseded branch.
  Interactive smoke stays the responsibility of whoever finalizes #26, where the
  same waived items apply against the combined websockets + friend-picker
  surface.

### R3 — concern — Stacking with PR #26
- **fix (process decision)** — Per Dave: **close #25; ship websockets through
  #26.** #26 already contains this branch's full commit history plus the friend
  picker, so merging #25 first would add nothing and creates a second
  integration point to keep in sync. PR #25 is being closed with a comment
  pointing to #26; see close action below.

### R4 — concern — Caddy / WSS deploy gate
- **acknowledge** — Deploy follow-up, not a code-land blocker. A7 stays waived.
  Applies equally to whichever PR ships (#26).

### R5 — advisory — No-op generation guard on socket handler
- **fix** — Applied in the same commit `d1a1ccf`. The socket `useEffect` now
  snapshots `generation = generationRef.current` at effect entry instead of
  `const generation = () => generationRef.current`, so the staleness check in
  `applyMessage` (`if (generation !== generationRef.current) return;`) can
  actually trip on a superseded effect instance.

### R6 — advisory — Inbox reload storm
- **ignore (defer)** — Real behavioral coupling, but not a correctness bug and
  out of scope for a branch being closed. Carried forward as a known follow-up
  for whoever owns the inbox reload logic post-#26.

### R7 — advisory — Realtime module reads models
- **ignore (defer)** — Agreed with the §7.1-spirit note; not fixing on a branch
  being closed. Should be revisited on #26 or a follow-up plan if it lands
  there unchanged.

### R8 — advisory — Session revoke vs long-lived socket
- **ignore (accepted for v1)** — No action needed per reviewer's own note.

## Close action
Closing #25 in favor of #26 after this reply and the R1/R5 fix are pushed.
Close comment: "Superseded by #26 (same Socket.IO work + friend picker). R1
duplicate-send fixed on #26; this branch also has the mergeById fix if needed
for archaeology."

## Status
closed-superseded — reviewer does not need to re-review #25; land/merge
decisions continue on #26.
