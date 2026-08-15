import { useCallback, useEffect, useRef, useState } from "react";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  getFriendSuggestions,
  getFriendsInbox,
  getMutualFriends,
  removeFriend,
  sendFriendRequest,
  type FriendInboxItem,
} from "@/api/friends";
import type { FriendSuggestion, PublicUser } from "@/api/types";

export type InboxItem = FriendInboxItem;

export function useFriendsInbox() {
  const [incoming, setIncoming] = useState<InboxItem[]>([]);
  const [outgoing, setOutgoing] = useState<InboxItem[]>([]);
  const [mutuals, setMutuals] = useState<PublicUser[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const [inbox, mutualsData, suggestionsData] = await Promise.all([
        getFriendsInbox(),
        getMutualFriends(),
        getFriendSuggestions(),
      ]);
      setIncoming(inbox.incoming);
      setOutgoing(inbox.outgoing);
      setMutuals(mutualsData.users);
      setSuggestions(suggestionsData.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load friends");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function sendRequest(username: string) {
    setError(null);
    try {
      await sendFriendRequest(username);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send request";
      setError(message);
      throw err;
    }
  }

  async function acceptRequest(id: string) {
    setError(null);
    try {
      await acceptFriendRequest(id);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to accept request";
      setError(message);
      throw err;
    }
  }

  async function declineRequest(id: string) {
    setError(null);
    try {
      await declineFriendRequest(id);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to decline request";
      setError(message);
      throw err;
    }
  }

  async function cancelRequest(id: string) {
    setError(null);
    try {
      await cancelFriendRequest(id);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to cancel request";
      setError(message);
      throw err;
    }
  }

  async function unfriend(userId: string) {
    setError(null);
    try {
      await removeFriend(userId);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unfriend";
      setError(message);
      throw err;
    }
  }

  return {
    incoming,
    outgoing,
    mutuals,
    suggestions,
    loading,
    error,
    refresh,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    unfriend,
    setError,
  };
}
