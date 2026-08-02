import { Home, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function FeedWelcomeCard() {
  return (
    <div className="feed-card px-6 py-10 text-center">
      <div className="feed-state-icon mx-auto">
        <Home className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Welcome to SocMed</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Sign in to see posts from you and your friends.
      </p>
      <Button asChild className="mt-6">
        <Link to="/login">Sign in</Link>
      </Button>
    </div>
  );
}

export function FeedEmptyState() {
  return (
    <div className="feed-card px-6 py-10 text-center">
      <div className="feed-state-icon mx-auto">
        <Sparkles className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold tracking-tight">Your feed is quiet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Posts from you and your friends will show up here. Share something above, or find people to connect with.
      </p>
      <Button asChild variant="outline" size="sm" className="mt-5 gap-1.5">
        <Link to="/friends">
          <Users className="h-4 w-4" aria-hidden="true" />
          Find friends
        </Link>
      </Button>
    </div>
  );
}

export function FeedPostSkeleton() {
  return (
    <div className="feed-card overflow-hidden px-4 py-4" aria-hidden="true">
      <div className="flex gap-3">
        <div className="feed-skeleton h-10 w-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-2">
            <div className="feed-skeleton h-4 w-36 rounded-md" />
            <div className="feed-skeleton h-3 w-20 rounded-md" />
          </div>
          <div className="space-y-2 pt-1">
            <div className="feed-skeleton h-3 w-full rounded-md" />
            <div className="feed-skeleton h-3 w-[92%] rounded-md" />
            <div className="feed-skeleton h-3 w-[70%] rounded-md" />
          </div>
          <div className="feed-skeleton mt-1 h-36 w-full rounded-none" />
          <div className="feed-skeleton h-9 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
