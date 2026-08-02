---
turn: 01
date: 08012026
role: reviewer
by: dave
branch: kylie/default-stickers → dev
spec: plans/07312026-30-default-message-stickers/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — PR #45 default message stickers

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/45  
**Plan:** `plans/07312026-30-default-message-stickers`

Direction is right: six-key enum migration, shared `ReactionBar` on messages, composer emoji picker, `MessageReactionBar` deleted. Typecheck passes on tip. Merge blocked on UX/a11y/spec-parity defects below.

## Findings

### R1 — Message reaction bar can vanish while picker is open
**Severity:** must-fix  
**Where:** `frontend/src/components/MessageBubbleRow.tsx:85-90`; `frontend/src/components/ReactionBar.tsx:178-179`

When a message has **zero** reactions, the wrapper applies `opacity-0` until `group-hover/message`, `focus-within`, or `has-[[aria-expanded=true]]`. The third selector **never matches**: the collapsed trigger hard-codes `aria-expanded={false}`, and when expanded the trigger is unmounted in favor of a `role="listbox"` panel with no `aria-expanded`.

**Repro:** Desktop — open react picker on a message with no existing reactions; move pointer off the message row while picker stays open → control fades to invisible (still in DOM).

**Fix:** Drive visibility from real expanded state — e.g. lift `expanded` to `ReactionBar` callback/`data-expanded`, or set `aria-expanded={expanded}` on a persistent trigger wrapper; drop the dead `has-[[aria-expanded=true]]` tailwind unless it can actually match.

### R2 — Spec-code drift: composer emoji grid is ~166 glyphs, spec locks ~40
**Severity:** must-fix  
**Where:** `frontend/src/lib/composerEmojiOptions.ts`; `plans/07312026-30-default-message-stickers/spec.html` Locked Decision #4

Spec: *"Static list (~40 common emoji) … Not a full OS keyboard clone."* Implementation ships **166** entries (faces, animals, food, weather, etc.) with no Revision Log entry. Spec-code parity rule requires either trim to the locked scope or append Rev 3 documenting intentional expansion.

**Fix:** Trim to ~40 Messenger-common picks **or** append Revision Log + update Decision #4 / Out-of-scope notes before merge.

### R3 — `ReactionBar` trigger never exposes `aria-expanded={true}`
**Severity:** must-fix  
**Where:** `frontend/src/components/ReactionBar.tsx:178-179` (all surfaces: post, comment, message)

Collapsed button always renders `aria-expanded={false}`; expanded state replaces the button entirely. Screen readers cannot tell the picker is open; MessageBubbleRow visibility hack (R1) depends on this attribute.

**Fix:** Keep a single trigger element (or pair trigger + popup per WAI-ARIA combobox/listbox pattern) with `aria-expanded={expanded}` and `aria-controls` pointing at the picker id.

### R4 — Message reaction summary not right-aligned per wireframe
**Severity:** concern  
**Where:** `frontend/src/components/ReactionBar.tsx:161-165`; `MessageBubbleRow.tsx`

Spec wireframe shows summary cluster (`😢 2`) on the **right** of the bubble row. Message mode uses `inline-flex` without `w-full justify-between`, so when `totalCount > 0` the cluster sits immediately beside the trigger, not trailing the bubble width. Feed/comments keep Plan 24 layout; messages regress visually.

**Fix:** For `targetType === "message"`, use a full-width row with summary trailing (mirror feed sm layout) or confirm wireframe revision.

### R5 — Feed/comment reaction failures still fall back to `console.error`
**Severity:** concern  
**Constitution:** §17.1 — No `console.*` in shipped code  
**Where:** `frontend/src/components/ReactionBar.tsx:134-136`; callers `PostCard.tsx`, `CommentItem.tsx` omit `onError`

Message path correctly wires `onError={setError}`. Post/comment paths hit the `else console.error(message)` branch. Pre-existing on feed, but this PR extends `ReactionBar` without fixing the contract.

**Fix:** Route all callers through `lib/toast` or require `onError` on every `ReactionBar` mount.

### R6 — Acceptance A4 feed sad/angry manually unwaivered
**Severity:** advisory  
**Where:** `plans/07312026-30-default-message-stickers/test-results.json` item A4

Status `pass` with written waiver (*"not manually clicked"*). Acceptable if enum migration verified in dev; recommend one click-through before `-d` on plan 30.

## Spec / task parity

| Task | Status | Notes |
|------|--------|-------|
| T1 migration + backend constants | OK | `REACTION_EMOJIS` single source propagates to Zod via import; `emptyReactionSummary()` now derives all six keys |
| T2 frontend types + sticker map | OK | `ReactionEmoji`, `REACTION_OPTIONS`, `ReactionIcon` |
| T3 ReactionBar on messages | Partial | Wired; R1/R3/R4 block |
| T4 composer emoji picker | Partial | Works; R2 spec drift |
| T5 acceptance | Partial | Rollup Passed; A4 waived |

## What's good

- Idempotent PG enum migration (`ADD VALUE IF NOT EXISTS`)
- `parseReactionResponse` handles message vs post/comment payload shapes
- `MessageReactionBar` removed; no duplicate reaction API client
- `insertTextAtSelection` + textarea ref focus restore on compose pick
- Branch is one commit ahead of merge-base with `dev`; no restack needed
- Typecheck green on tip

## Merge gate

1. Fix **R1** and **R3** (linked — same expanded-state/a11y surface).
2. Resolve **R2** (trim list or Revision Log).
3. Address or waive **R4–R6** in contributor turn.
