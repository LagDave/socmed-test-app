# Changelog

## 0.1.4 — 2026-07-28

### Added
- Activity notifications (comments on your posts, replies to your comments, friend requests) with bell badge counts
- Home/Feed badge for friends’ new posts since last feed visit
- One-level comment replies on post detail
- Notifications API (`/api/notifications`, counts, mark-read, `/api/feed/seen`)

### Fixed
- Removed empty stub migrations that reserved `comment_parent` / `reactions` version IDs (real schema stays on owning PRs)
- Removed hard-coded Friends “Online” pip (no presence API)

### Plans
- `plans/07282026-16-friends-management-ui` — Continued (Rev 11–16); PR #9 scope retitled to include notifications + feed-seen

## 0.1.3 — 2026-07-28

### Changed
- Profile picture control: clickable 1×1 preview + absolute URL field; upload only fills the form until Save
- Bottom-right toasts for copy link / picture update; scroll to top after picture save

### Plans
- `plans/07282026-16-friends-management-ui` — Continued (Rev 8–10)

## 0.1.2 — 2026-07-28

### Added
- Friends management dashboard UI (page-scoped soft canvas, elevated card, Send Request row, Friend Request + Friends sections with empty states)
- Edit Profile settings UI (circular avatar banner, labeled form, custom picture upload)
- Profile overflow menu (remove picture, public preview, account settings stub, copy profile link)
- Account Settings page at `/settings` (privacy / security / general placeholders)

### Changed
- Shared `.soft-page-canvas` styling for Friends and Profile
- Friend request accept button label → Confirm; mutuals section → Friends
- Outgoing requests list removed from Friends UI (API cancel endpoint retained)

### Plans
- `plans/07282026-16-friends-management-ui` — Completed

## 0.1.1 — 2026-07-28

### Added
- Header light/dark mode toggle between Profile and Log out (also before Sign in when logged out)
- Persisted theme preference (`localStorage` key `socmed-theme`) with FOUC-safe bootstrap
- Dark-mode B&W design tokens and body gradient
- Contained acceptance runtime adapter (`scripts/accept-runtime.sh`)

### Plans
- `plans/07282026-10-header-theme-toggle` — Completed
