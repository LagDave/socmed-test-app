export type MessageDeliveryStatus = "sent" | "delivered" | "seen";

export function deriveMessageStatus(
  message: { createdAt: string; deliveredAt: string | null },
  peerLastReadAt: string | null
): MessageDeliveryStatus {
  if (
    peerLastReadAt &&
    new Date(message.createdAt).getTime() <= new Date(peerLastReadAt).getTime()
  ) {
    return "seen";
  }
  if (message.deliveredAt) return "delivered";
  return "sent";
}

export const MESSAGE_STATUS_BLUE = "#2563eb";
