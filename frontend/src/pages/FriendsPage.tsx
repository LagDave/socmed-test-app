import { useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Search, UserMinus, X } from "lucide-react";
import { openConversationWithUsername } from "@/api/messages";
import type { PublicUser } from "@/api/types";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FriendListRow } from "@/components/FriendListRow";
import { FriendsEmptyState, FriendsSectionSkeleton } from "@/components/FriendsEmptyState";
import { FriendsRequestForm } from "@/components/FriendsRequestForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFriendsInbox } from "@/hooks/useFriendsInbox";
import { matchesUserQuery } from "@/lib/matchesUserQuery";

function FriendsSection({
  title,
  count,
  searchSlot,
  children,
}: {
  title: string;
  count?: number;
  searchSlot?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="feed-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">
          {title}
          {typeof count === "number" ? (
            <span className="ml-1.5 font-normal text-muted-foreground">({count})</span>
          ) : null}
        </h2>
        {searchSlot}
      </div>
      <div className="mt-3">{children}</div>
    </section>
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
      <div className="px-1">
        <h1 className="text-2xl font-semibold tracking-tight">Friends</h1>
        <p className="text-sm text-muted-foreground">Send requests, manage incoming invites, and message mutuals.</p>
      </div>

      <FriendsRequestForm
        onSubmit={async (username) => {
          setActionError(null);
          setError(null);
          await sendRequest(username);
        }}
      />

      {displayError && <p className="px-1 text-sm text-muted-foreground">{displayError}</p>}

      {loading ? (
        <div className="space-y-4">
          <FriendsSectionSkeleton rows={2} />
          <FriendsSectionSkeleton rows={4} />
        </div>
      ) : (
        <>
          <FriendsSection title="Friend Requests" count={incoming.length}>
            {incoming.length === 0 ? (
              <FriendsEmptyState
                icon="request"
                message="No pending requests. When someone adds you, they will show up here."
              />
            ) : (
              <ul className="divide-y divide-border">
                {incoming.map((item) => (
                  <FriendListRow
                    key={item.id}
                    user={item.user}
                    actions={
                      <>
                        <Button size="sm" onClick={() => void acceptRequest(item.id)}>
                          Confirm
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void declineRequest(item.id)}>
                          Decline
                        </Button>
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
                      <Button size="sm" variant="outline" onClick={() => void cancelRequest(item.id)}>
                        Cancel
                      </Button>
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
              <div className="mb-3">
                <Input
                  ref={searchInputRef}
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
                message="Your friends will appear here once you connect with people on SocMed."
              />
            ) : filteredMutuals.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No matching friends</p>
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
                          variant="ghost"
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
        </>
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
