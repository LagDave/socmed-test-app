import type { PeerPresence } from "@/api/types";
import { formatCompactRelativeTime } from "@/lib/formatRelativeTime";

export type PeerPresenceLabelStyle = "active" | "last-active";

export function peerPresenceLabel(
  presence: PeerPresence,
  style: PeerPresenceLabelStyle = "last-active"
): string {
  if (presence.isOnline) return "Active now";
  const prefix = style === "active" ? "Active" : "Last active";
  if (!presence.lastActiveAt) return `${prefix} recently`;
  return `${prefix} ${formatCompactRelativeTime(presence.lastActiveAt)}`;
}
