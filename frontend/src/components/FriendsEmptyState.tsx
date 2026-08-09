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
    <div className="friends-empty-state">
      <span className="friends-empty-state-icon">
        <Icon className="h-5 w-5 text-muted-foreground/80" aria-hidden="true" strokeWidth={1.25} />
      </span>
      <div className="friends-empty-state-copy">
        <p className="friends-empty-state-title">{title}</p>
        <p className="friends-empty-state-description">{description}</p>
      </div>
      {action ? <div className="friends-empty-state-action">{action}</div> : null}
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
    <div className="feed-card overflow-hidden shadow-sm" aria-hidden="true">
      <div className="friends-add-strip">
        <div className="feed-skeleton h-11 w-full rounded-full" />
      </div>
      <div>
        <div className="friends-section-header">
          <div className="feed-skeleton h-3 w-24 rounded-md" />
        </div>
        <ul className="friends-section-body divide-y divide-border/60">
          {Array.from({ length: 2 }, (_, i) => (
            <FriendsRowSkeleton key={i} />
          ))}
        </ul>
      </div>
      <div className="friends-section-divider">
        <div className="friends-section-header">
          <div className="feed-skeleton h-3 w-16 rounded-md" />
        </div>
        <ul className="friends-section-body divide-y divide-border/60">
          {Array.from({ length: 4 }, (_, i) => (
            <FriendsRowSkeleton key={i} />
          ))}
        </ul>
      </div>
    </div>
  );
}
