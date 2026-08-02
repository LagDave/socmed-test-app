import { useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Check, MessageCircle, Search, UserMinus, X, XCircle } from "lucide-react";
import { openConversationWithUsername } from "@/api/messages";
import type { PublicUser } from "@/api/types";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FriendListRow } from "@/components/FriendListRow";
import { FriendsDashboardSkeleton, FriendsEmptyState } from "@/components/FriendsEmptyState";
import { FriendsRequestForm } from "@/components/FriendsRequestForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFriendsInbox } from "@/hooks/useFriendsInbox";
import { matchesUserQuery } from "@/lib/matchesUserQuery";
import { cn } from "@/lib/utils";

function FriendsSection({
  title,
  count,
  searchSlot,
  divided = true,
  children,
}: {
  title: string;
  count?: number;
  searchSlot?: ReactNode;
  divided?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cn(divided && "friends-section-divider")}>
      <div className="friends-section-header">
        <h2 className="friends-section-eyebrow">
          {title}
          {typeof count === "number" ? (
            <span className="ml-1.5 font-semibold text-foreground/80">({count})</span>
          ) : null}
        </h2>
        {searchSlot}
      </div>
      <div className="friends-section-body">{children}</div>
    </section>
  );
}

function LabeledActionButton({
  label,
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<typeof Button> & {
  label: string;
  icon: typeof Check;
}) {
  return (
    <Button size="sm" className={cn("rounded-full", className)} aria-label={label} {...props}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="hidden md:inline">{label}</span>
    </Button>
  );
}

export function FriendsPage() {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [openingChat, setOpeningChat] = useState(false);
  const [pendingUnfriend, setPendingUnfriend] = useState<PublicUser | null>(null);
  const [unfriending, setUnfriending] = useState(false);

  const {
    incoming,
    outgoing,
    mutuals,
    loading,
    error,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    unfriend,
    setError,
  } = useFriendsInbox();

  const filteredMutuals = mutuals.filter((user) => matchesUserQuery(user, query));
  const displayError = actionError ?? error;
  const pendingCount = incoming.length;

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
    window.requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  async function openMessage(peerUsername: string | null) {
    if (!peerUsername || openingChat) return;
    setActionError(null);
    setOpeningChat(true);
    try {
      const id = await openConversationWithUsername(peerUsername);
      navigate(`/messages/${id}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not open chat");
    } finally {
      setOpeningChat(false);
    }
  }

  async function confirmUnfriend() {
    if (!pendingUnfriend || unfriending) return;
    setUnfriending(true);
    setActionError(null);
    try {
      await unfriend(pendingUnfriend.id);
      setPendingUnfriend(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to unfriend");
    } finally {
      setUnfriending(false);
    }
  }

  return (
    <section className="friends-page space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Friends</h1>
          <p className="text-sm text-muted-foreground">
            Send requests, manage incoming invites, and message mutuals.
          </p>
        </div>
        {!loading && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="friends-stat-chip">
              {mutuals.length} <span className="friends-stat-chip-muted">friends</span>
            </span>
            {pendingCount > 0 && (
              <span className="friends-stat-chip bg-primary text-primary-foreground">
                {pendingCount} pending
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <FriendsDashboardSkeleton />
      ) : (
        <div className="friends-page-canvas">
          <div className="feed-card friends-dashboard-card overflow-hidden">
          {displayError && (
            <p className="border-b border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              {displayError}
            </p>
          )}

          <FriendsRequestForm
            onSubmit={async (username) => {
              setActionError(null);
              setError(null);
              await sendRequest(username);
            }}
          />

          <FriendsSection title="Friend Requests" count={incoming.length}>
            {incoming.length === 0 ? (
              <FriendsEmptyState
                icon="request"
                title="No pending requests"
                description="When someone adds you, they'll show up here."
              />
            ) : (
              <ul className="divide-y divide-border">
                {incoming.map((item) => (
                  <FriendListRow
                    key={item.id}
                    user={item.user}
                    actions={
                      <>
                        <LabeledActionButton
                          label="Confirm"
                          icon={Check}
                          onClick={() => void acceptRequest(item.id)}
                        />
                        <LabeledActionButton
                          label="Decline"
                          icon={XCircle}
                          variant="outline"
                          onClick={() => void declineRequest(item.id)}
                        />
                      </>
                    }
                  />
                ))}
              </ul>
            )}
          </FriendsSection>

          {outgoing.length > 0 && (
            <FriendsSection title="Sent Requests" count={outgoing.length}>
              <ul className="divide-y divide-border">
                {outgoing.map((item) => (
                  <FriendListRow
                    key={item.id}
                    user={item.user}
                    actions={
                      <LabeledActionButton
                        label="Cancel"
                        icon={X}
                        variant="outline"
                        onClick={() => void cancelRequest(item.id)}
                      />
                    }
                  />
                ))}
              </ul>
            </FriendsSection>
          )}

          <FriendsSection
            title="Friends"
            count={mutuals.length}
            searchSlot={
              mutuals.length > 0 ? (
                <Button
                  ref={searchToggleRef}
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
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
              ) : undefined
            }
          >
            {searchOpen && mutuals.length > 0 && (
              <div className="friends-search-track mb-3">
                <Input
                  ref={searchInputRef}
                  className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
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
                />
              </div>
            )}

            {mutuals.length === 0 ? (
              <FriendsEmptyState
                icon="users"
                title="No friends yet"
                description="Your friends will appear here once you connect with people on SocMed."
              />
            ) : filteredMutuals.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No matching friends</p>
            ) : (
              <ul className="divide-y divide-border">
                {filteredMutuals.map((user) => (
                  <FriendListRow
                    key={user.id}
                    user={user}
                    actions={
                      <>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-9 w-9 rounded-full"
                          aria-label={`Message ${user.displayName}`}
                          title="Message"
                          disabled={openingChat || !user.username}
                          onClick={() => void openMessage(user.username)}
                        >
                          <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive"
                          aria-label={`Unfriend ${user.displayName}`}
                          title="Unfriend"
                          onClick={() => setPendingUnfriend(user)}
                        >
                          <UserMinus className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </>
                    }
                  />
                ))}
              </ul>
            )}
          </FriendsSection>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingUnfriend !== null}
        title={`Unfriend ${pendingUnfriend?.displayName ?? "this friend"}?`}
        description="They will be removed from your friends list. You can send a new request later if you change your mind."
        confirmLabel="Unfriend"
        busy={unfriending}
        onCancel={() => {
          if (!unfriending) setPendingUnfriend(null);
        }}
        onConfirm={() => void confirmUnfriend()}
      />
    </section>
  );
}
