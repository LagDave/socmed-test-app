import type { PublicUser } from "@/api/types";
import { OnlinePresenceIndicator } from "@/components/OnlinePresenceIndicator";
import { ProfileAvatar, type ProfileAvatarSize } from "@/components/ProfileAvatar";
import { useFriendOnline } from "@/hooks/useFriendOnline";

export function FriendPresenceAvatar({
  user,
  size = "sm",
  className,
  canViewPresence = user.isOnline !== undefined,
}: {
  user: Pick<PublicUser, "id" | "displayName" | "avatarUrl" | "isOnline">;
  size?: ProfileAvatarSize;
  className?: string;
  canViewPresence?: boolean;
}) {
  const isOnline = useFriendOnline(user.id, user.isOnline, canViewPresence);

  return (
    <span className="relative shrink-0">
      <ProfileAvatar
        displayName={user.displayName}
        avatarUrl={user.avatarUrl}
        size={size}
        className={className}
      />
      {isOnline && <OnlinePresenceIndicator className="bottom-0 right-0" />}
    </span>
  );
}
