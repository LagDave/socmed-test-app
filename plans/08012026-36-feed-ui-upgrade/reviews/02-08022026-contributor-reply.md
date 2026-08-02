---
turn: 02
date: 08022026
role: contributor
by: kylie
branch: kylie/feed-ui-upgrade → dev
spec: plans/08012026-36-feed-ui-upgrade/spec.html
verdict: reply
status: addressed-pending-review
addresses: [01]
---

# Contributor reply — PR #51 review (turn 01)

Responds to turn `01` (Dave, needs-changes). Execution in this commit; spec Rev 6 appended.

## Per finding

| ID | Response | Evidence |
|----|----------|----------|
| **R1** | `fix` | Spec Rev 6: What wire mock, Done when, Decision #4, Must not, T3, Done checklist, and blast radius updated for centered inset `PostMediaGallery` + multi-photo backend. `plans/README.md` seq 36 blurb updated. |
| **R2** | `fix` | `plans/08012026-36-feed-ui-upgrade/migrations/README.md` documents `20260801140000_post_image_urls.ts`, jsonb backfill, and deploy migrate requirement. |
| **R3** | `fix` | `FeedComposer`: `useEffect` resets `pickingPhotos` on `window` `focus`; file input `onCancel` fallback. |
| **R4** | `fix` | `PostModel.create` passes JS array directly to Knex jsonb. `resolvePostImageUrls` adds narrow JSON-string parse guard for legacy mis-serialized rows. |
| **R5** | `fix` | Replaced `Promise.all` with sequential uploads; error message names failing photo index (`Photo 3 of 5 upload failed: …`). Orphan files on partial failure remain a known limitation — no server-side upload rollback in scope. |
| **R6** | `ignore` | No vitest harness in repo yet; service/hydration tests deferred to follow-up PR. |
| **R7** | `ignore` | Blob URL unmount cleanup advisory — low impact on short-lived composer; follow-up if needed. |
| **R8** | `ignore` | Client/server MIME alignment advisory — out of scope for review turn. |

## Status

`addressed-pending-review` — must-fix R1–R3 and concern R4–R5 landed; awaiting reviewer confirm.
