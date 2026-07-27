import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/api/client";
import type { PublicUser } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type InboxItem = { id: string; status: string; user: PublicUser };

export function FriendsPage() {
  const [incoming, setIncoming] = useState<InboxItem[]>([]);
  const [outgoing, setOutgoing] = useState<InboxItem[]>([]);
  const [mutuals, setMutuals] = useState<PublicUser[]>([]);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const inbox = await api.get<{ incoming: InboxItem[]; outgoing: InboxItem[] }>("/api/friends/inbox");
    const m = await api.get<{ users: PublicUser[] }>("/api/friends/mutuals");
    setIncoming(inbox.incoming);
    setOutgoing(inbox.outgoing);
    setMutuals(m.users);
  }

  useEffect(() => {
    void load().catch((e: Error) => setError(e.message));
  }, []);

  async function onRequest(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post("/api/friends/request", { username });
      setUsername("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Friends</h1>
        <p className="text-sm text-muted-foreground">Requests and mutuals.</p>
      </div>

      <form onSubmit={onRequest} className="flex gap-2">
        <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <Button type="submit">Request</Button>
      </form>
      {error && <p className="text-sm">{error}</p>}

      <div>
        <h2 className="font-semibold">Incoming</h2>
        <ul className="mt-2 space-y-2">
          {incoming.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-2 border-b border-border py-2">
              <span>
                {i.user.displayName} @{i.user.username}
              </span>
              <span className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => void api.post(`/api/friends/${i.id}/accept`).then(load)}
                >
                  Accept
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
          {incoming.length === 0 && <p className="text-sm text-muted-foreground">None</p>}
        </ul>
      </div>

      <div>
        <h2 className="font-semibold">Outgoing</h2>
        <ul className="mt-2 space-y-2">
          {outgoing.map((i) => (
            <li key={i.id} className="flex items-center justify-between border-b border-border py-2">
              <span>
                {i.user.displayName} @{i.user.username}
              </span>
              <Button size="sm" variant="ghost" onClick={() => void api.delete(`/api/friends/${i.id}`).then(load)}>
                Cancel
              </Button>
            </li>
          ))}
          {outgoing.length === 0 && <p className="text-sm text-muted-foreground">None</p>}
        </ul>
      </div>

      <div>
        <h2 className="font-semibold">Mutuals</h2>
        <ul className="mt-2 space-y-2">
          {mutuals.map((u) => (
            <li key={u.id} className="border-b border-border py-2">
              {u.displayName} @{u.username}
            </li>
          ))}
          {mutuals.length === 0 && <p className="text-sm text-muted-foreground">None yet</p>}
        </ul>
      </div>
    </section>
  );
}
