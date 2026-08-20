---
turn: 01
date: 08202026
role: reviewer
by: dave
branch: kylie/post-photo-fix → dev
spec: plans/08192026-post-photo-fix/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Reviewer turn 01 — needs-changes

**PR:** https://github.com/LagDave/socmed-test-app/pull/104  
**Base:** `origin/dev` · **Head:** `kylie/post-photo-fix`

## Findings

### R1 — must-fix — Unlayered `.user-media-full` / `.user-media-thumbnail` override size caps

**Where:** `frontend/src/index.css` (`.user-media-full`, `.user-media-thumbnail`); `frontend/src/components/MessageBubbleRow.tsx` (`user-media-full max-w-[220px]`); `frontend/src/components/PhotoUpdateDialog.tsx` (`.user-media-thumbnail h-44 sm:h-52`)

**Rule:** §4.3 — *Deduplicate only genuinely-identical concepts. Coincidental similarity across domains is not duplication; premature abstraction is worse than repetition.*

The policies sit in unlayered CSS after `@import "tailwindcss"`, so they beat Tailwind utilities. Chat images keep `max-w-[220px]` in JSX but computed `max-width` becomes `100%` and `max-height` becomes `70dvh` (the old `max-h-48` was also removed). Cover-update preview keeps `h-44 sm:h-52` on an unsized `.user-media-stage`, but `height: 100%; max-height: 100%` wins and the banner footprint collapses to intrinsic image height. Same-origin as `origin/dev`’s `max-w-[220px] max-h-48` chat cap — this is a layout regression, not a crop fix.

**Fix:** Put the policies in `@layer components` (or equivalent) so utilities can override; size the **stage** (`h-44 w-full`, `h-8 w-8`, …) not the img; give chat media its own named max (`220px` / rail), not the post `70dvh` full-media class.

### R2 — concern — Chat lightbox deleted; Messenger-dark backdrop lost

**Where:** `frontend/src/components/ViewImageDialog.tsx`; `frontend/src/index.css` (`.dark .image-viewer-backdrop`); deleted `ViewChatImageDialog.tsx`

Chat used in-tree `ViewChatImageDialog`. This PR deletes that file and portals one post-tuned viewer to `document.body`. Backdrop black-blur is `.dark .image-viewer-backdrop` only — Messenger-dark + app-light gets the light overlay, and chat CSS variables no longer apply. `origin/dev` still has independent Messenger theme until #99 lands.

**Fix:** Keep a chat-local viewer (or portal into `.messages-theme-surface`) and key the dark backdrop to `html.messages-theme-dark` as well as `.dark`. Do not delete `ViewChatImageDialog` until that path is preserved — or rebase onto #99 and keep a scoped chat-safe backdrop.

### R3 — concern — Comment attach preview uses full-media, not thumbnail

**Where:** `frontend/src/components/CommentComposer.tsx`

Pre-submit comment preview dropped `max-h-44` and uses `.user-media-full` (viewport `70dvh` cap) instead of the thumbnail policy `FeedComposer` uses. Spec T3 called these thumbnails; a portrait attach can dominate the composer.

**Fix:** Bounded `.user-media-stage` + `.user-media-thumbnail`, same as the post-composer strip.

### R4 — advisory — Shared original media gets an extra stage panel

**Where:** `frontend/src/components/SharedPostEmbed.tsx`

Shared original media is wrapped in `post-media-stage user-media-stage`, which paints the muted stage behind feed/album photos. Spec Rev 5 / T2: full post / shared media should not sit in an extra panel.

**Fix:** Drop `user-media-stage` from the shared original wrapper; leave `post-media-stage` for width.

## Observations

- No `dangerouslySetInnerHTML`, no component `fetch`/`axios`, no `: any`.
- Compact four-tile `object-cover` + profile circular crop remain the documented exceptions.
- Feed click → album, album click → viewer, profile header close-up match later Revs.
- GUI items marked pass with local user evidence — not blocking.

## Spec-code parity

Intent (no-crop full media, carousel exception, album-then-viewer, profile close-up) is implemented. Drift: T1 says CSS must not crop-to-fill while the compact grid is `object-cover`; T3 says comment thumbnails while the composer uses full-media (R3); `test-results.json` top-level status is still `In Progress` while every item is `pass`.

## Batch-land

**Held out of the 0.1.40 squash** with #99–#103, #105, #106. This PR deletes `ViewChatImageDialog.tsx` that #102 restyles, restyles comment files that #103 rewrites, and shares `ThreadViewContent.tsx` / `index.css` with #101/#106.

## Verdict

**needs-changes** — R1 must land before merge into `dev`.
