---
turn: 01
date: 08062026
role: reviewer
by: dave
branch: kylie/activity-sound-settings → dev
spec: plans/08062026-activity-sound-settings-relocation/spec.html
verdict: ship-it
status: open
addresses: []
---

# Reviewer turn 01 — ship-it

## Findings

### R1 — advisory — Message/Activity settings components are near-duplicates
`MessageSoundSettings` and `ActivitySoundSettings` share nearly the same save/draft/toggle chrome. Acceptable for the split; a thin shared shell later would reduce drift (§4.3).

### R2 — advisory — `markRead` returns success when zero rows update
`NotificationService.markRead` is recipient-scoped and safe, but a missing/foreign id still yields `{ read: true }`. Optional hardening: 404 when `updated === 0` and the notification is not owned/already-read as intended.

## What's good
Independent message/activity enabled flags with legacy fallback, relocation to `/notifications/settings`, item-level `POST /notifications/:id/read`, pending-friend-request filtering for list/count, and whitelisted return-to-notifications navigation all match the evolved spec.

## Merge notes
Low overlap with feed/media PRs; watch notification route consumers if any external client still posts `/notifications/read`.
