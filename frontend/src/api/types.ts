export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  createdAt: string;
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

export type ConversationListItem = {
  id: string;
  peer: PublicUser;
  lastMessage: {
    id: string;
    body: string | null;
    imageUrl: string | null;
    isUnsent: boolean;
    senderId: string;
    createdAt: string;
    replyToMessageId: string | null;
  } | null;
  unreadCount: number;
  lastMessageAt: string | null;
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
