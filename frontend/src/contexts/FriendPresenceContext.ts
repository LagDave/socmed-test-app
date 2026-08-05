import { createContext } from "react";
import type { PeerPresence } from "@/api/types";

export type FriendPresenceState = {
  presenceByUserId: ReadonlyMap<string, PeerPresence>;
};

export const FriendPresenceContext = createContext<FriendPresenceState | null>(null);
