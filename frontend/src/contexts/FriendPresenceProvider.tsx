import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  FRIEND_PRESENCE_UPDATE,
  getMessagesSocket,
  type FriendPresenceUpdatePayload,
} from "@/api/socket";
import type { PeerPresence } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { FriendPresenceContext } from "@/contexts/FriendPresenceContext";

export function FriendPresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [presenceByUserId, setPresenceByUserId] = useState<ReadonlyMap<string, PeerPresence>>(new Map());

  useEffect(() => {
    if (!user) {
      setPresenceByUserId(new Map());
      return;
    }

    const socket = getMessagesSocket();
    const onFriendPresenceUpdate = (payload: FriendPresenceUpdatePayload) => {
      setPresenceByUserId((previous) => {
        const next = new Map(previous);
        next.set(payload.userId, {
          isOnline: payload.isOnline,
          lastActiveAt: payload.lastActiveAt,
        });
        return next;
      });
    };
    socket.on(FRIEND_PRESENCE_UPDATE, onFriendPresenceUpdate);
    return () => {
      socket.off(FRIEND_PRESENCE_UPDATE, onFriendPresenceUpdate);
    };
  }, [user]);

  const value = useMemo(() => ({ presenceByUserId }), [presenceByUserId]);
  return <FriendPresenceContext.Provider value={value}>{children}</FriendPresenceContext.Provider>;
}
