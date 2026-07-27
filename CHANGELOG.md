# Changelog

## 0.1.2 — 2026-07-28

### Added
- One-level comment replies: Reply on top-level comments, indented children under parents
- Fixed bottom composer with “Replying to …” + Cancel (does not move under the comment)
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
