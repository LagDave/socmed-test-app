import type { PublicUser } from "@/api/types";
import { useFriendPresence } from "@/hooks/useFriendPresence";
import { formatCompactElapsedTime } from "@/lib/formatRelativeTime";

export function ProfileHeaderPresence({ user }: { user: PublicUser }) {
  const canViewPresence = user.isOnline !== undefined;
  const presence = useFriendPresence(
    user.id,
    canViewPresence
      ? { isOnline: user.isOnline ?? false, lastActiveAt: user.lastActiveAt ?? null }
      : null,
    canViewPresence
  );

  if (!presence || presence.isOnline || !presence.lastActiveAt) return null;

  return (
    <span
      className="absolute bottom-[calc(5%+0.75rem)] right-[calc(5%+0.75rem)] z-10 translate-x-1/2 translate-y-1/2 rounded-full border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold leading-none text-muted-foreground shadow-sm"
      role="status"
    >
      {formatCompactElapsedTime(presence.lastActiveAt)}
    </span>
  );
}
