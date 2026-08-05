import { useContext } from "react";
import { FriendPresenceContext } from "@/contexts/FriendPresenceContext";

export function useFriendOnline(
  userId: string,
  initiallyOnline: boolean | undefined,
  canViewPresence: boolean
): boolean {
  const context = useContext(FriendPresenceContext);
  if (!context) throw new Error("useFriendOnline requires FriendPresenceProvider");
  if (!canViewPresence) return false;
  return context.presenceByUserId.get(userId)?.isOnline ?? Boolean(initiallyOnline);
}
