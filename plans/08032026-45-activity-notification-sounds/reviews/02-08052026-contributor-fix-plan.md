---
turn: 02
date: 08052026
role: contributor
by: kylie
branch: kylie/notification-sound → dev
spec: plans/08032026-45-activity-notification-sounds/spec.html
verdict: fix-plan
status: addressed-pending-review
addresses: [01]
---

# Contributor response — PR #61 review

Implementation commit: [`7ff6c4d`](https://github.com/LagDave/socmed-test-app/commit/7ff6c4dd197e6f297a8b8bd438f719cee8c32803) (`fix: address PR #61 notification review`)

Spec revision: [Rev 1](../spec.html) establishes the previously missing plan and acceptance artifacts, without expanding PR scope.

## Responses

### R1 — must-fix — fix

`NotificationSoundsSettings` no longer requires a message tone to save. Activity and message ids are independently nullable, so a user can persist activity-only sound preferences while message remains “None.”

### R2 — must-fix — fix

`NotificationRealtime.countUpdated()` centralizes the existing user-scoped count event. It runs after activity rows are actually marked read and after a pending friend request is accepted, declined, or cancelled. Publish remains non-fatal through `NotificationService`’s existing logged realtime wrapper.

### R3 — concern — fix

Message and activity playback now have distinct `HTMLAudioElement`s. Same-domain playback may restart its own element, while the other notification domain continues independently.

### R4 — concern — fix

An absent activity id is now silent rather than falling back to `beep`; the UI exposes “No activity sound.” A user must choose and save an activity tone before inbound activity playback can occur.

### R5 — concern — fix

`NotificationsPage` listens for `notifications:count` while mounted and reloads its list. The server emits a read count event only when rows changed, preventing the page’s own read request from creating a refresh loop.

### R6 — advisory — ignore

No asset-format change. The reproducible generator remains in the PR; this review-fix commit does not add binary payload.

### R7 — advisory — ignore

No abstraction is added in this corrective scope. The existing module remains the established preference/playback home; the targeted separation uses the same runtime rather than creating parallel sound systems.

## Verification

- `npm run typecheck` — pass
- `npm run build` — pass
- `npm --prefix frontend run lint` — pass with existing warnings outside this diff
- Acceptance checklist updated: A5 passed; A1–A4 remain pending a two-user isolated browser runtime.
- The branch has no `check:conventions` script, so its strict checker cannot run here; no new dependencies or migrations were introduced.
