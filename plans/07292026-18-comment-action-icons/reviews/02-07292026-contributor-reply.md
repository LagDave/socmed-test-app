---
turn: 02
date: 07292026
role: contributor
by: kylie
branch: kylie/comment-action-icons → dev
spec: plans/07292026-18-comment-action-icons/spec.html
verdict: reply
status: addressed-pending-review
addresses: [01]
---

# Contributor reply — PR #17 review

Responds to turn `01` (Dave, needs-discussion). **Decision:** split — messenger lands via PR #16; this PR’s unique deliverable is comment/reply action icons (plan 18). Stacking on #16 historically is OK; merge this after #16.

## Per finding

| ID | Response | Evidence |
|----|----------|----------|
| **R1** | `fix` | Documented split via `gh pr edit` on [PR #17](https://github.com/LagDave/socmed-test-app/pull/17): title **Comment and reply action icons**; body states unique deliverable is plan-18 icons, messenger comes from stacked [#16](https://github.com/LagDave/socmed-test-app/pull/16), merge after #16. |
| **R2** | `ignore` | Post-unfriend access policy belongs on messenger PR #16 — tracked there (same friends-only story). Not duplicated on this icons PR. |
| **R3** | `ignore` | Conversations / unread N+1 batching belongs on #16 — tracked there. Not duplicated here. |
| **R4** | `ignore` | Inbox list polling is messenger UX; waive for this PR as follow-up / #16. Icons slice unchanged. |
| **R5** | `ignore` | Cancel-flag / bare-catch nits are in messenger `ThreadView` / create path — tracked on #16. |

## Rebase note

`origin/kylie/friends-messenger` has not yet pushed race / N+1 code fixes (tip is docs-only `f5448ac` on top of shared messenger feat `c653cb6`). No rebase onto #16 this turn; will rebase when #16 lands those fixes so this stack inherits them.

## Status

`addressed-pending-review` — awaiting reviewer confirm on the documented split / deferrals. Comment-icon slice itself unchanged (already shippable per turn 01).
