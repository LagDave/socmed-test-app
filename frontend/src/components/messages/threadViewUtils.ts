import type { MessageView, PublicUser } from "@/api/types";
import { truncateQuoteText } from "@/components/MessageQuoteStrip";

export function replyTargetPreview(
  message: MessageView,
  user: PublicUser,
  peer: PublicUser
): { name: string; snippet: string; imageUrl: string | null } {
  const name = message.senderId === user.id ? user.displayName : peer.displayName;
  if (message.isUnsent) return { name, snippet: "Message unavailable", imageUrl: null };
  const snippet = message.body?.trim()
    ? truncateQuoteText(message.body)
    : message.imageUrl
      ? "Photo"
      : "Message";
  return { name, snippet, imageUrl: message.imageUrl };
}

export function patchReplyTargetsUnsent(
  messages: MessageView[],
  unsentId: string
): MessageView[] {
  return messages.map((message) => {
    if (message.replyTo?.id !== unsentId) return message;
    return {
      ...message,
      replyTo: { ...message.replyTo, isUnsent: true, body: null, imageUrl: null },
    };
  });
}
