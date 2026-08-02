import { useCallback, useEffect, useRef, useState } from "react";
import {
  MESSAGE_NEW,
  TYPING_START,
  TYPING_STOP,
  TYPING_UPDATE,
  getMessagesSocket,
  type MessageEventPayload,
  type TypingUpdatePayload,
} from "@/api/socket";

const EMIT_DEBOUNCE_MS = 300;
const EMIT_HEARTBEAT_MS = 2000;

export function useTypingEmitter(opts: {
  conversationId: string;
  text: string;
  connected: boolean;
  active?: boolean;
}): { stopTyping: () => void } {
  const { conversationId, text, connected, active = true } = opts;
  const isTypingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTyping = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (!isTypingRef.current) return;
    isTypingRef.current = false;
    if (connected) {
      getMessagesSocket().emit(TYPING_STOP, { conversationId });
    }
  }, [conversationId, connected]);

  const startTyping = useCallback(() => {
    if (!connected || !active) return;
    getMessagesSocket().emit(TYPING_START, { conversationId });
    isTypingRef.current = true;
    if (!heartbeatRef.current) {
      heartbeatRef.current = setInterval(() => {
        getMessagesSocket().emit(TYPING_START, { conversationId });
      }, EMIT_HEARTBEAT_MS);
    }
  }, [conversationId, connected, active]);

  useEffect(() => {
    if (!connected || !active) {
      stopTyping();
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      stopTyping();
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => startTyping(), EMIT_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [text, connected, active, startTyping, stopTyping]);

  useEffect(() => {
    return () => stopTyping();
  }, [conversationId, stopTyping]);

  return { stopTyping };
}

export function usePeerTyping(conversationId: string, selfId: string | undefined): boolean {
  const [isPeerTyping, setIsPeerTyping] = useState(false);

  useEffect(() => {
    setIsPeerTyping(false);
  }, [conversationId, selfId]);

  useEffect(() => {
    const socket = getMessagesSocket();

    const onTyping = (payload: TypingUpdatePayload) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.userId === selfId) return;
      setIsPeerTyping(payload.isTyping);
    };

    const onMessage = (payload: MessageEventPayload) => {
      if (payload.message.conversationId !== conversationId) return;
      if (payload.message.senderId === selfId) return;
      setIsPeerTyping(false);
    };

    socket.on(TYPING_UPDATE, onTyping);
    socket.on(MESSAGE_NEW, onMessage);
    return () => {
      socket.off(TYPING_UPDATE, onTyping);
      socket.off(MESSAGE_NEW, onMessage);
    };
  }, [conversationId, selfId]);

  return isPeerTyping;
}

export function useInboxPeerTyping(selfId: string | undefined): Record<string, boolean> {
  const [typingByConversation, setTypingByConversation] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const socket = getMessagesSocket();

    const onTyping = (payload: TypingUpdatePayload) => {
      if (payload.userId === selfId) return;
      setTypingByConversation((prev) => {
        if (payload.isTyping) {
          if (prev[payload.conversationId]) return prev;
          return { ...prev, [payload.conversationId]: true };
        }
        if (!prev[payload.conversationId]) return prev;
        const next = { ...prev };
        delete next[payload.conversationId];
        return next;
      });
    };

    const onMessage = (payload: MessageEventPayload) => {
      const id = payload.message.conversationId;
      setTypingByConversation((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    };

    socket.on(TYPING_UPDATE, onTyping);
    socket.on(MESSAGE_NEW, onMessage);
    return () => {
      socket.off(TYPING_UPDATE, onTyping);
      socket.off(MESSAGE_NEW, onMessage);
    };
  }, [selfId]);

  return typingByConversation;
}
