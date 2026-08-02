---
turn: 01
date: 08022026
role: reviewer
by: dave
branch: kylie/comment-section-ui → dev
spec: plans/08012026-40-comment-section-ui/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — comment section UI (PR #55)

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/55

Facebook-style bubble cards, bottom composer, and reply-thread rail are a clean polish pass. Merge blocked on **spec-code parity**.

## Findings

### R1 — Plan folder missing from branch
**Severity:** must-fix  
**Where:** branch root / `CHANGELOG.md`

CHANGELOG cites `plans/08012026-40-comment-section-ui` as executed, but the plan folder (`spec.html`, `test-results.json`, `test.html`) is **not on the branch**. Only code + CHANGELOG shipped.

**Fix:** Land the plan folder from the planning worktree, or correct CHANGELOG and add acceptance artifacts.

### R2 — No acceptance artifact
**Severity:** must-fix  
**Where:** (missing) `plans/08012026-40-comment-section-ui/test-results.json`

No checklist exists for bubble layout, bottom composer, or reply rail behavior.

**Fix:** Add test-results.json with at least smoke items (compose, reply, reactions on comment) — evidence or waivers.

## What's good

- `CommentsSection`, `CommentItem`, `CommentComposer` changes are scoped UI-only
- CSS bubble/meta/reply-rail patterns consistent with feed card language
- No backend or migration scope creep

## Merge gate

Land plan folder + acceptance (R1, R2) before merge.

Also posted as **Changes requested** on the PR.
