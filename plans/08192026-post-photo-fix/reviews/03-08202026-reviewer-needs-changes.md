---
turn: 03
date: 08202026
role: reviewer
by: dave
branch: kylie/post-photo-fix → dev
spec: plans/08192026-post-photo-fix/spec.html
verdict: needs-changes
status: addressed-pending-review
addresses: [01, 02]
---

# Reviewer turn 03 — needs-changes

Follow-up after contributor fix-plan (`7bc9e70` / spec Rev 30–31).

## Prior findings

- **R1 — resolved.** Policies are in `@layer components`. Cover/comment previews size the stage. Chat uses `message-media-stage` / `message-media-image`.
- **R2 — resolved.** `ViewChatImageDialog` remains (now the #108 compact lightbox).
- **R3 — resolved.** Comment attach preview is a bounded thumbnail stage.
- **R4 — resolved.** Shared original media goes through `PostMediaGallery` without `user-media-stage`.

## New findings

### R5 — must-fix — Visual acceptance still open

T1–T5 in `test-results.json` are `pending`. Hero is **In Progress · Visual Acceptance Pending**. §20.5 / spec T6 block merge until those pass or are waived.

### R6 — concern — Comment thread used full-media `70dvh`

Posted comments used `.user-media-full`. A portrait could dominate the thread. Composer thumbs were already bounded.

### R7 — advisory — Release metadata drift vs #108 / #109

Changelog had 0.1.40/0.1.41 while `package.json` was 0.1.38/0.1.40.

## Verdict

**needs-changes.** R5 before merge. R6 should land in the same pass.
