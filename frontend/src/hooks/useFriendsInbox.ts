import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/api/client";
import type { PublicUser } from "@/api/types";

export type InboxItem = { id: string; status: string; user: PublicUser };

export function useFriendsInbox() {
  const [incoming, setIncoming] = useState<InboxItem[]>([]);
  const [outgoing, setOutgoing] = useState<InboxItem[]>([]);
  const [mutuals, setMutuals] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const [inbox, mutualsData] = await Promise.all([
        api.get<{ incoming: InboxItem[]; outgoing: InboxItem[] }>("/api/friends/inbox"),
        api.get<{ users: PublicUser[] }>("/api/friends/mutuals"),
      ]);
      setIncoming(inbox.incoming);
      setOutgoing(inbox.outgoing);
      setMutuals(mutualsData.users);
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
      await api.post("/api/friends/request", { username });
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
      await api.post(`/api/friends/${id}/accept`);
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
      await api.post(`/api/friends/${id}/decline`);
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
      await api.delete(`/api/friends/${id}`);
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
      await api.delete(`/api/friends/user/${userId}`);
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
