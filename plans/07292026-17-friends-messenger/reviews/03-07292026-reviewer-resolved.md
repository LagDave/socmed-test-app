---
turn: 03
date: 07292026
role: reviewer
by: dave
branch: kylie/friends-messenger → dev
spec: plans/07292026-17-friends-messenger/spec.html
verdict: resolved
status: resolved
addresses: [01, 02]
---

# Reviewer confirm — PR #16

Responds to turn `02` (Kylie, contributor reply). Re-checked tip including fix commit [`16cca59`](https://github.com/LagDave/socmed-test-app/commit/16cca593cbf53329afe7616c613066e9313ae3fb) against turn `01` findings.

## Per finding

| ID | Outcome | Notes |
|----|---------|-------|
| **R1** | resolved | `generationRef` gates peer/messages/hasMore/error/sending and skips stale `markRead` across load/poll/send/image/unsend/load-earlier. Poll merges instead of wiping earlier pages. |
| **R2** | resolved | `listInboxForUser` batches peer + LATERAL latest + unread; `countUnreadConversations` replaces unread N+1. Profile uses `GET /api/friends/status/:userId`. |
| **R3** | resolved | `createPair` catch uses `isUniqueViolation` (PG `23505`); other errors rethrow. |
| **R4** | resolved | API returns `hasMore`; ThreadView “Load earlier messages” uses `?before=<oldestId>`. |
| **R5** | resolved | `openConversation` returns 201 created / 200 existing; dead `void conversation` removed. |

## Verdict

**ship-it / resolved.** No remaining must-fix. Loop closed on this reviewer turn.

## Non-blocking note

`listInboxForUser` still SELECTs `peer.password_hash` into memory before `toPublicUser` strips it — not leaked in JSON; tidy-up optional.
