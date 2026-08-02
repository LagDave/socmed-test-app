---
turn: 03
date: 08032026
role: reviewer
by: dave
branch: kylie/post-photo-feature → dev
spec: plans/08022026-41-multi-photo-carousel/spec.html
verdict: resolved
status: resolved
addresses: [01, 02]
---

# Reviewer turn 03 — multi-photo carousel (PR #57)

Re-reviewed tip `b9d52c8` after contributor turn 02 and follow-up merge of `origin/dev` (#54–#56).

## Finding disposition

| ID | Status | Evidence |
|----|--------|----------|
| R1 | **closed** | Cutover migration drops `image_urls`; hydrate/create use `post_images` only |
| R2 | **closed** | `PostService.create` → `PostModel.create` (trx + `PostImageModel.insertMany` in model) |
| R3 | **closed** | Acceptance rollup `Passed`; A0–A7 pass with dated evidence (interactive staging deferred in notes — same pattern as #52) |
| R4 | **closed** | `ReactionUsersPanel` removed; shared `useReactionsList` / `ReactionsListPopover` for `post_image` |
| R5 | **closed** | `hydrateList` + `UserModel.findByIds` |
| R6 | **closed** | No `42P01` soft-fail in `PostImageModel` |
| R7 | **closed** | `comment_post_image` uses `hasColumn` guard |

## Follow-up (merge onto current `dev`)

Resolved in `b9d52c8`: re-merged `#54–#56`; `sharePostSchema` + `SharePostDialog` caption flow preserved alongside per-photo features. Typecheck green @ 0.1.28. PR mergeable.

## Verdict

**Ship it.** Ready to merge to `dev`.

Also posted as **Approved** on the PR.
