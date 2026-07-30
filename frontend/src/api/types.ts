export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export type ApiSuccess<T> = { success: true; data: T; error: null };
export type ApiError = {
  success: false;
  data: null;
  error: { code: string; message: string; details: unknown };
};

export type ReactionEmoji = "like" | "heart" | "haha" | "wow";

export type ReactionSummary = {
  counts: Record<ReactionEmoji, number>;
  viewerEmoji: ReactionEmoji | null;
};

export type PostView = {
  id: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  author: PublicUser;
  reactionSummary: ReactionSummary;
  sharedFromPostId: string | null;
  sharedFrom: PostView | null;
};

export type CommentView = {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  author: PublicUser;
  reactionSummary: ReactionSummary;
};

export type MessageView = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string | null;
  imageUrl: string | null;
  isUnsent: boolean;
  createdAt: string;
  reactionSummary: ReactionSummary;
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
  } | null;
  unreadCount: number;
  lastMessageAt: string | null;
};
