---
turn: 01
date: 08052026
role: reviewer
by: dave
branch: kylie/pinned-chats → dev
spec: plans/08042026-44-pinned-chats/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — pinned chats (PR #64)

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/64

Pin authz and private-vs-shared contract are largely sound. Merge blocked on **migration stacking** and **incomplete acceptance**.

## Findings

### R1 — Migration stacking / history pollution
**Severity:** must-fix  
**Where:** `database/migrations/`

PR ships three non-feature migrations restored for local Knex repair:

| File | Problem |
|------|---------|
| `20260801140000_message_edited_at.ts` | Duplicate of `dev`’s already-applied `20260801150000_message_edited_at.ts` (same body). Branch has **both**. |
| `20260803140000_conversation_theme_log.ts` | Owned by open PR **#59**; no `theme_log` consumers here. |
| `20260804120000_message_search_index.ts` | Owned by open PR **#63**; installs `pg_trgm` + GIN with no search code here. |

**Keep only:** `20260804160000_conversation_pins`, `20260804170000_message_pins`, `20260804180000_message_pin_activities`.

**Fix:** Strip foreign migrations; rebase onto `dev` (and land/order #59/#63 separately).

### R2 — Acceptance artifact not Passed
**Severity:** must-fix  
**Where:** `plans/08042026-44-pinned-chats/test-results.json`

Top-level status is **In Progress** (1 pass / 10 pending). Spec Done checklist still open. Not merge-ready per AGENTS.md.

**Fix:** Run remaining acceptance (or written per-item waivers on failures) and set rollup to Passed.

### R3 — Unpin eligibility weaker than pin
**Severity:** concern  
**Where:** `src/services/MessageService.ts` `unpinMessage` vs `pinMessage`

`pinMessage` rejects unsent + user-deleted messages. `unpinMessage` only does `requireMessageAccess`. A user who soft-deleted a message for themselves can still remove the **shared** pin for both sides.

**Fix:** Mirror pin visibility guards on unpin.

### R4 — Sibling PR race
**Severity:** concern  

Landing #59/#63 migrations here forces those PRs into delete/rebase conflicts and expands blast radius without owning feature code. Coordinate land order.

### R5 — `message_pin_activities.action` unconstrained
**Severity:** advisory  

`string(16)` with no CHECK/enum at DB layer; relies on TS only.

## What's good

- Clear contract: **private** `conversation_pins` vs **shared** `message_pins`
- Mutations go through participant checks; conversation-pin realtime is actor-only; message pins fan out with per-viewer lists
- Idempotent pin; unsend clears pin in-transaction
- Inbox ordering matches pinned-first intent

## Merge gate

Strip foreign migrations → fix unpin parity → finish acceptance rollup → then re-review.

Also posted as **Changes requested** on the PR.
