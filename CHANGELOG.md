# Changelog

## 0.1.38 — 2026-08-07

### Changed
- Removed visible `@username` labels from posts, shares, comments, reactions, friends, messages, profile, and navbar surfaces while preserving display names and username-based identity behavior
- Restored compact relative timestamps globally: `now`, `8min`, `4hr`, `2d`, `3w`, `5mo`, and `1yr`, with clear future-time output
- Moved comment and reply timestamps beside the author name while preserving absolute hover timestamps and Like/Reply controls

### Plans
- `plans/08072026-remove-visible-usernames` — completed on `kylie/simplify-identity-ui`
- `plans/08072026-compact-relative-timestamps` — completed on `kylie/compact-relative-timestamps`

## 0.1.37 — 2026-08-06

### Added
- Personal inbox profile priority: unlimited pinned chats remain at the top in first-pinned-first order
- Inbox-row Pin profile / Unpin profile action and compact neutral pin marker

### Plans
- `plans/08062026-49-pin-profile-priority` — executed on `kylie/pin-profile`

## 0.1.36 — 2026-08-06

### Changed
- Continued chat history toward newer messages after selecting an older search result, without breaking older-history loading
- Hid the visual scrollbar in the chat pane while preserving scrolling and automatic pagination

### Plans
- `plans/08062026-remove-load-earlier-button` — completed on `kylie/remove-load-earlier-button`

## 0.1.35 — 2026-08-06

### Changed
- Replaced the chat “Load earlier messages” button with automatic top-of-thread history loading
- Tightened incoming message spacing and added readable, sender-independent time-gap timestamps in themed chats

### Plans
- `plans/08062026-remove-load-earlier-button` — completed on `kylie/remove-load-earlier-button`

## 0.1.34 — 2026-08-06

### Changed
- Rebuilt the avatar dropdown as an identity-led account panel with a single profile link, optional username, clear next-theme mode action, and a visually distinct logout row
- Scoped account-menu styling to navbar chrome; existing Profile page dropdowns are unchanged

### Plans
- `plans/08062026-49-profile-menu-ui` — completed on `kylie/profile-menu-ui`

## 0.1.33 — 2026-08-05

### Changed
- Moved Messages navigation into the centered primary pill between Feed and Friends; unread badge and active-state behavior preserved

### Plans
- `plans/08012026-35-navbar-upgrade` — integrated from `kylie/navbar-update`

## 0.1.32 — 2026-08-05

### Added
- Realtime activity notification sounds over Socket.IO (`notification:new`, `notifications:count`)
- Dedicated activity sound library (Digital + Tone groups) separate from message sounds
- `useActivityNotificationSound` hook with suppress-on-`/notifications` and cross-tab dedupe
- Activity sound picker in Message Settings; `scripts/generate-activity-sounds.mjs` for bundled WAV assets

### Changed
- Activity sounds play at 50% volume; message sounds unchanged
- `NotificationSoundsSettings` splits message and activity pickers with preview
- Notifications page: removed soft dashboard shell (gray canvas, gradient hero card); kept Activity header, Recent count, and row polish

### Plans
- `plans/08032026-45-activity-notification-sounds` — integrated from `kylie/notification-sound`

## 0.1.31 — 2026-08-05

### Added
- Message settings page at `/messages/settings` with icon-only chrome (back + settings icons)
- Inbox gear entry to message settings from `/messages`

### Changed
- Moved notification sound picker from Account Settings to Message settings
- Account Settings now shows only Privacy, Security, and More settings stubs

### Plans
- `plans/08032026-42-message-settings-sound-move` — integrated from `kylie/message-account-settings`

## 0.1.30 — 2026-08-03

### Changed
- Thread header polish: gradient wash, accent avatar ring, grouped action pill
- Theme picker color strips: more padding and scroll inset so swatches aren’t edge-flush
- Inbox previews show latest system logs (e.g. theme changes) for both participants
- Seen indicator aligned to bubble right edge; congrats word effect rises like other overlays

