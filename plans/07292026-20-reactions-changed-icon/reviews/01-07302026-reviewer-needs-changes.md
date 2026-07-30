---
turn: 01
date: 07302026
role: reviewer
by: dave
branch: kylie/reactions-changed-icon → dev
spec: plans/07292026-20-reactions-changed-icon/spec.html
verdict: needs-changes
status: open
addresses: []
---

# Review — reactions changed icon + summary layout (PR #19)

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/19  
**Primary plans:** `plans/07292026-20-reactions-changed-icon`, `plans/07292026-24-reaction-summary-layout`  
**Also stacked on tip:** 17 messenger, 18 comment-action-icons

Delta for stickers + right-aligned cluster is directionally right. Merge is blocked: tip is behind `dev`, CONFLICTING, and still carries pre-fix messenger.

## Findings

### R1 — Tip behind `dev`; messenger regression risk
**Severity:** must-fix  
**Where:** `frontend/src/pages/MessagesPage.tsx`, `src/services/MessageService.ts`; conflicts in `PostActionRow.tsx`, `PostDetailPage.tsx`, changelog, package manifests, `plans/README.md`

Merge-base `c653cb6` predates review fix `16cca59`. Tip lacks thread-switch generation gating, `hasMore` pagination, batched inbox, and unique-violation handling already on `dev`. Naive merge risks regressing PR #16 resolutions.

**Fix:** Rebase onto current `dev`; preserve messenger fixes; re-apply only plan 20+24 files/behavior.

### R2 — Spec 20 Constraints vs settled Unicode stickers
**Severity:** concern  
**Where:** `plans/07292026-20-reactions-changed-icon/spec.html`

Must still requires Lucide / filled / per-type colors; Must Not bans sticker emoji. Decisions + Rev 5–6 + code settled on 👍❤️😂😮 via `ReactionIcon`.

**Fix:** Append a Revision Log entry rewriting Constraints/What to the settled visual (do not renumber prior revs).

### R3 — PR too large / re-stacks landed work
**Severity:** concern  
**Where:** PR #19 scope (plans 17+18+20+24)

Messenger and comment-action-icons already landed on `dev` via feature-batch. This PR re-carries them and collides on `PostActionRow` / `PostDetailPage`.

**Fix:** Restack as plan 20+24-only on `dev`.

### R4 — Dead `filled` prop; silent Messages catch
**Severity:** advisory  
**Where:** `ReactionIcon.tsx`; `MessagesPage.tsx` `MessageReactions`

Unused `filled?: boolean`. Bare `catch` keeps prior summary with no signal.

**Fix:** Remove dead prop; log or surface reaction failures.

### R5 — `cloneElement` actions injection under conflict resolve
**Severity:** advisory  
**Where:** `frontend/src/components/PostActionRow.tsx`

Composition matches plan 24, but add/add conflict with sibling-comment `PostActionRow` on `dev` is easy to resolve wrong.

**Fix:** Keep `actions` left-slot composition when merging.

## What's good

- Shared `lib/reactionOptions.ts` + `ReactionIcon` across Feed/comments/Messages
- `ReactionBar`: `justify-between`, left trigger+actions, right cluster+total, hidden at 0, accessible summary label
- Plan 24 wiring on tip: `PostActionRow` → `actions`; parent comments pass `ReplyActionButton`
- No API/DB contract change for reaction keys
- Acceptance artifacts present for plans 20 and 24

## Merge gate

1. Resolve **R1** before merge (rebase; no messenger regression; conflicts clean).
2. Address or explicitly waive **R2–R3** in the contributor turn.
3. **R4–R5** optional / follow-up.

Also note stacking risk vs open PRs **#24** (shell/css/Messages), **#25** / **#26** (Messages realtime / friend picker) — Messages sticker wiring will need re-application after whichever Messages tip wins.

## Path

`plans/07292026-20-reactions-changed-icon/reviews/01-07302026-reviewer-needs-changes.md`
