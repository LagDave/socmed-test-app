# Changelog

## 0.1.13 — 2026-07-29

### Added
- Messages inbox friend picker: accepted mutuals listed automatically; tap opens/creates a 1:1 thread
- Icon-triggered friend search (right-aligned): filter input expands on search icon tap; Esc/close collapses

### Changed
- Empty Messages state no longer dead-ends on “Go to Friends” alone; quiet Manage friends link retained

### Plans
- `plans/07292026-23-messages-friend-picker` — Completed

## 0.1.12 — 2026-07-29

### Added
- Socket.IO live delivery for 1:1 messages (REST writes unchanged): `message:new` / `message:unsent` / `message:reaction`, plus `messages:unread` and `conversation:updated`
- Cookie-authenticated socket handshake (`socmed_session`); per-user rooms `user:{id}`
- SPA socket client; thread and AppShell badge consume events; REST poll only while disconnected
- Vite proxies `/socket.io` → API `:3210` (ws)

### Changed
- API bootstrap uses `http.Server` + Socket.IO attach; default local CORS origin `http://localhost:5180`; default `PORT` 3210
- SPA catch-all excludes `/socket.io`

### Plans
- `plans/07292026-22-messages-websockets` — Completed (A1–A7 waived: interactive/deploy follow-up; Caddy snippet in plan folder for Dave)

## 0.1.11 — 2026-07-29

### Changed
- Friends, Profile, Notifications, Messages, and Account Settings use Feed’s clear layout (title on page background + `feed-card` stacks)
- Removed the gray `soft-page-canvas` outer plate and unused soft-page CSS

### Plans
- `plans/07292026-21-removed-outline-padding` — Completed

## 0.1.10 — 2026-07-29

### Changed
- Feed / post detail: comment control is an icon beside reactions (`MessageSquare`); post body no longer navigates to detail
- Parent comments: reply trigger is an icon beside reactions; compose submit labels stay text
- AppShell header is full-width with three zones: brand left, Home + Friends centered, Messages · Notifications · Profile on the right
- Signed-in theme toggle and Log out moved into a Profile dropdown (Profile · Switch mode · Log out)

### Added
- shadcn/Radix `DropdownMenu` UI primitive (`frontend/src/components/ui/dropdown-menu.tsx`)

### Plans
- `plans/07292026-18-comment-action-icons` — Completed
- `plans/07292026-19-navbar-arrangement` — Completed

## 0.1.9 — 2026-07-29

### Added
- Friends-only 1:1 messenger: conversations, messages (text + images), reactions, soft unsend (“Unsent a message”)
- Messages API under `/api/messages` with unread count; SPA inbox/thread at `/messages` with short polling
- AppShell Messages nav badge (separate from Notifications); message icons on Friends mutuals and mutual profiles

### Plans
- `plans/07292026-17-friends-messenger` — Completed

## 0.1.8 — 2026-07-28

### Added
- Activity notifications (comments on your posts, replies to your comments, friend requests) with bell badge counts
- Home/Feed badge for friends' new posts since last feed visit
- Notifications API (`/api/notifications`, counts, mark-read, `/api/feed/seen`)

### Changed
- Profile picture control: clickable 1×1 preview + absolute URL field; upload only fills the form until Save
- Bottom-right toasts for copy link / picture update; scroll to top after picture save

### Fixed
- Removed empty stub migrations that reserved `comment_parent` / `reactions` version IDs (real schema stays on owning PRs)
- Removed hard-coded Friends "Online" pip (no presence API)

### Plans
- `plans/07282026-16-friends-management-ui` — Continued (Rev 8–16); PR #9 scope retitled to include notifications + feed-seen; landed on dev

## 0.1.7 — 2026-07-28

### Added
- Emoji reactions (like / heart / haha / wow) on posts, comments, and replies
- `reactions` table + PUT/DELETE APIs; `reactionSummary` embedded on feed/post/comment payloads
- Shared `ReactionBar` (hover/press picker, CSS wiggle/pop, post vs comment sizes)
- Bordered containers for feed posts, post detail, comments/composers, and profile header
- Light feed canvas (`#F0F2F5`) with centered white cards (8px radius, subtle shadow) and “What's on your mind?” composer

### Plans
- `plans/07282026-15-reactions` — Completed

## 0.1.6 — 2026-07-28

### Added
- Delete controls for own posts (Feed + post detail), comments, and replies
- In-app `ConfirmDialog` modal before destructive deletes (no native browser confirm)

### Plans
- `plans/07282026-14-delete-buttons` — Completed

## 0.1.5 — 2026-07-28

### Added
- Enter submits the Feed “What’s happening?” composer (same Shift+Enter newline + whitespace guard as comments/replies)
- Shared `submitOnEnter` helper used by Feed and post-detail composers

### Plans
- `plans/07282026-13-enter-to-submit` — Rev 3+ (Feed scope) Completed

## 0.1.4 — 2026-07-28

### Added
- Enter submits comments and replies on post detail; Shift+Enter inserts a newline
- Shared whitespace trim guard so blank bodies do not submit (button or Enter)

### Plans
- `plans/07282026-13-enter-to-submit` — Completed

## 0.1.3 — 2026-07-28

### Added
- Human-readable relative timestamps on feed posts, top-level comments, and replies (right-aligned; absolute time on hover)
- Shared `formatRelativeTime` helper (`Intl.RelativeTimeFormat`, no new dependencies)

### Plans
- `plans/07292026-12-comment-timestamps` — Completed

## 0.1.2 — 2026-07-28

### Added
- One-level comment replies: Reply on top-level comments, indented children under parents
- Inline reply composer under the parent comment ("Replying to …" + Cancel); bottom form for top-level comments only
- Nullable `comments.parent_id` with same-post top-level parent validation
- Friends management dashboard UI (page-scoped soft canvas, elevated card, Send Request row, Friend Request + Friends sections with empty states)
- Edit Profile settings UI (circular avatar banner, labeled form, custom picture upload)
- Profile overflow menu (remove picture, public preview, account settings stub, copy profile link)
- Account Settings page at `/settings` (privacy / security / general placeholders)

### Changed
- Shared `.soft-page-canvas` styling for Friends and Profile
- Friend request accept button label → Confirm; mutuals section → Friends
- Outgoing requests list removed from Friends UI (API cancel endpoint retained)

### Plans
- `plans/07282026-11-comment-replies` — Completed
- `plans/07282026-16-friends-management-ui` — Completed

## 0.1.1 — 2026-07-28

### Added
- Header light/dark mode toggle between Profile and Log out (also before Sign in when logged out)
- Persisted theme preference (`localStorage` key `socmed-theme`) with FOUC-safe bootstrap
- Dark-mode B&W design tokens and body gradient
- Contained acceptance runtime adapter (`scripts/accept-runtime.sh`)

### Plans
- `plans/07282026-10-header-theme-toggle` — Completed
