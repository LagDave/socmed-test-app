---
turn: 01
date: 08062026
role: reviewer
by: dave
branch: kylie/simplify-identity-ui → dev
spec: plans/08072026-remove-visible-usernames/spec.html
verdict: ship-it
status: resolved
addresses: []
---

# Reviewer turn 01 — ship-it

PR #78 — simplify identity UI (`zarinakylie`). Display-only `@username` removal; identity routes/lookup preserved.

## Findings

### R1 — concern — Parallel 0.1.38 changelog/version with sibling PRs
#78–#81 each introduce a `0.1.38` CHANGELOG section (and most bump `package.json`). Landing all four needs a single combined version/changelog resolution — same batch pattern as #70–#76 → #77.

### R2 — advisory — Done checklist boxes still unchecked in HTML
Spec hero says Completed / acceptance Passed, but the Done `<ul class="check">` still renders ☐. Cosmetic; Revision Log + `test-results.json` are the source of truth.

### R3 — advisory — `plans/README.md` not indexed
New plan folder is not listed in `plans/README.md`. Optional housekeeping.

## Spec-code parity

| Requirement | Status |
|-------------|--------|
| Remove 13 display-only `@username` renderers | OK (12 FE files; residual `@${…username}` / `` `@${…}`` search clean) |
| Preserve `/u/:username`, search, open-conversation, APIs/types | OK (no backend/API/type edits) |
| No blank secondary lines / keep display names | OK (optional spans/paragraphs deleted wholesale) |
| Acceptance Passed | OK (`test-results.json` 6/6 pass, owner evidence) |

## What's good
Scoped to presentational deletions; ThreadViewContent correctly falls through to `null` when presence is absent instead of showing a handle; dormant `ConversationThreadHeader` cleaned so reuse cannot reintroduce handles.

## Verdict
**ship-it / approved for merge to `dev`.** Prefer landing with #79–#81 in a conflict-resolving batch (CommentItem + ThreadViewContent overlap with #79/#81).
