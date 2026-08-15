import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { PublicUser } from "@/api/types";
import { FriendPresenceAvatar } from "@/components/FriendPresenceAvatar";
import { useFriendOnline } from "@/hooks/useFriendOnline";

type FriendListUser = Pick<PublicUser, "id" | "displayName" | "username" | "avatarUrl" | "isOnline">;

function profilePath(user: FriendListUser): string {
  return `/u/${user.username || user.id}`;
}

type FriendListRowProps = {
  user: FriendListUser;
  actions: ReactNode;
  subtext?: ReactNode;
};

export function FriendListRow({ user, actions, subtext }: FriendListRowProps) {
  const isOnline = useFriendOnline(user.id, user.isOnline, user.isOnline !== undefined);
  const hasMeta = user.username || subtext || isOnline;

  return (
    <li className="friends-row flex items-center justify-between gap-3 px-3 py-3 sm:py-3.5">
      <Link
        to={profilePath(user)}
        className="friends-row-link flex min-w-0 flex-1 items-center gap-3 p-1"
      >
        <FriendPresenceAvatar user={user} className="h-11 w-11 text-base" />
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold leading-snug">{user.displayName}</span>
          {hasMeta ? (
            <span className="block truncate text-sm text-muted-foreground">
              {user.username ? `@${user.username}` : null}
              {subtext ? <>{user.username ? " · " : null}{subtext}</> : null}
              {isOnline ? <>{user.username || subtext ? " · " : null}Active now</> : null}
            </span>
          ) : null}
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">{actions}</div>
    </li>
  );
}
