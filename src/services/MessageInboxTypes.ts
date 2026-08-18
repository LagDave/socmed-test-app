import type { PublicUser } from "../types/user";
import type { ReactionEmoji } from "../models/ReactionModel";
import type { PeerPresence } from "../realtime/PresenceRealtime";

export type ConversationListLastReaction = {
  emoji: ReactionEmoji;
  reactorId: string;
  messageId: string;
  messageSenderId: string;
  messageBody: string | null;
  messageImageUrl: string | null;
  reactedAt: Date;
};

export type ConversationListLastSystemLog = {
  id: string;
  text: string;
  createdAt: Date;
  updatedBy: string;
};

export type ConversationListLastPinActivity = {
  actorDisplayName: string;
  action: "pinned" | "unpinned";
  createdAt: Date;
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
    createdAt: Date;
    replyToMessageId: string | null;
  } | null;
  lastReaction: ConversationListLastReaction | null;
  lastSystemLog: ConversationListLastSystemLog | null;
  lastPinActivity: ConversationListLastPinActivity | null;
  hasUnreadReaction: boolean;
  unreadCount: number;
  lastMessageAt: Date | null;
};
