---
turn: 01
date: 08012026
role: reviewer
by: dave
branch: kylie/message-notification-features → dev
spec: plans/08012026-34-message-notification-sounds/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — message notification sounds (PR #49)

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/49

Solid foundation: localStorage prefs, 14 WAV assets, settings UI with preview/save, autoplay unlock, cross-tab dedupe, and a global `message:new` listener wired from `AppShell`. Merge is blocked on spec-code parity — the open-thread suppress rule from T3 is missing, acceptance artifacts overstate pass status, and changelog/PR copy contradict the spec.

## Findings

### R1 — Open-thread suppress rule not implemented
**Severity:** must-fix  
**Where:** `frontend/src/lib/notificationSounds.ts` (bridge `fn`), `frontend/src/hooks/useMessageNotificationSound.ts`  
**Spec:** T3 — on `message:new`, skip playback when current route is `/messages/{conversationId}` for that message's conversation.

Implementation only skips `senderId === self`. `MessageView.conversationId` is available on the payload; `AppShell` already has `useLocation()`. No route/context check exists.

**Fix:** Extend `MessageSoundContext` with `getOpenConversationId()` (or pathname) from the hook; in the bridge handler, return early when `msg.conversationId` matches the open thread. Align hook comment, settings copy ("in any part of the app"), CHANGELOG, and PR description with spec once fixed.

### R2 — Acceptance artifact claims Passed while UI items are fail
**Severity:** must-fix  
**Where:** `plans/08012026-34-message-notification-sounds/test-results.json`

Top-level `"status": "Passed"` but A1–A5 are all `"status": "fail"` with waivers. A2 notes reference `isViewingConversation()` which does not exist in code. AGENTS.md acceptance gate requires Passed only when items pass or carry written waivers at item level — rollup must not read Passed when behavioral items are unresolved.

**Fix:** Set rollup to pending/fail until A1–A5 are run and recorded pass (or explicit waivers with evidence). Update A2 notes to match actual function names after R1 fix.

### R3 — CHANGELOG contradicts spec suppress behavior
**Severity:** must-fix  
**Where:** `CHANGELOG.md` (0.1.18)

Entry says inbound sound plays "including open thread" — opposite of spec suppress rule and acceptance A2.

**Fix:** Correct changelog after R1 is implemented (or now if intentionally deferring R1 — but R1 is must-fix).

### R4 — Effect cleanup leaves socket listener registered on unmount
**Severity:** concern  
**Where:** `frontend/src/hooks/useMessageNotificationSound.ts`

Logged-out path calls `teardownMessageNotificationSoundListener()`, but the effect cleanup for signed-in sessions only removes `connect` / unlock listeners — not `MESSAGE_NEW`. If `AppShell` ever unmounts while authenticated, the global listener persists.

**Fix:** Call `teardownMessageNotificationSoundListener()` in the effect cleanup return.

### R5 — Activity sound kind is dead code / unused asset
**Severity:** concern  
**Where:** `frontend/src/lib/notificationSounds.ts`, `frontend/public/sounds/activity.wav`

`SoundKind`, `ACTIVITY_SOUND_URL`, and `playNotificationSound('activity')` are defined but nothing invokes activity playback. Spec Q3 scoped distinct sound kinds; v1 message-only is fine, but shipping an unused asset + API surface adds noise.

**Fix:** Drop activity asset/exports for v1 **or** wire activity playback where spec intended (out of scope note in spec allows deferral — then remove dead exports/asset until needed).

### R6 — `warmActiveMessageSound()` is a no-op export
**Severity:** advisory  
**Where:** `frontend/src/lib/notificationSounds.ts:355`

Exported stub with no callers. Remove or implement (e.g. preload selected WAV after save).

### R7 — Enabled-by-default with no default sound selection
**Severity:** advisory  
**Where:** `notificationSounds.ts` prefs, `NotificationSoundsSettings.tsx`

`enabled` defaults `true` but `messageSoundId` defaults `null`, so new users see "On" but hear nothing until they pick and save a tone. Acceptable if intentional; consider defaulting to `chime` (first Classic option) so "on" means audible on first DM.

## What's good

- Preferences isolated in `notificationSounds.ts` with storage sync + custom event for cross-component updates
- Autoplay unlock on login/register submit + first pointer/keydown is the right pattern
- Cross-tab dedupe via `BroadcastChannel` + 3s message-id window is thoughtful
- Settings UI: grouped sounds, preview-on-select, unsaved-changes guard, accessible switch
- Frontend-only scope respected; typecheck/build pass (A6/A7)
- No PWA/service-worker scope creep — in-tab audio only, as spec intended

## Merge gate

1. **R1** — implement open-thread suppress; verify A2.
2. **R2 + R3** — fix acceptance rollup and changelog/spec-code parity.
3. **R4** — teardown in effect cleanup (quick, do with R1).
4. **R5/R6** — remove dead activity/no-op code or document deferral in spec Revision Log.
5. Re-run A1–A5 (two-browser) before merge; do not mark plan Completed until acceptance rollup is honest.

Also posted as **Changes requested** on the PR.
