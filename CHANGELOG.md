# Changelog

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
- `plans/07282026-12-comment-timestamps` — Completed

## 0.1.2 — 2026-07-28

### Added
- One-level comment replies: Reply on top-level comments, indented children under parents
- Inline reply composer under the parent comment (“Replying to …” + Cancel); bottom form for top-level comments only
- Nullable `comments.parent_id` with same-post top-level parent validation

### Plans
- `plans/07282026-11-comment-replies` — Completed

## 0.1.1 — 2026-07-28

### Added
- Header light/dark mode toggle between Profile and Log out (also before Sign in when logged out)
- Persisted theme preference (`localStorage` key `socmed-theme`) with FOUC-safe bootstrap
- Dark-mode B&W design tokens and body gradient
- Contained acceptance runtime adapter (`scripts/accept-runtime.sh`)

### Plans
- `plans/07282026-10-header-theme-toggle` — Completed
