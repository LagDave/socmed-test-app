---
turn: 01
date: 07292026
role: reviewer
by: dave
branch: kylie/friends-messenger → dev
spec: plans/07292026-17-friends-messenger/spec.html
verdict: needs-changes
status: open
addresses: none
---

# Review — friends messenger (PR #16)

**Verdict:** needs changes  
**PR:** https://github.com/LagDave/socmed-test-app/pull/16

Friends-only 1:1 messenger (schema, API, inbox/thread, reactions, soft unsend, unread badge) is cohesive and layering/authz look solid overall. Merge is blocked on a conversation-switch race in `ThreadView`.

## Findings

### R1 — `ThreadView` load race on conversation switch
**Severity:** must-fix  
**Where:** `frontend/src/pages/MessagesPage.tsx` (`ThreadView` `load()`)

`cancelled` only guards `setError`, not `setPeer` / `setMessages` / `markRead`. Fast conversation switches can paint the wrong thread and mark the wrong conversation read.

**Fix:** Guard all state writes (and mark-read) with the cancel flag / request generation token; abort in-flight work on unmount or `conversationId` change.

### R2 — Inbox / unread N+1
**Severity:** concern  
**Where:** `src/services/MessageService.ts` (`listConversations`, unread helpers)

Peer + latest message + unread count are fetched per conversation. Profile Message gate also fetches the full mutuals list.

**Fix:** Batch / join in SQL; reuse a cheaper mutual check for Profile.

### R3 — Bare `catch` on `createPair`
**Severity:** concern  
**Where:** conversation create path

Non-unique DB failures can surface as misleading `MESSAGE_CONFLICT`.

**Fix:** Catch only the unique-violation / expected conflict; rethrow or map other errors correctly.

### R4 — Pagination unused in UI
**Severity:** concern  
**Where:** messages list API + `MessagesPage`

API supports `before` pagination; UI never uses it → silent ~50-message ceiling.

**Fix:** Wire cursor pagination (or document the hard cap in the spec / UI).

### R5 — `openConversation` always 201; dead `void conversation`
**Severity:** advisory

Get-or-create returning 201 for existing rows is slightly misleading. Dead `void conversation` in `setReaction` is noise.

## What’s good

- Migration: conversations (ordered pair + last-read), messages (soft unsend), message_reactions
- MessageService: Zod validation, `areFriends` + participant gates, upload-path `imageUrl` check
- Thin routes/controller under `/api/messages` with `requireAuth`
- Nav unread badge + Friends/Profile mutual entry points
- Layering matches repo patterns; no WebSockets as locked

## Merge gate

1. Resolve R1 (thread switch race) before merge.
2. Address or explicitly waive R2–R4.
3. R5 optional / follow-up.

Also posted as **Changes requested** on the PR.
