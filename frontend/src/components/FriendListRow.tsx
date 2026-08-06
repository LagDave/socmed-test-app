import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { PublicUser } from "@/api/types";
import { FriendPresenceAvatar } from "@/components/FriendPresenceAvatar";

function profilePath(user: PublicUser): string {
  return `/u/${user.username || user.id}`;
}

type FriendListRowProps = {
  user: PublicUser;
  actions: ReactNode;
};

export function FriendListRow({ user, actions }: FriendListRowProps) {
  return (
    <li className="friends-row flex items-center justify-between gap-3 px-3 py-3 sm:py-3.5">
      <Link
        to={profilePath(user)}
        className="friends-row-link flex min-w-0 flex-1 items-center gap-3 p-1"
      >
        <FriendPresenceAvatar user={user} className="h-11 w-11 text-base" />
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold leading-snug">{user.displayName}</span>
          {user.username ? (
            <span className="block truncate text-sm text-muted-foreground">@{user.username}</span>
          ) : null}
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">{actions}</div>
    </li>
  );
}
