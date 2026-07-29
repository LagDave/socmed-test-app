import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, User } from "lucide-react";
import { api } from "@/api/client";
import type { PublicUser } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { openConversationWithUsername } from "@/api/messages";

type InboxItem = { id: string; status: string; user: PublicUser };

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <User className="size-10 text-muted-foreground/40" aria-hidden="true" strokeWidth={1.25} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function FriendsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border pt-6 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold tracking-wide text-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function FriendsPage() {
  const navigate = useNavigate();
  const [incoming, setIncoming] = useState<InboxItem[]>([]);
  const [mutuals, setMutuals] = useState<PublicUser[]>([]);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const inbox = await api.get<{ incoming: InboxItem[]; outgoing: InboxItem[] }>("/api/friends/inbox");
    const m = await api.get<{ users: PublicUser[] }>("/api/friends/mutuals");
    setIncoming(inbox.incoming);
    setMutuals(m.users);
  }

  useEffect(() => {
    void load().catch((e: Error) => setError(e.message));
  }, []);

  async function onRequest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/api/friends/request", { username });
      setUsername("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function openMessage(peerUsername: string | null) {
    if (!peerUsername) return;
    setError(null);
    try {
      const id = await openConversationWithUsername(peerUsername);
      navigate(`/messages/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open chat");
    }
  }

  return (
    <div className="soft-page-canvas -mx-4 rounded-2xl px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-border bg-card p-6 text-card-foreground soft-card-shadow">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
          <p className="mt-1 text-sm text-muted-foreground">Requests and mutuals.</p>
        </header>

        <form onSubmit={onRequest} className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <Input
            className="h-12 flex-1 text-base"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            aria-label="Username"
          />
          <Button type="submit" size="lg" className="h-12 shrink-0 px-6">
            Send Request
          </Button>
        </form>
        {error && <p className="text-sm text-muted-foreground">{error}</p>}

        <div className="space-y-6">
          <FriendsSection title="Friend Request">
            {incoming.length === 0 ? (
              <EmptyState message="No pending requests" />
            ) : (
              <ul className="space-y-1">
                {incoming.map((i) => (
                  <li
                    key={i.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3 last:border-b-0"
                  >
                    <span>
                      {i.user.displayName}{" "}
                      <span className="text-muted-foreground">@{i.user.username}</span>
                    </span>
                    <span className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => void api.post(`/api/friends/${i.id}/accept`).then(load)}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void api.post(`/api/friends/${i.id}/decline`).then(load)}
                      >
                        Decline
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </FriendsSection>

          <FriendsSection title="Friends">
            {mutuals.length === 0 ? (
              <EmptyState message="Your friends will appear here" />
            ) : (
              <ul className="space-y-1">
                {mutuals.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between gap-2 border-b border-border py-3 last:border-b-0"
                  >
                    <span>
                      {u.displayName} <span className="text-muted-foreground">@{u.username}</span>
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Message ${u.displayName}`}
                      title="Message"
                      onClick={() => void openMessage(u.username)}
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </FriendsSection>
        </div>
      </div>
    </div>
  );
}
