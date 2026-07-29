import { useEffect, useState } from "react";
import {
  connectMessagesSocket,
  disconnectMessagesSocket,
  getMessagesSocket,
} from "@/api/socket";
import { useAuth } from "@/contexts/AuthContext";

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
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      disconnectMessagesSocket();
    };
  }, [user]);

  return connected;
}

export function useSocketConnected(): boolean {
  const [connected, setConnected] = useState(() => getMessagesSocket().connected);

  useEffect(() => {
    const socket = getMessagesSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setConnected(socket.connected);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return connected;
}
