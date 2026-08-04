---
turn: 01
date: 08052026
role: reviewer
by: dave
branch: kylie/notification-sound → dev
spec: (none in PR — review trace only)
verdict: needs-changes
status: open
addresses: none
---

# Review — activity notification sounds (PR #61)

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/61

Auth scoping and playback/dedupe design look solid. Merge blocked on save gating and live badge decrements. **No plan folder shipped with this PR.**

## Findings

### R1 — Activity tone cannot be saved without a message sound
**Severity:** must-fix  
**Where:** `frontend/src/components/NotificationSoundsSettings.tsx`

Save early-returns / disables when `draftEnabled && !draftMessageSoundId`. Activity has its own picker + default (`beep`), but choosing only an activity tone cannot be persisted.

**Fix:** Allow save when activity is selected even if message is “None”; only require a message id when the user wants message sounds.

### R2 — Live badge count is write-only
**Severity:** must-fix  
**Where:** `NotificationRealtime` / mark-read / friend accept paths

`notifications:count` emits on create, but `markAllRead` and friend accept/decline never emit a refreshed count. Navbar listens to the socket and only refetches on pathname change → badge stays elevated after read/accept.

**Fix:** Emit `notifications:count` (or shared `countUpdated`) after mutations that change pending count.

### R3 — Shared single `HTMLAudioElement` for message + activity
**Severity:** concern  
**Where:** `playSoundUrl` / `getMessageAudio()`

DM + activity close together (or Save dual preview) cut each other off.

**Fix:** Separate elements or a tiny queue.

### R4 — Activity sounds default-on without explicit pick
**Severity:** concern  

Prefs default `enabled = true` and activity falls back to `beep`, while message sounds stay silent until an id is chosen. After first gesture unlock, users get activity audio with no opt-in.

**Fix:** Default activity to null/off until chosen, or match the message-sound contract.

### R5 — `/notifications` list stays stale while badge ticks
**Severity:** concern  

Page loads once; count events can raise the badge without refreshing the open list.

### R6 — Binary WAV payload (~+241 KB net)
**Severity:** advisory  

Acceptable given message-sound precedent; keep generator script.

### R7 — Growing dual-domain sound module / UI duplication
**Severity:** advisory · §13.1 / §4.3  

## What's good

- Clean extension of message-sound architecture (hook + dedupe + BroadcastChannel + suppress-when-viewing)
- Backend publish wrapped so realtime failure does not fail `notify`
- Session-authenticated sockets + `emitToUser(recipientId)` — correct scoping
- Changelog + generator script for reproducible assets

## Merge gate

Do not merge until **R1** and **R2** are addressed.

Also posted as **Changes requested** on the PR.
