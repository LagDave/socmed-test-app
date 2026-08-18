---
turn: 02
date: 08182026
role: contributor
by: dave
branch: cursor/fix-pr94-friends-62bd → dev
spec: plans/08152026-friends-ui-revamp/spec.html
verdict: fix-plan
status: addressed-pending-review
addresses: [1]
---

# Contributor turn 02 — fix plan (executed)

Responding to reviewer turn 01 on PR #94.

| ID | Response | Notes |
|----|----------|--------|
| R1 | fix | Run isolated DB+API acceptance for A4/A5; typecheck/lint/build for A7; record evidence or honest waivers for remaining UI items. Spec Rev 11. |
| R2 | fix | Dropped `isOnline` from suggestion DTO (backend + frontend). Suggested rows pass `canViewPresence={false}`. Spec Rev 11. |
| R3 | fix | `useFriendsInbox` loads inbox+mutuals first; suggestions in a separate try. Suggested view shows `suggestionsError`. |
| R4 | fix | Replaced `role=tablist/tab/tabpanel` with `aria-pressed` view buttons; arrow keys kept. |
| R5 | fix | Extracted `FriendsViewPanels.tsx` (`FriendsListPanel`, `RequestsListPanel`, `SuggestedListPanel`). |
| R6 | ignore | PR description will be filled on the land PR. |
| R7 | fix | Spec hero is Seq 62. |
