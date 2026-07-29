import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { PublicUser } from "@/api/types";
import { Button } from "@/components/ui/button";

type NotificationItem = {
  id: string;
  type: "friend_request" | "comment_on_post" | "comment_reply";
  isRead: boolean;
  createdAt: string;
  actor: PublicUser;
  postId: string | null;
  commentId: string | null;
  friendshipId: string | null;
  message: string;
};

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await api.get<{ notifications: NotificationItem[] }>("/api/notifications");
    setItems(data.notifications);
    await api.post("/api/notifications/read");
  }

  useEffect(() => {
    void load().catch((e: Error) => setError(e.message));
  }, []);

  async function onFriendAction(friendshipId: string | null, action: "accept" | "decline") {
    if (!friendshipId) return;
    await api.post(`/api/friends/${friendshipId}/${action}`);
    await load();
  }

  return (
    <section className="space-y-4">
      <div className="px-1">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">Friend requests, comments, and replies.</p>
      </div>

      <div className="feed-card p-5">
        {error && <p className="text-sm text-muted-foreground">{error}</p>}
        {items.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <User className="size-10 text-muted-foreground/40" aria-hidden="true" strokeWidth={1.25} />
            <p className="text-sm text-muted-foreground">No new notifications</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {items.map((n) => (
              <li
                key={n.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-sm">
                    {n.postId ? (
                      <Link to={`/posts/${n.postId}`} className="underline-offset-2 hover:underline">
                        {n.message}
                      </Link>
                    ) : (
                      n.message
                    )}
                  </p>
                  {!n.isRead && <p className="text-xs text-muted-foreground">New</p>}
                </div>
                {n.type === "friend_request" && n.friendshipId && (
                  <span className="flex gap-2">
                    <Button size="sm" onClick={() => void onFriendAction(n.friendshipId, "accept")}>
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void onFriendAction(n.friendshipId, "decline")}
                    >
                      Decline
                    </Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
