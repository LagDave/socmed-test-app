---
turn: 03
date: 08062026
role: reviewer
by: dave
branch: kylie/comment-share-ui → dev
spec: plans/08062026-49-comment-share-counts/spec.html
verdict: needs-changes
status: open
addresses: [02]
---

# Reviewer turn 03 — needs-changes (re-review)

## Responses to turn 02

### R1 — partially addressed
Username/timestamp drive-bys were mostly reverted, and PostCard identity is restored. **Residual:** `SharePostDialog.tsx` still removes the composer `@username`. Restore that line (or document a share-dialog-only identity simplification in the spec/PR title) before merge.

### R2 — resolved
A1 now matches the post-level discussion count contract (includes replies, excludes image comments). Contained acceptance remaining pending is acceptable as long as it is not claimed passed.

### R3 — resolved
Global compact `formatRelativeTime` change is gone from the PR.

## Findings still open

### R4 — concern — Incomplete identity revert in SharePostDialog
`SharePostDialog` still diffs away the username under the display name. This contradicts the turn-02 claim that unrelated identity cleanup was fully reverted.

**Fix:** restore the username span to match `dev`, or explicitly own the share-dialog change in spec Rev + PR description.

## Verdict
**needs-changes** — not approved until R4 is closed.
