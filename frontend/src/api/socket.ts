import { io, type Socket } from "socket.io-client";
import type { ChatTheme, MessageView } from "./types";

export const MESSAGE_NEW = "message:new";
export const MESSAGE_UNSENT = "message:unsent";
export const MESSAGE_REACTION = "message:reaction";
export const MESSAGES_UNREAD = "messages:unread";
export const CONVERSATION_UPDATED = "conversation:updated";
export const CONVERSATION_THEME = "conversation:theme";

export type MessageEventPayload = { message: MessageView };
export type UnreadPayload = { unread: number };
export type ConversationUpdatedPayload = { conversationId: string };
export type ConversationThemePayload = {
  conversationId: string;
  theme: ChatTheme | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

let socket: Socket | null = null;

export function getMessagesSocket(): Socket {
  if (!socket) {
    socket = io({
      path: "/socket.io",
      withCredentials: true,
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function connectMessagesSocket(): Socket {
  const s = getMessagesSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectMessagesSocket(): void {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}

export function isMessagesSocketConnected(): boolean {
  return Boolean(socket?.connected);
}
