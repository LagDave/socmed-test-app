---
turn: 01
date: 07302026
role: reviewer
by: dave
branch: Kylie/share-button → dev
spec: plans/07302026-26-share-button/spec.html
verdict: ship-it
status: open
addresses: []
---

# Reviewer turn 01 — ship-it (plan 26 delta)

Initial review of plan 26 commit `460ee80` (share button + nested embed).

## Findings

| ID | Severity | Finding |
|----|----------|---------|
| R1 | concern | Branch stacks #26+#27 beneath plan 26 — merge **#26 → #27** first (or rebase) for clean per-feature landing |
| R2 | advisory | Repeat shares of the same original are allowed (Facebook-parity); spec does not forbid |

## Spec-code parity (plan 26)

| Requirement | Status |
|-------------|--------|
| Share2 icon after comment, no text label | OK (`PostActionRow.tsx`) |
| Share only when viewer ≠ author AND not a wrapper | OK (`canSharePost`, server `PostService.share`) |
| `shared_from_post_id` migration, ON DELETE SET NULL | OK |
| Empty wrapper body, nested original content | OK |
| Backend authz: mutual friends, no own-post, no share-of-share | OK (`PostService.ts` L78–90) |
| Attribution line + `SharedPostEmbed` on Feed and Detail | OK |
| No new npm dependencies | OK |

## What's good

Authz enforced server-side; hydrate batches originals via `findByIds`; unavailable-original fallback; share busy guard on client.

## Verdict

**Ship plan 26 delta.** Approve pending stack merge order (#26 → #27 → #28).
