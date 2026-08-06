---
turn: 01
date: 08062026
role: reviewer
by: dave
branch: kylie/pin-profile → dev
spec: plans/08062026-49-pin-profile-priority/spec.html
verdict: needs-changes
status: open
addresses: []
---

# Reviewer turn 01 — needs-changes

## Findings

### R1 — must-fix — Inbox SQL `ORDER BY` sorts unpinned by `c.id`, not activity
`ConversationModel` currently ends with:

`ORDER BY CASE WHEN cp.pinned_at IS NULL THEN 1 ELSE 0 END, cp.pinned_at ASC NULLS LAST, c.id ASC, c.last_message_at DESC …`

Because `c.id ASC` precedes `c.last_message_at DESC`, **unpinned** rows are ordered by conversation UUID, not recent activity. The in-memory `MessageService` comparator does the right thing and currently masks this for the API — but T1 explicitly requires pinned-first stable order from **both** the model query and the final response, and any future removal of the JS sort would ship a broken inbox.

**Fix:** order pinned group by `cp.pinned_at ASC, c.id ASC`, and unpinned by `c.last_message_at DESC, c.created_at DESC, c.id ASC` (e.g. split with `CASE` expressions so `id` is not a global secondary key before activity).

### R2 — advisory — Dense one-line comparator
The new `.sort(...)` chain in `MessageService.listConversations` is correct but hard to review/maintain. Prefer a named `compareInboxItems` helper.

## What's good
Caller-scoped `conversation_pins` migration, focused `ConversationPriorityService`, participant checks, actor-only `conversation:updated`, and delete-path pin cleanup match the Level 3 boundary. Frontend menu wiring + saving guard are sound.

## Merge notes
Coordinate with #70 (messages surface) before landing both.
