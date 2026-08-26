import { useEffect, useState } from "react";
import {
  connectMessagesSocket,
  disconnectMessagesSocket,
  getMessagesSocket,
  MESSAGE_ACK,
  MESSAGE_NEW,
  type MessageEventPayload,
} from "@/api/socket";
import { useAuth } from "@/contexts/AuthContext";

function bindSocketConnection(setConnected: (value: boolean) => void): () => void {
  const socket = connectMessagesSocket();
  const onConnect = () => setConnected(true);
  const onDisconnect = () => setConnected(false);
  socket.on("connect", onConnect);
  socket.on("disconnect", onDisconnect);
  setConnected(socket.connected);
  return () => {
    socket.off("connect", onConnect);
    socket.off("disconnect", onDisconnect);
  };
}

/** Keep a credentialed Socket.IO connection while signed in. */
export function useMessagesSocketConnection(): boolean {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      disconnectMessagesSocket();
      setConnected(false);
      return;
    }

    const socket = connectMessagesSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onMessageNew = (payload: MessageEventPayload) => {
      if (payload.message.senderId !== user.id) {
        socket.emit(MESSAGE_ACK, { messageId: payload.message.id });
      }
    };
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(MESSAGE_NEW, onMessageNew);
    setConnected(socket.connected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(MESSAGE_NEW, onMessageNew);
    };
  }, [user]);

  return connected;
}

/** Thread/inbox surfaces: ensure connect + track status (do not tear down the singleton). */
export function useSocketConnected(): boolean {
  const { user } = useAuth();
  const [connected, setConnected] = useState(() => getMessagesSocket().connected);

  useEffect(() => {
    if (!user) {
      setConnected(false);
      return;
    }

    return bindSocketConnection(setConnected);
  }, [user]);

  return connected;
}
