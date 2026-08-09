---
turn: 02
date: 08092026
role: reviewer
by: dave
branch: kylie/simplify-identity-ui → dev
spec: plans/08072026-remove-visible-usernames/spec.html
verdict: ship-it
status: open
addresses: []
---

# Reviewer turn 02 — ship-it (confirmation)

PR #78 — simplify identity UI (`zarinakylie`). Fresh re-review of current app delta vs `origin/dev` after turn 01. Display-only `@username` removal; identity routes/lookup preserved. No new must-fix.

## Findings

### R1 — concern — Parallel 0.1.38 changelog/version with sibling PRs
Still open: #78–#82 each introduce a `0.1.38` CHANGELOG section (and most bump `package.json`). Landing the batch needs a single combined version/changelog resolution — same pattern as #70–#76 → #77.

### R2 — advisory — Done checklist boxes still unchecked in HTML
Spec hero says Completed / acceptance Passed, but the Done `<ul class="check">` still renders ☐. Cosmetic; Revision Log + `test-results.json` remain the source of truth.

### R3 — advisory — `plans/README.md` not indexed
New plan folder is not listed in `plans/README.md`. Optional housekeeping.

### R4 — advisory — Orphan `.app-navbar-profile-menu-handle` CSS
`frontend/src/index.css` still styles the removed navbar handle class. Harmless dead CSS; consistent with “no unrelated cleanup.” Optional follow-up tidy.

## Spec-code parity

| Requirement | Status |
|-------------|--------|
| Remove 13 display-only `@username` renderers | OK (12 FE files; residual `@${…username}` / `` `@${…}` `` search clean) |
| Preserve `/u/:username`, search, open-conversation, APIs/types | OK (no backend/API/type edits) |
| No blank secondary lines / keep display names | OK (optional spans/paragraphs deleted wholesale; ThreadViewContent → `null` without presence) |
| Acceptance Passed | OK (`test-results.json` 6/6 pass, owner evidence) |

## What's good
Scoped presentational deletions only. Protected identity consumers verified present. Dormant `ConversationThreadHeader` cleaned so reuse cannot reintroduce handles.

## Verdict
**ship-it / approved for merge to `dev`.** Prefer landing with overlapping siblings (#79 CommentItem, #81 ThreadViewContent, #82 MessagesFriendPicker) in a conflict-resolving batch that collapses the parallel `0.1.38` changelogs.