### Plans
- `kylie/chat-ui-improvements` — follow-up UI polish on messenger branch

## 0.1.29 — 2026-08-03

### Added
- Message inbox reaction previews with unread styling until the thread is opened
- Chat theme change system logs visible to both participants (persisted `theme_log` jsonb)
- Image lightbox (`ViewChatImageDialog`) for full-size chat photos
- Always-visible reaction badge on message bubble corner; toolbar order More → Reply → React

### Changed
- Messenger bubble layout: tighter padding, pill shape, grouped spacing, image-only messages without bubble chrome
- Themed chat chrome: header, composer, typing indicator, day separators, and error banner contrast
- Reply quote strip uses bubble foreground colors on themed chats
- Seen indicator sits below latest own message and offsets when a reaction badge is present
- Theme picker fix: jsonb cast for `theme_log` updates; realtime inbox refresh on reactions

### Plans
- `kylie/chat-ui-improvements` — messenger UI polish, theme logs, inbox reactions

## 0.1.28 — 2026-08-03

### Added
- Multi-photo feed posts (up to 10 images) with carousel on feed, detail, profile, and share embeds
- `post_images` table with per-photo comments, reactions, and dedicated photo comment page
- Per-photo reaction list via shared `ReactionsListPopover`; `comment_on_photo` notifications

