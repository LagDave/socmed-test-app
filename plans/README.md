# Socmed plans — sequential execution

Execute **in order**. Stop after plan **09**; DNS is human-owned.

| Seq | Folder | Feature |
|-----|--------|---------|
| 01 | `07272026-01-caddy-edge-migration` | Apache → Caddy (alloro-dev) |
| 02 | `07272026-02-socmed-repo-scaffold` | GH repo + scaffold + shadcn B&W |
| 03 | `07272026-03-socmed-auth` | Auth |
| 04 | `07272026-04-socmed-profiles` | Profiles |
| 05 | `07272026-05-socmed-posts-feed` | Posts + feed |
| 06 | `07272026-06-socmed-comments` | Linear comments |
| 07 | `07272026-07-socmed-friendships` | Friend requests + mutuals |
| 08 | `07272026-08-socmed-media-uploads` | Photo uploads |
| 09 | `07272026-09-socmed-deploy-caddy` | Deploy wiring; leave DNS |
| 10 | `07282026-10-header-theme-toggle` | Header light/dark toggle |
| 11 | `07282026-11-comment-replies` | One-level comment replies |
| 12 | `07282026-12-comment-timestamps` | Relative timestamps on feed, comments, replies |
| 13 | `07282026-13-enter-to-submit` | Enter submits comment/reply (Shift+Enter newline) |
| 14 | `07282026-14-delete-buttons` | Delete own posts, comments, and replies |
| 15 | `07282026-15-reactions` | Emoji reactions on posts, comments, and replies |
| 16 | `07282026-16-friends-management-ui` | Friends management dashboard UI + activity notifications |
| 17 | `07292026-17-friends-messenger` | Friends-only 1:1 messenger (poll) |
| 18 | `07292026-18-comment-action-icons` | Comment icon beside reactions; reply icon |
| 19 | `07292026-19-navbar-arrangement` | Full-width navbar zones + profile dropdown |
| 20 | `07292026-20-reactions-changed-icon` | Reaction stickers 👍❤️😂😮 (ReactionBar + Messages) |
| 21 | `07292026-21-removed-outline-padding` | Flush soft-page-canvas (drop outer outline padding) |
| 22 | `07292026-22-messages-websockets` | Messages live delivery via Socket.IO (REST writes stay) |
| 23 | `07292026-23-messages-friend-picker` | Messages inbox: auto mutuals + icon-triggered friend search |
| 24 | `07292026-24-reaction-summary-layout` | Reaction summary right-aligned cluster + total count |
| 25 | `07302026-25-feed-composer-avatar` | Facebook-style feed composer + shared ProfileAvatar |
| 26 | `07302026-26-share-button` | Facebook-style share button for friends' posts |
| 38 | `08012026-38-messages-ui-upgrade` | Messages UI — unified inbox card + thread polish |

## Branch → host (hard rule)

- `main` → `socmed.rustinedave.com` (primary)
- `dev` → `socmed-dev.rustinedave.com`

## Human leftover after 09

Point both A records to `168.144.128.47` (see plan 09 `DNS.md` once written).
