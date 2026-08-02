# Changelog

## 0.1.18 — 2026-08-02

### Added
- **Chat themes** — shared per-conversation themes stored on `conversations` (preset, solid, gradient)
- Theme API: `GET/PUT /api/messages/conversations/:id/theme`; thread load includes `theme`
- Socket event `conversation:theme` for live peer sync
- **ChatThemePicker** — palette button in thread header; unified horizontal swatch strips for presets, colors, gradients
- **Word effects** — 11 trigger words with bubble-scoped CSS animations (hearts, confetti, sparkle, flame, pop)
- 8 graphic presets, 6 solid swatches, 6 gradient presets (CSS gradients, no binary assets)
- Facebook/Messenger six reaction stickers (Sad 😢, Angry 😡) on posts, comments, and messages
- Message thread compose emoji picker — curated grid inserts emoji at cursor
- Migration `20260731180000_reaction_emoji_sad_angry` extends `reaction_emoji` enum
- Messenger-style **reply to chat**: quote strip in reply bubbles, composer preview bar, `reply_to_message_id` migration
- Hover-to-reveal ↩ Reply / 😊 React / ⋮ Unsend on desktop; **tap message bubble** to show actions on phone/tablet
- Inbox snippet `↩` prefix when the latest message is a reply
- Message status icons on outgoing bubbles: Sent (open blue check), Delivered (filled blue check), Seen (peer avatar)
- `messages.delivered_at` migration; socket `message:ack` / `message:delivered` / `conversation:peer-read` events
- `MessageStatusIcon` component and `ProfileAvatar` `xs` size
- Messages typing indicator: Socket.IO `typing:start` / `typing:stop` relay with ephemeral server TTL
- Animated “{name} is typing” cue above the thread composer and in inbox conversation rows
- `TypingIndicator` component and `useTypingIndicator` hooks (debounced emit + peer listen)
- Click reaction summary on posts and comments to see who reacted (`GET /api/posts/:id/reactions`, `GET /api/comments/:id/reactions`)

### Changed
- **Messages thread** — viewport-height chat shell with auto-scroll to latest message on load/refresh
- **MessageBubbleRow** — themed bubble colors via CSS custom properties when a chat theme is active
- Message reactions use shared `ReactionBar` (hover/hold expand) instead of `MessageReactionBar`
- Compose bar: image attach + emoji buttons grouped tightly
- `MessageView.replyTo` embedded on list, create, and socket payloads (works when quoted message is paginated out)
- API client: clearer errors when the server returns an empty body (common when API is down or migrate was skipped)
- Message timestamps hidden by default; tap/click bubble toggles timestamp for that message
- Thread API returns `peerLastReadAt` and per-message `deliveredAt`

### Fixed
- Message action buttons clipped by thread scroll container (actions sit beside bubble in flex row)
- Knex migration parity: restore `delivered_at` stub so local DB matches cloud after branch switches
- Typing indicator reliability: server heartbeats re-broadcast to peers and skip redundant DB lookups; socket singleton no longer disconnects on React remounts
- Profile timeline post action row: reaction trigger no longer overflows the card (`POST_MEDIA_BREAKOUT` removed from embedded action row)

### Plans
- `plans/08012026-31-chat-themes` — Completed (execution on `kylie/chat-themes`)
- `plans/07312026-30-default-message-stickers` — Completed (execution on `kylie/default-stickers`)
- `plans/07312026-29-reply-to-chat` — Completed (execution on `kylie/reply-to-chat`, PR #44 → `dev`)
- `plans/07312026-28-messages-status-icons` — Completed (execution on `kylie/message-status-icon`)
- `plans/07312026-27-messages-typing-indicator` — Completed (execution on `kylie/messages-typing-indicator`)

## 0.1.17 — 2026-07-31

### Added
- Profile page timeline: `GET /api/users/:username/posts`, cover photo migration, timeline auto-posts for avatar/cover updates
- Feed infinite scroll via cursor pagination (`useFeedPosts` + intersection observer)
- `PostCard`, `FeedComposer`, and `FeedEmptyState` for a polished feed experience
- Photo upload in feed composer with preview
- Comment section components with avatar headers, threaded replies, and photo attach
- Friends page search, unfriend flow, and polished inbox UI
- Messages UI polish: avatars, day grouping, reaction/unsend menus
- Notifications page polish: avatars, type icons, unread highlights

### Changed
- Profile page: Facebook-style header + post timeline; edit profile behind modal/menu
- Feed post cards: overflow delete menu, profile-activity badges, skeleton loaders, empty state
- Post detail reuses unified `PostCard`; comments composer at top with inline reply UX
- Friends, Messages, and Notifications aligned with Feed card patterns
- Messages: split inbox cards, unread styling, grouped bubbles with date separators, loading skeletons, Feed-style composer, reaction picker parity, unsend confirm dialog

### Plans
- `plans/07302026-27-profile-timeline` — Completed (execution on `kylie/profile-reorganized`)

## 0.1.15 — 2026-07-30

Squashed batch: PRs #19, #26, #27, #28.

### Added
- Reaction stickers 👍❤️😂😮 via shared `ReactionIcon` / `reactionOptions`; right-aligned reaction cluster with total count
- Socket.IO live message delivery (`message:new` / `message:unsent` / `message:reaction`, unread + conversation events)
- Messages inbox friend picker with icon-triggered search
- Facebook-style feed composer (`ProfileAvatar` + single-row mind/Post)
- Facebook-style post share (`POST /api/posts/:id/share`, nested embed, `shared_from_post_id`)

### Changed
- `PostActionRow`: comment + share in ReactionBar left slot; share handler on friends' originals only
- Messages: REST poll fallback when socket disconnected; mergeById on send/receive paths

### Plans
- `plans/07292026-20-reactions-changed-icon` — Completed
- `plans/07292026-24-reaction-summary-layout` — Completed
- `plans/07292026-22-messages-websockets` — Completed (interactive/deploy waivers)
- `plans/07292026-23-messages-friend-picker` — Completed
- `plans/07302026-25-feed-composer-avatar` — Completed
- `plans/07302026-26-share-button` — Completed


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
