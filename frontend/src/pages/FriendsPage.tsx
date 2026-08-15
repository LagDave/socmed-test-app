import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Check, MessageCircle, MoreHorizontal, Search, UserMinus, X, XCircle } from "lucide-react";
import { openConversationWithUsername } from "@/api/messages";
import type { PublicUser } from "@/api/types";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FriendListRow } from "@/components/FriendListRow";
import { FriendsDashboardSkeleton, FriendsEmptyState } from "@/components/FriendsEmptyState";
import { FriendsRequestForm } from "@/components/FriendsRequestForm";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFriendsInbox } from "@/hooks/useFriendsInbox";
import { cn } from "@/lib/utils";

type FriendsView = "friends" | "requests" | "suggested";

const FRIENDS_VIEWS: Array<{ id: FriendsView; label: string }> = [
  { id: "friends", label: "Friends" },
  { id: "requests", label: "Requests" },
  { id: "suggested", label: "Suggested" },
];

function FriendsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="friends-content-section">
      <h2 className="friends-content-heading">{title}</h2>
      {children}
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
    <Button size="sm" className={cn("friends-row-action", className)} aria-label={label} {...props}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

function FriendActions({
  user,
  openingChat,
  onMessage,
  onUnfriend,
}: {
  user: PublicUser;
  openingChat: boolean;
  onMessage: (username: string | null) => void;
  onUnfriend: (user: PublicUser) => void;
}) {
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="friends-row-action"
        aria-label={`Message ${user.displayName}`}
        disabled={openingChat || !user.username}
        onClick={() => onMessage(user.username)}
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Message</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="icon" variant="ghost" aria-label={`More options for ${user.displayName}`}>
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onUnfriend(user)}>
            <UserMinus className="h-4 w-4" aria-hidden="true" />
            Remove friend
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export function FriendsPage() {
  const navigate = useNavigate();
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeView, setActiveView] = useState<FriendsView>("friends");
  const [requestSearchOpen, setRequestSearchOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [openingChat, setOpeningChat] = useState(false);
  const [sendingSuggestionId, setSendingSuggestionId] = useState<string | null>(null);
  const [pendingUnfriend, setPendingUnfriend] = useState<PublicUser | null>(null);
  const [unfriending, setUnfriending] = useState(false);
  const {
    incoming,
    outgoing,
    mutuals,
    suggestions,
    loading,
    error,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    unfriend,
    setError,
  } = useFriendsInbox();

  const displayError = actionError ?? error;
  const requestCount = incoming.length + outgoing.length;

  function closeRequestSearch() {
    setRequestSearchOpen(false);
    window.requestAnimationFrame(() => searchToggleRef.current?.focus());
  }

  function selectView(view: FriendsView) {
    setActiveView(view);
    setRequestSearchOpen(false);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const nextIndexByKey: Record<string, number> = {
      ArrowLeft: (index - 1 + FRIENDS_VIEWS.length) % FRIENDS_VIEWS.length,
      ArrowRight: (index + 1) % FRIENDS_VIEWS.length,
      Home: 0,
      End: FRIENDS_VIEWS.length - 1,
    };
    const nextIndex = nextIndexByKey[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    const nextView = FRIENDS_VIEWS[nextIndex];
    selectView(nextView.id);
    tabRefs.current[nextIndex]?.focus();
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

  async function sendSuggestedRequest(userId: string, username: string) {
    if (sendingSuggestionId) return;
    setActionError(null);
    setError(null);
    setSendingSuggestionId(userId);
    try {
      await sendRequest(username);
    } catch {
      // The shared hook exposes the request error in the page banner.
    } finally {
      setSendingSuggestionId(null);
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

  const viewCounts: Record<FriendsView, number> = {
    friends: mutuals.length,
    requests: requestCount,
    suggested: suggestions.length,
  };

  return (
    <section className="friends-page">
      <header className="friends-page-header">
        <h1>Friends</h1>
        <p>Your people, all in one calm place.</p>
      </header>

      {loading ? (
        <FriendsDashboardSkeleton />
      ) : (
        <>
          <div className="friends-view-row">
            <nav className="friends-view-tabs" role="tablist" aria-label="Friends views">
              {FRIENDS_VIEWS.map((view, index) => (
                <button
                  key={view.id}
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  id={`friends-tab-${view.id}`}
                  type="button"
                  role="tab"
                  aria-controls={`friends-panel-${view.id}`}
                  aria-selected={activeView === view.id}
                  className="friends-view-tab"
                  onClick={() => selectView(view.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  {view.label}
                  <span className="friends-view-count">{viewCounts[view.id]}</span>
                </button>
              ))}
            </nav>
            <Button
              ref={searchToggleRef}
              type="button"
              size="sm"
              variant="ghost"
              className="friends-search-action"
              aria-expanded={requestSearchOpen}
              aria-controls="friends-request-search"
              onClick={() => setRequestSearchOpen((open) => !open)}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search people
            </Button>
          </div>

          <FriendsRequestForm
            open={requestSearchOpen}
            onClose={closeRequestSearch}
            onSubmit={async (username) => {
              setActionError(null);
              setError(null);
              await sendRequest(username);
            }}
          />

          <>
            {displayError && <p className="friends-error-banner">{displayError}</p>}

            {activeView === "friends" && (
              <section id="friends-panel-friends" role="tabpanel" aria-labelledby="friends-tab-friends">
                <FriendsSection title="Your friends">
                  {mutuals.length === 0 ? (
                    <FriendsEmptyState
                      icon="users"
                      title="No friends yet"
                      description="Search for someone by username to send your first request."
                    />
                  ) : (
                    <ul className="friends-list">
                      {mutuals.map((user) => (
                        <FriendListRow
                          key={user.id}
                          user={user}
                          actions={
                            <FriendActions
                              user={user}
                              openingChat={openingChat}
                              onMessage={(username) => void openMessage(username)}
                              onUnfriend={setPendingUnfriend}
                            />
                          }
                        />
                      ))}
                    </ul>
                  )}
                </FriendsSection>
              </section>
            )}

            {activeView === "requests" && (
              <section id="friends-panel-requests" role="tabpanel" aria-labelledby="friends-tab-requests">
                <FriendsSection title="Friend requests">
                  {incoming.length === 0 && outgoing.length === 0 ? (
                    <FriendsEmptyState
                      icon="request"
                      title="You’re all caught up"
                      description="New requests will appear here when they arrive."
                    />
                  ) : (
                    <div className="friends-request-groups">
                      {incoming.length > 0 && (
                        <section>
                          <h3 className="friends-list-label">Incoming</h3>
                          <ul className="friends-list">
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
                        </section>
                      )}
                      {outgoing.length > 0 && (
                        <section>
                          <h3 className="friends-list-label">Sent</h3>
                          <ul className="friends-list">
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
                        </section>
                      )}
                    </div>
                  )}
                </FriendsSection>
              </section>
            )}

            {activeView === "suggested" && (
              <section id="friends-panel-suggested" role="tabpanel" aria-labelledby="friends-tab-suggested">
                <FriendsSection title="Suggested for you">
                  {suggestions.length === 0 ? (
                    <FriendsEmptyState
                      icon="users"
                      title="No suggestions yet"
                      description="Suggestions appear when you share mutual friends with someone new."
                    />
                  ) : (
                    <ul className="friends-list">
                      {suggestions.map((user) => (
                        <FriendListRow
                          key={user.id}
                          user={user}
                          subtext={`${user.mutualFriendCount} mutual ${user.mutualFriendCount === 1 ? "friend" : "friends"}`}
                          actions={
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="friends-row-action"
                              disabled={sendingSuggestionId === user.id}
                              onClick={() => void sendSuggestedRequest(user.id, user.username)}
                            >
                              {sendingSuggestionId === user.id ? "Sending…" : "Add"}
                            </Button>
                          }
                        />
                      ))}
                    </ul>
                  )}
                </FriendsSection>
              </section>
            )}
          </>
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
