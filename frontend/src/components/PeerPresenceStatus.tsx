import type { PeerPresence } from "@/api/types";
import { peerPresenceLabel, type PeerPresenceLabelStyle } from "@/lib/peerPresence";
import { cn } from "@/lib/utils";

export function PeerPresenceStatus({
  presence,
  labelStyle,
  className,
}: {
  presence: PeerPresence;
  labelStyle?: PeerPresenceLabelStyle;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 text-xs",
        presence.isOnline ? "font-medium text-foreground/80" : "text-muted-foreground",
        className
      )}
      role="status"
    >
      {peerPresenceLabel(presence, labelStyle)}
    </span>
  );
}
