import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { deleteConversation, setConversationPinned } from "@/api/messages";
import { CONVERSATION_UPDATED, getMessagesSocket } from "@/api/socket";
import type { ConversationListItem } from "@/api/types";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SwipeableConversationListRow } from "@/components/SwipeableConversationListRow";
import { MessagesErrorBanner, MessagesInboxEmptyConversations, MessagesRowSkeleton } from "@/components/MessagesUiHelpers";
import { MessagesFriendPicker } from "@/components/MessagesFriendPicker";
import { useAuth } from "@/contexts/AuthContext";
import { useInboxPeerTyping } from "@/hooks/useTypingIndicator";
import { Button } from "@/components/ui/button";

type PendingDeleteConversation = { id: string; peerName: string };

function deleteConversationDescription(peerName: string): string {
  return `This permanently deletes the chat and all messages from your inbox. ${peerName} will still have the conversation.`;
}
export function InboxView() {
  const { user } = useAuth();
  const typingByConversation = useInboxPeerTyping(user?.id);
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<PendingDeleteConversation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pinningConversationId, setPinningConversationId] = useState<string | null>(null);

  function requestDelete(id: string, peerName: string) {
    setPendingDelete({ id, peerName });
  }

  async function changeConversationPin(id: string, isPinned: boolean) {
    if (pinningConversationId) return;
    setPinningConversationId(id);
    setError(null);
    try {
      await setConversationPinned(id, !isPinned);
      await reloadInbox();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update pinned conversation");
    } finally {
      setPinningConversationId(null);
    }
  }

  async function confirmDeleteConversation() {
    if (!pendingDelete || deleting) return;
    const { id } = pendingDelete;
    setDeleting(true);
    try {
      await deleteConversation(id);
      setItems((prev) => prev.filter((c) => c.id !== id));
      setPendingDelete(null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete conversation");
    } finally {
      setDeleting(false);
    }
  }

  async function reloadInbox() {
    try {
      const d = await api.get<{ conversations: ConversationListItem[] }>(
        "/api/messages/conversations"
      );
      setItems(d.conversations);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reloadInbox();
  }, []);

  useEffect(() => {
    const socket = getMessagesSocket();
    const onUpdated = () => {
      void reloadInbox();
    };
    socket.on(CONVERSATION_UPDATED, onUpdated);
    return () => {
      socket.off(CONVERSATION_UPDATED, onUpdated);
    };
  }, []);

  const unreadTotal = items.reduce(
    (sum, item) => sum + item.unreadCount + (item.hasUnreadReaction && item.unreadCount === 0 ? 1 : 0),
    0
  );

  return (
    <section className="messages-page space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground">Chat with friends.</p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && unreadTotal > 0 && (
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              {unreadTotal} unread
            </span>
          )}
          <Button asChild variant="ghost" size="icon">
            <Link to="/messages/settings" aria-label="Message settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="feed-card overflow-hidden shadow-sm">
        {error && <MessagesErrorBanner message={error} />}

        <div className="messages-inbox-compose px-4 py-4">
          <MessagesFriendPicker
            hasConversations={items.length > 0}
            existingPeerIds={items.map((c) => c.peer.id)}
          />
        </div>

        <div>
          <div className="border-t border-border px-4 py-3">
            <h2 className="messages-section-label">
              Conversations
              {!loading && items.length > 0 && (
                <span className="ml-1.5 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal text-foreground">
                  {items.length}
                </span>
              )}
            </h2>
          </div>

          {loading ? (
            <MessagesRowSkeleton rows={3} />
          ) : items.length > 0 ? (
            <ul className="space-y-2 px-4 pb-4">
              {items.map((c) => (
                <SwipeableConversationListRow
                  key={c.id}
                  item={c}
                  onDelete={requestDelete}
                  onPinChange={changeConversationPin}
                  pinSaving={pinningConversationId === c.id}
                  isPeerTyping={Boolean(typingByConversation[c.id])}
                  viewerId={user?.id}
                />
              ))}
            </ul>
          ) : !error ? (
            <MessagesInboxEmptyConversations />
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete conversation?"
        description={
          pendingDelete ? deleteConversationDescription(pendingDelete.peerName) : undefined
        }
        confirmLabel="Delete"
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={() => void confirmDeleteConversation()}
      />
    </section>
  );
}
