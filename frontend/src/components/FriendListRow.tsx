import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { PublicUser } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";

function profilePath(user: PublicUser): string {
  return `/u/${user.username || user.id}`;
}

type FriendListRowProps = {
  user: PublicUser;
  actions: ReactNode;
};

export function FriendListRow({ user, actions }: FriendListRowProps) {
  return (
    <li className="flex items-center justify-between gap-3 py-3 transition-colors first:pt-0 last:pb-0">
      <Link
        to={profilePath(user)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-offset-2 hover:bg-accent/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ProfileAvatar displayName={user.displayName} avatarUrl={user.avatarUrl} size="sm" />
        <span className="min-w-0 truncate">
          <span className="font-semibold">{user.displayName}</span>
          {user.username ? (
            <span className="font-normal text-muted-foreground">{` @${user.username}`}</span>
          ) : null}
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    </li>
  );
}
