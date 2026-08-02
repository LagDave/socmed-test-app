import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getMessagesSocket } from "@/api/socket";
import { useAuth } from "@/contexts/AuthContext";
import {
  bindMessageNotificationSoundContext,
  ensureMessageNotificationSoundListener,
  teardownMessageNotificationSoundListener,
  unlockNotificationSounds,
} from "@/lib/notificationSounds";

/** Inbound DM sounds: off-thread only; suppresses on the open conversation. */
export function useMessageNotificationSound(): void {
  const { user } = useAuth();
  const location = useLocation();
  const userIdRef = useRef<string | null>(user?.id ?? null);
  const pathnameRef = useRef(location.pathname);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    bindMessageNotificationSoundContext(() => ({
      userId: userIdRef.current,
      pathname: pathnameRef.current,
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
      teardownMessageNotificationSoundListener();
    };
  }, [user]);
}
