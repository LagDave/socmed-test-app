import { api } from "@/api/client";
import type { FriendSuggestion, PublicUser } from "@/api/types";

export type FriendInboxItem = {
  id: string;
  status: string;
  user: PublicUser;
};

export type FriendsInbox = {
  incoming: FriendInboxItem[];
  outgoing: FriendInboxItem[];
};

export function getFriendsInbox(): Promise<FriendsInbox> {
  return api.get("/api/friends/inbox");
}

export function getMutualFriends(): Promise<{ users: PublicUser[] }> {
  return api.get("/api/friends/mutuals");
}

export function getFriendSuggestions(): Promise<{ users: FriendSuggestion[] }> {
  return api.get("/api/friends/suggestions");
}

export function sendFriendRequest(username: string): Promise<void> {
  return api.post("/api/friends/request", { username });
}

export function acceptFriendRequest(friendshipId: string): Promise<void> {
  return api.post(`/api/friends/${friendshipId}/accept`);
}

export function declineFriendRequest(friendshipId: string): Promise<void> {
  return api.post(`/api/friends/${friendshipId}/decline`);
}

export function cancelFriendRequest(friendshipId: string): Promise<void> {
  return api.delete(`/api/friends/${friendshipId}`);
}

export function removeFriend(userId: string): Promise<void> {
  return api.delete(`/api/friends/user/${userId}`);
}
