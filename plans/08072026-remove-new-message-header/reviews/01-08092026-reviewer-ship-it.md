---
turn: 01
date: 08092026
role: reviewer
by: dave
branch: kylie/message-ui → dev
spec: plans/08072026-remove-new-message-header/spec.html
verdict: ship-it
status: open
addresses: []
---

# Review — PR #82 (`kylie/message-ui` → `dev`)

## Summary

Controlled `MessagesFriendPicker` + inbox toolbar New message match the final spec (Rev 7–9). No must-fix findings. Spec-code parity holds for What/Done, T1–T2, and A1.

## Findings

### R1 — concern
Empty-inbox search close/Escape always restores focus to the toolbar New message trigger, including when search was opened from the in-picker Search control. Pre-change, focus returned to `searchToggleRef`. Spec T1 called out preserving focus return; Done only hard-requires restore after the New message action.

**Ask:** Restore to the control that opened search (toolbar vs empty-inbox Search), or document the empty-inbox path as intentionally deferred to the toolbar.

### R2 — advisory
Toolbar New message is open-only (`handleNewMessagePickerOpenChange(true)`). Re-click does not close; Escape / Close search required.

### R3 — advisory
Conversations header keeps `border-t` while the compose wrapper is `hidden`, which can leave an orphan top rule on the card.

### R4 — advisory
PR title/body do not describe the composer simplification; weak signal for `dev` history.

### R5 — advisory
Revision Log Rev 3–6 still describe the abandoned new-chat-availability / Manage-friends-on-toolbar design. Final What + implementation match Rev 7–9 — parity OK, log noise only.

## Constitution

No new must-fix Articles in the reviewed delta. Pre-existing inline mutuals fetch in `MessagesFriendPicker` (§14.3) is unchanged and out of plan scope.

## Spec-code parity

| Spec item | Code |
|-----------|------|
| No populated “New message” heading / closed compose | `InboxView` hides compose when `items.length > 0 && !isNewMessagePickerOpen && friendPickerStatus === "ready"`; picker omits heading when `hasConversations` |
| Person-plus = always New message | Toolbar `aria-label="New message"` opens controlled search |
| Manage friends off Messages toolbar | Removed; empty-state / Friends surface remain |
| Friends heading for empty inbox | Retained when `!hasConversations` |
| Escape + focus restore after New message | Input Escape → `closeSearch` → parent restores `newMessageTriggerRef` |
| Loading / error stay visible | Hide gated on `friendPickerStatus === "ready"` only |
| A1 Passed | `test-results.json` status `Passed` with user evidence |

## Verdict

**ship-it** — concerns/advisories above are non-blocking; safe to merge to `dev`.
