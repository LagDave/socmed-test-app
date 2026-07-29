import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, X } from "lucide-react";
import { api } from "@/api/client";
import { openConversationWithUsername } from "@/api/messages";
import type { PublicUser } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function matchesQuery(user: PublicUser, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const name = user.displayName.toLowerCase();
  const username = (user.username ?? "").toLowerCase();
  return name.includes(q) || username.includes(q);
}

export function MessagesFriendPicker({ hasConversations }: { hasConversations: boolean }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mutuals, setMutuals] = useState<PublicUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await api.get<{ users: PublicUser[] }>("/api/friends/mutuals");
        if (cancelled) return;
        setMutuals(data.users);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load friends");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    inputRef.current?.focus();
  }, [searchOpen]);

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  function toggleSearch() {
    if (searchOpen) {
      closeSearch();
      return;
    }
    setSearchOpen(true);
  }

  async function openChat(username: string | null) {
    if (!username || opening) return;
    setOpening(true);
    setError(null);
    try {
      const id = await openConversationWithUsername(username);
      navigate(`/messages/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open chat");
    } finally {
      setOpening(false);
    }
  }

  const filtered = mutuals.filter((u) => matchesQuery(u, query));
  const title = hasConversations ? "New message" : "Friends";

  return (
    <section className="space-y-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">{title}</h2>
        {!searchOpen && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Search friends"
            onClick={toggleSearch}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      {searchOpen && (
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                closeSearch();
              }
            }}
            placeholder="Search friends…"
            aria-label="Search friends"
            className="flex-1"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Close search"
            onClick={closeSearch}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-muted-foreground">{error}</p>}

      {loading ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Loading friends…</p>
      ) : mutuals.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <User className="size-10 text-muted-foreground/40" aria-hidden="true" strokeWidth={1.25} />
          <p className="text-sm text-muted-foreground">
            No friends yet. Add mutuals on Friends to start chatting here.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-1">
            <Link to="/friends">Manage friends</Link>
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No matching friends</p>
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                disabled={opening || !u.username}
                className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-accent/40 disabled:opacity-50"
                onClick={() => void openChat(u.username)}
              >
                <span className="min-w-0 truncate">
                  <span className="font-semibold">{u.displayName}</span>{" "}
                  {u.username && (
                    <span className="font-normal text-muted-foreground">@{u.username}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && mutuals.length > 0 && (
        <p className="text-sm text-muted-foreground">
          <Link to="/friends" className="underline-offset-2 hover:underline">
            Manage friends
          </Link>
        </p>
      )}
    </section>
  );
}
