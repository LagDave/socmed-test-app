import { logger } from "../logger";
import { ConversationModel } from "../models/ConversationModel";
import { FriendshipModel } from "../models/FriendshipModel";
import { UserModel } from "../models/UserModel";

export const PRESENCE_UPDATE = "presence:update";
export const FRIEND_PRESENCE_UPDATE = "presence:friend-update";
export const PRESENCE_DISCONNECT_GRACE_MS = 15_000;

export type PeerPresence = {
  isOnline: boolean;
  lastActiveAt: Date | null;
};

export type PresenceUpdatePayload = {
  userId: string;
  isOnline: boolean;
  lastActiveAt: string | null;
};

export type FriendPresenceUpdatePayload = {
  userId: string;
  isOnline: boolean;
  lastActiveAt: string | null;
};

type EmitToUser = (userId: string, event: string, payload: unknown) => void;

const socketIdsByUser = new Map<string, Set<string>>();
const pendingOfflineTimers = new Map<string, ReturnType<typeof setTimeout>>();
const presenceVersionsByUser = new Map<string, number>();
let latestPresenceVersion = 0;

function nextPresenceVersion(userId: string): number {
  latestPresenceVersion += 1;
  const version = latestPresenceVersion;
  presenceVersionsByUser.set(userId, version);
  return version;
}

export function isUserOnline(userId: string): boolean {
  return Boolean(socketIdsByUser.get(userId)?.size || pendingOfflineTimers.has(userId));
}

async function emitPresenceUpdates(
  userId: string,
  presence: PeerPresence,
  emitToUser: EmitToUser,
  expectedVersion: number
): Promise<void> {
  const [friendIds, conversationPeerIds] = await Promise.all([
    FriendshipModel.listAcceptedMutualIds(userId),
    ConversationModel.listPeerUserIds(userId),
  ]);
  if (presenceVersionsByUser.get(userId) !== expectedVersion) return;

  const friendIdsSet = new Set(friendIds);
  const friendPayload: FriendPresenceUpdatePayload = {
    userId,
    isOnline: presence.isOnline,
    lastActiveAt: presence.lastActiveAt?.toISOString() ?? null,
  };
  for (const friendId of friendIds) {
    emitToUser(friendId, FRIEND_PRESENCE_UPDATE, friendPayload);
  }

  const conversationPayload: PresenceUpdatePayload = {
    userId,
    isOnline: presence.isOnline,
    lastActiveAt: presence.lastActiveAt?.toISOString() ?? null,
  };
  for (const peerId of conversationPeerIds) {
    if (friendIdsSet.has(peerId)) {
      emitToUser(peerId, PRESENCE_UPDATE, conversationPayload);
    }
  }
  if (!presence.isOnline && !isUserOnline(userId)) {
    presenceVersionsByUser.delete(userId);
  }
}

async function finalizeOffline(
  userId: string,
  timer: ReturnType<typeof setTimeout>,
  emitToUser: EmitToUser
): Promise<void> {
  if (pendingOfflineTimers.get(userId) !== timer || socketIdsByUser.has(userId)) return;
  pendingOfflineTimers.delete(userId);

  const lastActiveAt = new Date();
  const version = nextPresenceVersion(userId);
  await UserModel.updateLastActiveAt(userId, lastActiveAt);
  await emitPresenceUpdates(userId, { isOnline: false, lastActiveAt }, emitToUser, version);
}

function armOfflineTimer(userId: string, emitToUser: EmitToUser): void {
  let timer: ReturnType<typeof setTimeout>;
  timer = setTimeout(() => {
    void finalizeOffline(userId, timer, emitToUser).catch((err) => {
      logger.error({ err, userId }, "Presence offline transition failed");
    });
  }, PRESENCE_DISCONNECT_GRACE_MS);
  pendingOfflineTimers.set(userId, timer);
}

export function peerPresenceForUser(userId: string, lastActiveAt: Date | null): PeerPresence {
  if (isUserOnline(userId)) {
    return { isOnline: true, lastActiveAt: null };
  }
  return { isOnline: false, lastActiveAt };
}

export async function markUserPresenceConnected(
  userId: string,
  socketId: string,
  emitToUser: EmitToUser
): Promise<void> {
  const wasOnline = isUserOnline(userId);
  const pendingTimer = pendingOfflineTimers.get(userId);
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingOfflineTimers.delete(userId);
  }

  const socketIds = socketIdsByUser.get(userId) ?? new Set<string>();
  socketIds.add(socketId);
  socketIdsByUser.set(userId, socketIds);

  if (!wasOnline) {
    const version = nextPresenceVersion(userId);
    await emitPresenceUpdates(userId, { isOnline: true, lastActiveAt: null }, emitToUser, version);
  }
}

export function markUserPresenceDisconnected(
  userId: string,
  socketId: string,
  emitToUser: EmitToUser
): void {
  const socketIds = socketIdsByUser.get(userId);
  if (!socketIds || !socketIds.delete(socketId)) return;
  if (socketIds.size > 0) return;

  socketIdsByUser.delete(userId);
  if (!pendingOfflineTimers.has(userId)) {
    armOfflineTimer(userId, emitToUser);
  }
}
