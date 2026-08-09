import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PenLine, Search, User, UserPlus, X } from "lucide-react";
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

function firstName(displayName: string): string {
  const part = displayName.trim().split(/\s+/)[0];
  return part || displayName;
}

type MessagesFriendPickerProps = {
  hasConversations: boolean;
  existingPeerIds?: string[];
};

export function MessagesFriendPicker({
  hasConversations,
  existingPeerIds = [],
}: MessagesFriendPickerProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const [mutuals, setMutuals] = useState<PublicUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const existingSet = new Set(existingPeerIds);
  const newChatFriends = mutuals.filter((u) => !existingSet.has(u.id));

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
    searchToggleRef.current?.focus();
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
  const compactMode = hasConversations && !searchOpen;
  const showComposeStrip = compactMode && newChatFriends.length > 0;

  return (
    <section className={cn(compactMode && "messages-compose-section")}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="messages-section-label">
          {hasConversations ? "New message" : "Friends"}
          {!loading && mutuals.length > 0 && !compactMode && (
            <span className="font-normal normal-case tracking-normal text-muted-foreground">
              {" "}
              ({mutuals.length})
            </span>
          )}
        </h2>
        <div className="flex items-center gap-0.5">
          {!loading && mutuals.length > 0 && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              aria-label="Manage friends"
              asChild
            >
              <Link to="/friends">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
          <Button
            ref={searchToggleRef}
            type="button"
            size="icon"
            variant="ghost"
            className="size-8"
            aria-expanded={searchOpen}
            aria-label={searchOpen ? "Close search" : "Search friends"}
            onClick={toggleSearch}
          >
            {searchOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {searchOpen && (
        <div className="mt-3">
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
      ) : searchOpen ? (
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
      ) : showComposeStrip ? (
        <div className="messages-compose-strip mt-3">
          {newChatFriends.map((u) => (
            <button
              key={u.id}
              type="button"
              disabled={opening || !u.username}
              className="messages-compose-chip group disabled:opacity-50"
              onClick={() => void openChat(u.username)}
            >
              <span className="rounded-full ring-2 ring-transparent transition group-hover:ring-border/80 group-focus-visible:ring-ring">
                <ProfileAvatar
                  displayName={u.displayName}
                  avatarUrl={u.avatarUrl}
                  size="sm"
                  className="size-12"
                />
              </span>
              <span className="w-full truncate text-center text-[11px] font-medium leading-tight text-foreground">
                {firstName(u.displayName)}
              </span>
            </button>
          ))}
        </div>
      ) : compactMode ? (
        <button
          type="button"
          className="mt-3 flex w-full items-center gap-3 rounded-full border border-border/60 bg-secondary/40 px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary/70"
          onClick={toggleSearch}
        >
          <PenLine className="size-4 shrink-0" aria-hidden="true" />
          <span>Search friends to message…</span>
        </button>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {mutuals.map((u) => (
            <li key={u.id}>
              <FriendListButton user={u} opening={opening} onOpen={openChat} />
            </li>
          ))}
        </ul>
      )}
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
