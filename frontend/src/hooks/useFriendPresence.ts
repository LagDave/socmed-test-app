import { useContext } from "react";
import type { PeerPresence } from "@/api/types";
import { FriendPresenceContext } from "@/contexts/FriendPresenceContext";

export function useFriendPresence(
  userId: string,
  initialPresence: PeerPresence | null,
  canViewPresence: boolean
): PeerPresence | null {
  const context = useContext(FriendPresenceContext);
  if (!context) throw new Error("useFriendPresence requires FriendPresenceProvider");
  if (!canViewPresence) return null;
  return context.presenceByUserId.get(userId) ?? initialPresence;
}
