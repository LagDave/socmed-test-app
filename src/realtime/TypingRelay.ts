import { z } from "zod";
import type { Socket } from "socket.io";
import { ConversationModel } from "../models/ConversationModel";
import { logger } from "../logger";
import { emitToUser } from "./io";

export const TYPING_START = "typing:start";
export const TYPING_STOP = "typing:stop";
export const TYPING_UPDATE = "typing:update";

const TYPING_TTL_MS = 3000;

const typingPayloadSchema = z.object({
  conversationId: z.string().uuid(),
});

type TypingKey = `${string}:${string}`;

type TypingEntry = {
  timer: ReturnType<typeof setTimeout>;
  conversationId: string;
  typerId: string;
  peerUserId: string;
};

const activeTyping = new Map<TypingKey, TypingEntry>();

function typingKey(conversationId: string, userId: string): TypingKey {
  return `${conversationId}:${userId}`;
}

function peerId(
  conversation: { user_a: string; user_b: string },
  userId: string
): string {
  return conversation.user_a === userId ? conversation.user_b : conversation.user_a;
}

function isParticipant(
  conversation: { user_a: string; user_b: string },
  userId: string
): boolean {
  return conversation.user_a === userId || conversation.user_b === userId;
}

function relayTyping(
  conversationId: string,
  typerId: string,
  peerUserId: string,
  isTyping: boolean
): void {
  emitToUser(peerUserId, TYPING_UPDATE, {
    conversationId,
    userId: typerId,
    isTyping,
  });
}

function armTypingExpiry(
  key: TypingKey,
  conversationId: string,
  typerId: string,
  peerUserId: string
): void {
  const existing = activeTyping.get(key);
  if (existing) clearTimeout(existing.timer);

  const timer = setTimeout(() => {
    activeTyping.delete(key);
    relayTyping(conversationId, typerId, peerUserId, false);
  }, TYPING_TTL_MS);

  activeTyping.set(key, { timer, conversationId, typerId, peerUserId });
}

async function handleTypingStart(userId: string, conversationId: string): Promise<void> {
  const key = typingKey(conversationId, userId);
  const cached = activeTyping.get(key);

  if (cached) {
    armTypingExpiry(key, conversationId, userId, cached.peerUserId);
    relayTyping(conversationId, userId, cached.peerUserId, true);
    return;
  }

  const conversation = await ConversationModel.findById(conversationId);
  if (!conversation || !isParticipant(conversation, userId)) return;

  const peer = peerId(conversation, userId);
  armTypingExpiry(key, conversationId, userId, peer);
  relayTyping(conversationId, userId, peer, true);
}

function handleTypingStop(userId: string, conversationId: string): void {
  const key = typingKey(conversationId, userId);
  const cached = activeTyping.get(key);
  if (!cached) return;

  clearTimeout(cached.timer);
  activeTyping.delete(key);
  relayTyping(conversationId, userId, cached.peerUserId, false);
}

export function attachTypingHandlers(socket: Socket): void {
  const userId = socket.data.userId as string | undefined;
  if (!userId) return;

  socket.on(TYPING_START, (raw: unknown) => {
    const parsed = typingPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      logger.debug({ raw }, "typing:start ignored — invalid payload");
      return;
    }
    void handleTypingStart(userId, parsed.data.conversationId).catch((err) => {
      logger.error({ err, userId }, "typing:start handler failed");
    });
  });

  socket.on(TYPING_STOP, (raw: unknown) => {
    const parsed = typingPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      logger.debug({ raw }, "typing:stop ignored — invalid payload");
      return;
    }
    handleTypingStop(userId, parsed.data.conversationId);
  });
}
