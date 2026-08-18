import type { ReactNode } from "react";
import { User, UserPlus, Users } from "lucide-react";

type FriendsEmptyStateProps = {
  icon?: "user" | "users" | "request";
  title: string;
  description: string;
  action?: ReactNode;
};

const ICONS = {
  user: User,
  users: Users,
  request: UserPlus,
} as const;

export function FriendsEmptyState({
  icon = "user",
  title,
  description,
  action,
}: FriendsEmptyStateProps) {
  const Icon = ICONS[icon];
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span className="flex size-16 items-center justify-center rounded-full border border-border/60 bg-secondary/80 shadow-sm">
        <Icon className="size-7 text-muted-foreground/80" aria-hidden="true" strokeWidth={1.25} />
      </span>
      <div className="space-y-1.5">
        <p className="text-base font-semibold tracking-tight">{title}</p>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function FriendsRowSkeleton() {
  return (
    <li className="friends-row flex items-center justify-between gap-3 px-3 py-3.5 sm:py-4" aria-hidden="true">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="feed-skeleton h-11 w-11 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="feed-skeleton h-4 w-36 rounded-md" />
          <div className="feed-skeleton h-3 w-24 rounded-md" />
        </div>
      </div>
      <div className="feed-skeleton h-9 w-20 shrink-0 rounded-full" />
    </li>
  );
}

export function FriendsDashboardSkeleton() {
  return (
    <div className="friends-dashboard-skeleton" aria-hidden="true">
      <div className="flex items-center justify-between gap-4 border-b border-border px-1 pb-3">
        <div className="flex gap-5">
          <div className="feed-skeleton h-5 w-16 rounded-md" />
          <div className="feed-skeleton h-5 w-20 rounded-md" />
          <div className="feed-skeleton h-5 w-20 rounded-md" />
        </div>
        <div className="feed-skeleton h-5 w-24 rounded-md" />
      </div>
      <div className="friends-content-section" aria-hidden="true">
        <div className="feed-skeleton h-5 w-28 rounded-md" />
        <ul className="friends-list mt-4">
          {Array.from({ length: 2 }, (_, i) => (
            <FriendsRowSkeleton key={i} />
          ))}
        </ul>
      </div>
    </div>
  );
}
