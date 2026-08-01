import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  MESSAGE_NEW,
  getMessagesSocket,
  type MessageEventPayload,
} from "@/api/socket";
import { useAuth } from "@/contexts/AuthContext";
import {
  areNotificationSoundsUnlocked,
  playMessageNotificationSound,
  unlockNotificationSounds,
  warmActiveMessageSound,
} from "@/lib/notificationSounds";

function isViewingConversation(pathname: string, conversationId: string): boolean {
  const prefix = `/messages/${conversationId}`;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

type SocketWithSoundHandler = ReturnType<typeof getMessagesSocket> & {
  __socmedMessageSoundHandler?: (payload: MessageEventPayload) => void;
};

/** Shared suppress context — one hook instance updates, one socket handler reads. */
const soundContext = {
  userId: null as string | null,
  pathname: "/",
};

function onInboundMessageSound(payload: MessageEventPayload): void {
  const msg = payload.message;
  if (!soundContext.userId) return;
  if (msg.senderId === soundContext.userId) return;
  if (isViewingConversation(soundContext.pathname, msg.conversationId)) return;
  playMessageNotificationSound(msg.id);
}

function attachMessageSoundListener(): void {
  const socket = getMessagesSocket() as SocketWithSoundHandler;
  if (socket.__socmedMessageSoundHandler === onInboundMessageSound) return;

  if (socket.__socmedMessageSoundHandler) {
    socket.off(MESSAGE_NEW, socket.__socmedMessageSoundHandler);
  }

  socket.__socmedMessageSoundHandler = onInboundMessageSound;
  socket.on(MESSAGE_NEW, onInboundMessageSound);
}

function detachMessageSoundListener(): void {
  const socket = getMessagesSocket() as SocketWithSoundHandler;
  if (!socket.__socmedMessageSoundHandler) return;
  socket.off(MESSAGE_NEW, socket.__socmedMessageSoundHandler);
  socket.__socmedMessageSoundHandler = undefined;
}

/** Inbound DM sounds: global listener with suppress rules from the spec. */
export function useMessageNotificationSound(): void {
  const { user } = useAuth();
  const location = useLocation();
  const pathnameRef = useRef(location.pathname);

  useEffect(() => {
    pathnameRef.current = location.pathname;
    soundContext.pathname = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!user) {
      soundContext.userId = null;
      detachMessageSoundListener();
      return;
    }

    soundContext.userId = user.id;
    attachMessageSoundListener();
    warmActiveMessageSound();

    const unlock = () => {
      if (areNotificationSoundsUnlocked()) return;
      unlockNotificationSounds();
    };

    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);

    return () => {
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
    };
  }, [user]);
}
