import { useEffect, useRef } from "react";
import { getMessagesSocket } from "@/api/socket";
import { useAuth } from "@/contexts/AuthContext";
import {
  bindMessageNotificationSoundContext,
  ensureMessageNotificationSoundListener,
  teardownMessageNotificationSoundListener,
  unlockNotificationSounds,
} from "@/lib/notificationSounds";

/** Inbound DM sounds: plays on every inbound message except your own. */
export function useMessageNotificationSound(): void {
  const { user } = useAuth();
  const userIdRef = useRef<string | null>(user?.id ?? null);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    bindMessageNotificationSoundContext(() => ({
      userId: userIdRef.current,
    }));
  }, []);

  useEffect(() => {
    if (!user) {
      teardownMessageNotificationSoundListener();
      return;
    }

    ensureMessageNotificationSoundListener();

    const socket = getMessagesSocket();
    const onConnect = () => {
      ensureMessageNotificationSoundListener();
    };
    socket.on("connect", onConnect);

    const unlock = () => {
      unlockNotificationSounds();
    };

    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);

    return () => {
      socket.off("connect", onConnect);
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
    };
  }, [user]);
}
