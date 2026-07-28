---
turn: 01
date: 07282026
role: reviewer
by: dave
branch: kylie/timestamps-for-comments-and-replies → dev
spec: plans/07282026-13-enter-to-submit/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — PR #6 timestamps + Enter to submit

**Verdict:** needs changes (correcting an earlier premature **APPROVE**)  
**PR:** https://github.com/LagDave/socmed-test-app/pull/6

A later pass found submit-path duplication risks that the first approve missed. Treat this as the active review gate.

## Findings

### R1 — Hold-Enter / in-flight can duplicate posts and comments
**Severity:** must-fix  
**Where:** `frontend/src/lib/submitOnEnter.ts`, `frontend/src/pages/FeedPage.tsx`, `frontend/src/pages/PostDetailPage.tsx`

`submitOnEnter` only gates on Enter / Shift / IME (`isComposing` / keyCode 229). It does **not** ignore `e.repeat`, so a held Enter key fires repeated `keydown` → `requestSubmit()` cycles.

Feed compose has a `busy` flag and disables the Post button, but:
- `onCompose` does not early-return when already `busy`, and
- `submitOnEnter` does not consult any in-flight state,

so repeated submits can start before React re-renders `disabled={busy}`.

Comment / reply paths are worse: `submitComment` / `onComment` / `onReply` have **no** busy / in-flight guard at all — only a whitespace trim. Holding Enter (or double-submitting) can create duplicate comments/replies.

**Fix:**
1. Ignore `e.repeat` in `submitOnEnter` (and keep IME guards).
2. Guard all submit handlers (`onCompose`, `submitComment` / comment+reply) with an in-flight flag: early-return if busy; set busy around the async work; disable submit controls while busy.
3. Optionally refuse `requestSubmit` when the associated control is already disabled / form is submitting.

### R2 — Invalid `createdAt` still gets a broken `title`
**Severity:** concern  
**Where:** `formatRelativeTime` + `<time title={new Date(createdAt).toLocaleString()}>` on Feed / PostDetail

`formatRelativeTime` returns `""` for `NaN` dates, but the `title` attribute still calls `toLocaleString()` on an invalid `Date` → `"Invalid Date"` hover text while the visible label is empty.

**Fix:** Share one safe absolute formatter (or skip `title` when the instant is invalid).

### R3 — Sub-hour bucket can show “60 minutes ago”
**Severity:** concern  
**Where:** `frontend/src/lib/formatRelativeTime.ts` (`abs < 60 * 60` → minute unit)

Near the hour boundary, `Math.round(abs / 60)` can yield **60**, so the UI shows “60 minutes ago” instead of rolling into the hour bucket.

**Fix:** Cap the minute bucket below 60 (e.g. switch to hours when `round(abs/60) >= 60`, or use `Math.floor` / an explicit `< 59.5 * 60` threshold consistent with the “just now” style).

## What’s good

- Shared `submitOnEnter` + whitespace trim before API calls
- IME-safe composing / 229 handling
- Relative timestamps via `Intl.RelativeTimeFormat` without new deps
- Feed button already wires `disabled={busy}` (needs the stronger guards above)

## Merge gate

1. **R1 must ship** before merge (Enter-hold / in-flight duplication).
2. Address or explicitly waive R2 / R3.
3. This review **supersedes** the earlier approve — do not merge on that approval alone.

Also posted as **Changes requested** on the PR.
