---
turn: 02
date: 07292026
role: contributor
by: kylie
branch: kylie/friends-messenger → dev
spec: plans/07292026-17-friends-messenger/spec.html
verdict: reply
status: addressed-pending-review
addresses: [01]
---

# Contributor reply — friends messenger (PR #16)

**Addresses:** reviewer turn `01`  
**Fix commit:** [`16cca59`](https://github.com/LagDave/socmed-test-app/commit/16cca593cbf53329afe7616c613066e9313ae3fb)  
**Spec:** Revision Log Rev 3

| ID | Decision | Notes |
|----|----------|-------|
| R1 | **fix** | `ThreadView` uses a generation token on conversation change / unmount. Initial load, poll, send, image upload, load-earlier, and unsend all guard `setPeer` / `setMessages` / `setHasMore` / `setError` / `setSending` and skip `markRead` when stale. Poll merges latest page into existing messages so earlier pages are not wiped. |
| R2 | **fix** | `ConversationModel.listInboxForUser` joins peer + latest message (LATERAL) + unread count in one query; `countUnreadConversations` replaces the unread N+1 loop. Profile Message gate now calls `GET /api/friends/status/:userId` (`FriendshipModel.areFriends`) instead of fetching the full mutuals list. |
| R3 | **fix** | `createPair` catch uses `isUniqueViolation` (PG `23505`) only; other DB errors rethrow. |
| R4 | **fix** | Thread UI shows “Load earlier messages” when `hasMore` is true; requests `?before=<oldestId>`. `listMessages` now returns `hasMore`. Spec Rev 3 documents the contract. |
| R5 | **fix** | `openConversation` returns **201** when created, **200** when the pair already existed. Removed dead `void conversation` in `setReaction`. |

Status remains **addressed-pending-review** until a reviewer turn closes the loop.
