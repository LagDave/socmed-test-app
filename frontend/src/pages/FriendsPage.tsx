import { useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { openConversationWithUsername } from "@/api/messages";
import type { PublicUser } from "@/api/types";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FriendsDashboardSkeleton } from "@/components/FriendsEmptyState";
import { FriendsRequestForm } from "@/components/FriendsRequestForm";
import {
  FriendsListPanel,
  RequestsListPanel,
  SuggestedListPanel,
} from "@/components/FriendsViewPanels";
import { Button } from "@/components/ui/button";
import { useFriendsInbox } from "@/hooks/useFriendsInbox";

type FriendsView = "friends" | "requests" | "suggested";

const FRIENDS_VIEWS: Array<{ id: FriendsView; label: string }> = [
  { id: "friends", label: "Friends" },
  { id: "requests", label: "Requests" },
  { id: "suggested", label: "Suggested" },
];

export function FriendsPage() {
  const navigate = useNavigate();
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const viewButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
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
    suggestionsError,
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

  function handleViewKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
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
    viewButtonRefs.current[nextIndex]?.focus();
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
            <nav className="friends-view-tabs" aria-label="Friends views">
              {FRIENDS_VIEWS.map((view, index) => (
                <button
                  key={view.id}
                  ref={(element) => {
                    viewButtonRefs.current[index] = element;
                  }}
                  id={`friends-view-${view.id}`}
                  type="button"
                  aria-pressed={activeView === view.id}
                  className="friends-view-tab"
                  onClick={() => selectView(view.id)}
                  onKeyDown={(event) => handleViewKeyDown(event, index)}
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

          {displayError && <p className="friends-error-banner">{displayError}</p>}

          {activeView === "friends" && (
            <FriendsListPanel
              mutuals={mutuals}
              openingChat={openingChat}
              onMessage={(username) => void openMessage(username)}
              onUnfriend={setPendingUnfriend}
            />
          )}

          {activeView === "requests" && (
            <RequestsListPanel
              incoming={incoming}
              outgoing={outgoing}
              onAccept={(id) => void acceptRequest(id)}
              onDecline={(id) => void declineRequest(id)}
              onCancel={(id) => void cancelRequest(id)}
            />
          )}

          {activeView === "suggested" && (
            <SuggestedListPanel
              suggestions={suggestions}
              suggestionsError={suggestionsError}
              sendingSuggestionId={sendingSuggestionId}
              onAdd={(userId, username) => void sendSuggestedRequest(userId, username)}
            />
          )}
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
