---
turn: 01
date: 08052026
role: reviewer
by: dave
branch: kylie/message-account-settings → dev
spec: plans/08032026-42-message-settings-sound-move/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — message settings sound move (PR #60)

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/60

App code matches the spec (route order, inbox gear, Account Settings trim). Merge is blocked on **acceptance artifact integrity**.

## Findings

### R1 — Acceptance rollup claims Passed with pending items
**Severity:** must-fix  
**Where:** `plans/08032026-42-message-settings-sound-move/test-results.json`

Top-level `"status": "Passed"` while A1–A4 are still `"status": "pending"` (with waiver strings). Per AGENTS.md, Passed requires every item `pass`, or each **failure** to carry a written waiver. `pending` + waiver does not count; `test.html` would roll up **In Progress**.

**Fix:** Run A1–A4 and set `pass` + evidence, **or** mark deferred items `fail` with real waivers and set top-level status accordingly. Do not leave top-level `Passed` while items are `pending`.

### R2 — Weak / circular waivers
**Severity:** concern  
**Where:** Same file — waiver text “Interactive UI verify deferred to PR author”

A1/A2/A4 are cheap static checks; only A3 needs two-browser audio. Deferring all four undercuts the acceptance gate this plan defined.

**Fix:** Actually verify A1/A2/A4 (or mark fail + honest waiver). Keep audio waiver only on A3 if needed.

### R3 — Growing an over-ceiling page
**Severity:** advisory  
**Where:** `frontend/src/pages/MessagesPage.tsx` (§13.1)

Inbox gear is a small, spec-required edit on a file already past ~800 lines. Acceptable for this plan; extract `InboxView` / settings entry before more Messages work.

## What's good

- Spec–code match: `/messages/settings` before `/messages/:conversationId`; icon-only chrome; inbox gear with `aria-label`
- Reuses `NotificationSoundsSettings`; no playback/hook churn
- Frontend-only; migrations N/A; base `dev`

## Merge gate

Fix R1 acceptance rollup before merge.

Also posted as **Changes requested** on the PR.
