export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  createdAt: string;
  isOnline?: boolean;
  lastActiveAt?: string | null;
};

export type ApiSuccess<T> = { success: true; data: T; error: null };
export type ApiError = {
  success: false;
  data: null;
  error: { code: string; message: string; details: unknown };
};

export type ReactionEmoji = "like" | "heart" | "haha" | "wow" | "sad" | "angry";

export type ReactionSummary = {
  counts: Record<ReactionEmoji, number>;
  viewerEmoji: ReactionEmoji | null;
};

export type PostImageView = {
  id: string;
  url: string;
  sortOrder: number;
  commentCount?: number;
  reactionSummary?: ReactionSummary;
};

export type ReactionEntry = {
  user: PublicUser;
  emoji: ReactionEmoji;
  createdAt: string;
};

export type PostView = {
  id: string;
  body: string;
  imageUrl: string | null;
  imageUrls: string[];
  images: PostImageView[];
  createdAt: string;
  author: PublicUser;
  reactionSummary: ReactionSummary;
  commentCount: number;
  shareCount: number;
  sharedFromPostId: string | null;
  sharedFrom: PostView | null;
};

export type CommentView = {
  id: string;
  postId: string;
  postImageId: string | null;
  parentId: string | null;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  author: PublicUser;
  reactionSummary: ReactionSummary;
};

export type MessageReplyToView = {
  id: string;
  senderId: string;
  senderDisplayName: string;
  body: string | null;
  imageUrl: string | null;
  isUnsent: boolean;
};

export type MessageView = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string | null;
  imageUrl: string | null;
  isUnsent: boolean;
  createdAt: string;
  editedAt: string | null;
  deliveredAt: string | null;
  reactionSummary: ReactionSummary;
  replyTo: MessageReplyToView | null;
};

export type ConversationSearchResponse = {
  messages: MessageView[];
  hasMore: boolean;
};

export type ConversationListLastReaction = {
  emoji: ReactionEmoji;
  reactorId: string;
  messageId: string;
  messageSenderId: string;
  messageBody: string | null;
  messageImageUrl: string | null;
  reactedAt: string;
};

export type ConversationListLastSystemLog = {
  id: string;
  text: string;
  createdAt: string;
  updatedBy: string;
};

export type ConversationListLastPinActivity = {
  actorDisplayName: string;
  action: "pinned" | "unpinned";
  createdAt: string;
};

export type ConversationListItem = {
  id: string;
  isPinned: boolean;
  peer: PublicUser;
  peerPresence: PeerPresence | null;
  lastMessage: {
    id: string;
    body: string | null;
    imageUrl: string | null;
    isUnsent: boolean;
    senderId: string;
    createdAt: string;
    replyToMessageId: string | null;
  } | null;
  lastReaction: ConversationListLastReaction | null;
  lastSystemLog: ConversationListLastSystemLog | null;
  lastPinActivity: ConversationListLastPinActivity | null;
  hasUnreadReaction: boolean;
  unreadCount: number;
  lastMessageAt: string | null;
};

export type PeerPresence = {
  isOnline: boolean;
  lastActiveAt: string | null;
};

export type PinnedMessageView = {
  messageId: string;
  body: string | null;
  imageUrl: string | null;
  senderId: string;
  senderDisplayName: string;
  senderAvatarUrl: string | null;
  createdAt: string;
  pinnedById: string;
  pinnedAt: string;
};

export type MessagePinActivityView = {
  id: string;
  messageId: string;
  actorId: string;
  actorDisplayName: string;
  action: "pinned" | "unpinned";
  createdAt: string;
};

export type ChatThemePreset = {
  kind: "preset";
  presetId: string;
};

export type ChatThemeSolid = {
  kind: "solid";
  background: string;
  bubbleMine: string;
  bubbleTheirs: string;
  accent: string;
};

export type ChatThemeGradient = {
  kind: "gradient";
  stops: [string, string];
  angle: number;
  bubbleMine: string;
  bubbleTheirs: string;
  accent: string;
};

export type ChatTheme = ChatThemePreset | ChatThemeSolid | ChatThemeGradient;

export type ConversationThemeView = {
  theme: ChatTheme | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type ThemeLogEntry = {
  id: string;
  text: string;
  createdAt: string;
  updatedBy: string;
};

export type ConversationThemeUpdateView = ConversationThemeView & {
  logEntry: ThemeLogEntry;
};
