import { FriendshipModel } from "../models/FriendshipModel";
import { UserModel } from "../models/UserModel";
import { AppError } from "../utils/AppError";
import { toPublicUser, type PublicUser } from "../types/user";

export class FriendshipService {
  static async request(userId: string, targetUsername: string) {
    const target = await UserModel.findByUsername(targetUsername);
    if (!target) throw new AppError("USER_NOT_FOUND", "User not found.");
    if (target.id === userId) throw new AppError("FRIEND_VALIDATION", "Cannot friend yourself.");
    const existing = await FriendshipModel.findPair(userId, target.id);
    if (existing) {
      if (existing.status === "accepted") throw new AppError("FRIEND_CONFLICT", "Already friends.");
      if (existing.status === "pending") throw new AppError("FRIEND_CONFLICT", "Request already pending.");
      await FriendshipModel.deleteById(existing.id);
    }
    const row = await FriendshipModel.createPending(userId, target.id);
    return { id: row.id, status: row.status, user: toPublicUser(target) };
  }

  static async accept(userId: string, friendshipId: string) {
    const rows = await FriendshipModel.listIncoming(userId);
    const row = rows.find((r) => r.id === friendshipId);
    if (!row) throw new AppError("FRIEND_NOT_FOUND", "Incoming request not found.");
    const updated = await FriendshipModel.updateStatus(friendshipId, "accepted");
    return updated;
  }

  static async decline(userId: string, friendshipId: string) {
    const rows = await FriendshipModel.listIncoming(userId);
    const row = rows.find((r) => r.id === friendshipId);
    if (!row) throw new AppError("FRIEND_NOT_FOUND", "Incoming request not found.");
    const updated = await FriendshipModel.updateStatus(friendshipId, "declined");
    return updated;
  }

  static async cancel(userId: string, friendshipId: string) {
    const rows = await FriendshipModel.listOutgoing(userId);
    const row = rows.find((r) => r.id === friendshipId);
    if (!row) throw new AppError("FRIEND_NOT_FOUND", "Outgoing request not found.");
    await FriendshipModel.deleteById(friendshipId);
  }

  static async mutuals(userId: string): Promise<PublicUser[]> {
    const ids = await FriendshipModel.listAcceptedMutualIds(userId);
    const users = await Promise.all(ids.map((id) => UserModel.findById(id)));
    return users.filter(Boolean).map((u) => toPublicUser(u!));
  }

  static async inbox(userId: string) {
    const incoming = await FriendshipModel.listIncoming(userId);
    const outgoing = await FriendshipModel.listOutgoing(userId);
    const hydrate = async (rows: typeof incoming) =>
      Promise.all(
        rows.map(async (r) => {
          const otherId = r.requester_id === userId ? (r.user_a === userId ? r.user_b : r.user_a) : r.requester_id;
          // For incoming: show requester; for outgoing show the other party
          const other =
            r.requester_id === userId
              ? await UserModel.findById(r.user_a === userId ? r.user_b : r.user_a)
              : await UserModel.findById(r.requester_id);
          if (!other) throw new AppError("USER_NOT_FOUND", "Friend user missing.");
          return { id: r.id, status: r.status, user: toPublicUser(other), otherId };
        })
      );
    return {
      incoming: await hydrate(incoming),
      outgoing: await hydrate(outgoing),
    };
  }
}