### Changed
- Cut over from `posts.image_urls` jsonb to `post_images` as source of truth
- `PostModel.create` owns post + child image rows in one transaction (§7.4)
- Merged `dev` (#54–#56): share caption composer, comment bubble UI, notifications soft shell

### Plans
- `plans/08022026-41-multi-photo-carousel` — merged with share + comments UI on `kylie/post-photo-feature`

## 0.1.27 — 2026-08-03

### Added
- Share post composer dialog with optional caption before resharing to feed
- `SharePostDialog`, `ShareAttribution`, and `ShareSuccessNotice` components
- Share API caption support via `POST /api/posts/:id/share` `{ body? }`

### Changed
- Share button UI: pill action buttons, polished nested embed, and attribution links
- Feed and post detail open share composer instead of one-click reshare
- Shared post embeds and share preview support multi-photo originals

### Plans
- `plans/08032026-41-share-button-ui` — executed on `kylie/share-button-ui`

## 0.1.26 — 2026-08-03

### Changed
- Comment section UI: Facebook-style bubble cards with author name inside, meta row (reactions + timestamp), and clearer reply thread rail
- Comment composer: pill input shell, icon-only send when collapsed, moved to bottom of comments section
- Section header: icon + count only (no "Comments" heading)

### Plans
- `plans/08012026-40-comment-section-ui` — executed on `kylie/comment-section-ui`

## 0.1.25 — 2026-08-03

### Changed
- Notifications page: soft dashboard shell (canvas plate, hero header card, separate list card) while preserving row polish (avatars, type pills, skeletons, nested post links)
- Notifications unread UX: soft outline New badge; removed heavy left edge bar

### Plans
- `plans/08022026-39-notifications-ui-upgrade` — Completed (execution on `kylie/notifications-ui-upgrade`)

## 0.1.24 — 2026-08-03

### Changed
- Messages inbox: unified dashboard card with muted compose panel, unread header badge, and Notifications-style conversation rows (preview-only snippet, chevron, unread ring)
- Messages compose: horizontal avatar strip for friends without existing threads; search pill when all friends already have conversations
- Messages thread: tinted message pane, elevated composer bar, grouped bubble radii, incoming bubble card styling layered on chat themes, reply, edit, status icons, and typing
- Messages page enter animation (`.messages-page`) and scoped CSS tokens; swipe-delete and delete-menu preserved on inbox rows

### Plans
- `plans/08012026-38-messages-ui-upgrade` — Completed (execution on `kylie/messages-ui-upgrade`, PR #53 → `dev`)

## 0.1.23 — 2026-08-03

### Changed
- Friends page UI upgrade: unified dashboard card on a soft page canvas, pill-style add-friend input, stat chips, section eyebrow headers, row hover polish, and richer empty states
- Friends list rows: two-line name/username layout, outlined message button, preserved search/message/unfriend flows

### Plans
- `plans/08012026-37-friends-ui-upgrade` — Completed (execution on `kylie/friends-ui-upgrade`)

## 0.1.22 — 2026-08-03

### Added
- Multi-photo posts: `image_urls` jsonb column, backend support for up to 10 attachments, composer multi-select with preview grid

### Changed
- Feed UI polish: unified composer track (avatar + pill + Post in one row), expanded composer field
- Post media on feed and detail: centered inset galleries (1–4+ layouts) instead of full-bleed edge-to-edge images
- Feed composer: photo picker UX fixes (label-based file input, blur-safe expand/collapse)
- Labeled Comment/Share actions at desktop breakpoints; profile timeline unchanged
- Feed empty/welcome states, error alerts, and caught-up divider styling

### Fixed
- Post detail "Something went wrong" when creating posts with photos — jsonb insert now serializes `image_urls` correctly

### Plans
- `plans/08012026-36-feed-ui-upgrade` — Completed (Rev 5: multi-photo + centered media follow-up on `kylie/feed-ui-upgrade`)

## 0.1.21 — 2026-08-03

### Changed
- Navbar visual polish: “SocMed” wordmark, Facebook-style center pill cluster, refined action icons, avatar profile trigger, profile-dropdown menu styling, shared `.app-navbar-*` CSS tokens

### Plans
- `plans/08012026-35-navbar-upgrade` — Completed (execution on `kylie/navbar-upgrade`)

## 0.1.20 — 2026-08-03

### Added
- Message notification sounds: 14 selectable tones in Account Settings, localStorage prefs, mute toggle
- Inbound `message:new` sound when off-thread (Feed, Profile, inbox list, other threads); suppressed on the open conversation thread; never for own messages
- Autoplay unlock on sign-in, register, and first click; cross-tab dedupe for duplicate socket delivery

### Plans
- `plans/08012026-34-message-notification-sounds` — Completed (execution on `kylie/message-notification-features`)

## 0.1.19 — 2026-08-03

### Added
- Delete conversation for you only: hides thread from inbox, marks existing messages deleted for the deleter via `message_user_deletions`, peer history unchanged
- `DELETE /api/messages/conversations/:id` with confirm dialog on inbox (⋯ menu + swipe-left) and thread header
- Swipeable inbox rows with iOS-style red delete strip (trash icon + label)
- Inbound message or explicit re-open restores hidden thread to inbox; deleted messages stay filtered for deleter

### Changed
- Messages inbox: rounded conversation cards with spacing; unread badge excludes hidden threads and user-deleted messages
- Thread load uses `?restore=1` to clear hide on intentional open; polls omit restore

### Plans
- `plans/08012026-33-message-delete-conversation` — Completed (execution on `kylie/message-delete-conversation`)

## 0.1.18 — 2026-08-02

### Added
- Edit message: sender can fix typos from the ellipsis menu on own text messages
- `PATCH /api/messages/messages/:id` with `edited_at` column and `message:edited` socket event
- Messenger-style edit UX: message text loads into the bottom compose bar; Enter/send saves, Escape/Cancel exits
- Shared `MessageComposeBar` component for send and edit compose rows
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
- Restored missing idempotent Knex migrations (reply-to, delivered_at, chat themes) so `npm run migrate` runs cleanly on local DBs with parallel feature work
- Edit save 500 when `edited_at` column was missing before migration applied
- Typing indicator reliability: server heartbeats re-broadcast to peers and skip redundant DB lookups; socket singleton no longer disconnects on React remounts
- Profile timeline post action row: reaction trigger no longer overflows the card (`POST_MEDIA_BREAKOUT` removed from embedded action row)

### Plans
- `plans/08012026-32-edit-message` — Completed (execution on `kylie/edit-message`)
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
