import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, X } from "lucide-react";
import { api } from "@/api/client";
import { openConversationWithUsername } from "@/api/messages";
import type { PublicUser } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { MessagesInlineError, MessagesRowSkeleton } from "@/components/MessagesUiHelpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function matchesQuery(user: PublicUser, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const name = user.displayName.toLowerCase();
  const username = (user.username ?? "").toLowerCase();
  return name.includes(q) || username.includes(q);
}

type MessagesFriendPickerProps = {
  hasConversations: boolean;
  isSearchOpen: boolean;
  onSearchOpenChange: (isOpen: boolean) => void;
  onFriendPickerStatusChange?: (status: "ready" | "error") => void;
};

export function MessagesFriendPicker({
  hasConversations,
  isSearchOpen,
  onSearchOpenChange,
  onFriendPickerStatusChange,
}: MessagesFriendPickerProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mutuals, setMutuals] = useState<PublicUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
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
    if (isSearchOpen) inputRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    if (!loading) {
      onFriendPickerStatusChange?.(error ? "error" : "ready");
    }
  }, [error, loading, onFriendPickerStatusChange]);

  function closeSearch() {
    onSearchOpenChange(false);
    setQuery("");
  }

  function toggleSearch() {
    if (isSearchOpen) {
      closeSearch();
      return;
    }
    onSearchOpenChange(true);
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
  const compactMode = hasConversations && !isSearchOpen;

  return (
    <section className={cn(compactMode && "messages-compose-section")}>
      {!hasConversations && (
        <div className="flex items-center justify-between gap-2">
          <h2 className="messages-section-label">
            Friends
            {!loading && mutuals.length > 0 && !compactMode && (
              <span className="font-normal normal-case tracking-normal text-muted-foreground">
                {" "}
                ({mutuals.length})
              </span>
            )}
          </h2>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8"
            aria-expanded={isSearchOpen}
            aria-label={isSearchOpen ? "Close search" : "Search friends"}
            onClick={toggleSearch}
          >
            {isSearchOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      )}

      {isSearchOpen && (
        <div className={cn("mt-3", hasConversations && "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2")}>
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
            className="rounded-full bg-secondary/60 border-border/60"
          />
          {hasConversations && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              aria-label="Close search"
              onClick={closeSearch}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3">
          <MessagesInlineError message={error} />
        </div>
      )}

      {loading ? (
        compactMode ? (
          <div className="messages-compose-strip mt-3" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="messages-compose-chip">
                <div className="size-12 animate-pulse rounded-full bg-secondary" />
                <div className="h-2.5 w-10 animate-pulse rounded bg-secondary" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3">
            <MessagesRowSkeleton rows={4} />
          </div>
        )
      ) : mutuals.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <User className="size-5 text-muted-foreground/70" aria-hidden="true" strokeWidth={1.25} />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium">No friends yet</p>
            <p className="text-sm text-muted-foreground">
              Add mutuals on Friends to start chatting here.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-1">
            <Link to="/friends">Manage friends</Link>
          </Button>
        </div>
      ) : isSearchOpen ? (
        filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No matching friends</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {filtered.map((u) => (
              <li key={u.id}>
                <FriendListButton user={u} opening={opening} onOpen={openChat} />
              </li>
            ))}
          </ul>
        )
      ) : !compactMode ? (
        <ul className="mt-2 divide-y divide-border">
          {mutuals.map((u) => (
            <li key={u.id}>
              <FriendListButton user={u} opening={opening} onOpen={openChat} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function FriendListButton({
  user,
  opening,
  onOpen,
}: {
  user: PublicUser;
  opening: boolean;
  onOpen: (username: string | null) => void;
}) {
  return (
    <button
      type="button"
      disabled={opening || !user.username}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent/40 disabled:opacity-50"
      onClick={() => onOpen(user.username)}
    >
      <ProfileAvatar displayName={user.displayName} avatarUrl={user.avatarUrl} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{user.displayName}</span>
      </span>
    </button>
  );
}
