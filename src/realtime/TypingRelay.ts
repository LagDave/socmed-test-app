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

const expiryTimers = new Map<TypingKey, ReturnType<typeof setTimeout>>();

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

function clearExpiryTimer(key: TypingKey): void {
  const timer = expiryTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    expiryTimers.delete(key);
  }
}

async function handleTypingStart(userId: string, conversationId: string): Promise<void> {
  const conversation = await ConversationModel.findById(conversationId);
  if (!conversation || !isParticipant(conversation, userId)) return;

  const peer = peerId(conversation, userId);
  const key = typingKey(conversationId, userId);
  const wasActive = expiryTimers.has(key);

  clearExpiryTimer(key);
  expiryTimers.set(
    key,
    setTimeout(() => {
      expiryTimers.delete(key);
      relayTyping(conversationId, userId, peer, false);
    }, TYPING_TTL_MS)
  );

  if (!wasActive) {
    relayTyping(conversationId, userId, peer, true);
  }
}

async function handleTypingStop(userId: string, conversationId: string): Promise<void> {
  const conversation = await ConversationModel.findById(conversationId);
  if (!conversation || !isParticipant(conversation, userId)) return;

  const peer = peerId(conversation, userId);
  const key = typingKey(conversationId, userId);
  if (!expiryTimers.has(key)) return;

  clearExpiryTimer(key);
  relayTyping(conversationId, userId, peer, false);
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
    void handleTypingStop(userId, parsed.data.conversationId).catch((err) => {
      logger.error({ err, userId }, "typing:stop handler failed");
    });
  });
}
