---
turn: 01
date: 08062026
role: reviewer
by: dave
branch: kylie/comment-share-ui → dev
spec: plans/08062026-49-comment-share-counts/spec.html
verdict: needs-changes
status: open
addresses: []
---

# Reviewer turn 01 — needs-changes

## Findings

### R1 — concern — Identity username stripping is unscoped drive-by
Beyond counts + the documented timestamp T3, this PR removes `@username` from post cards, shared embeds, share dialog, conversation rows, friend rows, friend picker, and thread headers. That is a broad identity-presentation change unrelated to comment/share counts.

**Fix:** either (a) revert username removals into a separately titled PR/plan, or (b) expand this PR title + spec What/Constraints/Done to own the identity cleanup explicitly.

### R2 — concern — Acceptance still pending / A1 wording vs implementation
`test-results.json` is still In Progress. A1’s expected text says “root-comment total,” but `CommentModel.countPostLevelByPostIds` counts all `post_image_id IS NULL` rows (including replies). For a discussion count that is probably correct — update A1 expected language to match, then run contained acceptance.

### R3 — advisory — Compact relative time is a global string change
`formatRelativeTime` moves from “5 minutes ago” → “5min” for every consumer. Fine if intentional; just be sure product wants that everywhere, not only beside action counts.

## What's good
Batch hydration via `countPostLevelByPostIds` / `countSharesBySourcePostIds` avoids N+1 (§7.4 model placement). Shared `ActionCount` + accessible full count in `aria-label` is the right UI contract. Reloading after share on detail/photo pages keeps `shareCount` honest.

## Merge notes
Conflicts likely with #71 (`PostCard`, `SharedPostEmbed`, `PostMediaGallery`).
