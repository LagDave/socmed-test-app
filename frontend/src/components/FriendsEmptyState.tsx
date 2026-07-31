import type { ReactNode } from "react";
import { User, UserPlus, Users } from "lucide-react";

type FriendsEmptyStateProps = {
  icon?: "user" | "users" | "request";
  message: string;
  action?: ReactNode;
};

const ICONS = {
  user: User,
  users: Users,
  request: UserPlus,
} as const;

export function FriendsEmptyState({ icon = "user", message, action }: FriendsEmptyStateProps) {
  const Icon = ICONS[icon];
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <Icon className="size-5 text-muted-foreground/70" aria-hidden="true" strokeWidth={1.5} />
      </div>
      <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}

export function FriendsRowSkeleton() {
  return (
    <li className="flex items-center justify-between gap-3 py-3" aria-hidden="true">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="feed-skeleton h-10 w-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="feed-skeleton h-4 w-36 rounded-md" />
          <div className="feed-skeleton h-3 w-24 rounded-md" />
        </div>
      </div>
      <div className="feed-skeleton h-8 w-20 shrink-0 rounded-md" />
    </li>
  );
}

export function FriendsSectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="feed-card p-4">
      <div className="feed-skeleton h-4 w-28 rounded-md" />
      <ul className="mt-3 divide-y divide-border">
        {Array.from({ length: rows }, (_, i) => (
          <FriendsRowSkeleton key={i} />
        ))}
      </ul>
    </div>
  );
}
