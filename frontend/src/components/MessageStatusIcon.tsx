import type { PublicUser } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import {
  deriveMessageStatus,
  MESSAGE_STATUS_BLUE,
  type MessageDeliveryStatus,
} from "@/lib/messageStatus";

const STATUS_LABEL: Record<MessageDeliveryStatus, string> = {
  sent: "Sent",
  delivered: "Delivered",
  seen: "Seen",
};

function SentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
      <circle cx="9" cy="9" r="7" fill="none" stroke={MESSAGE_STATUS_BLUE} strokeWidth="2" />
      <path
        d="M5.5 9.5 L7.5 11.5 L12.5 6.5"
        fill="none"
        stroke={MESSAGE_STATUS_BLUE}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeliveredIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
      <circle cx="9" cy="9" r="8" fill={MESSAGE_STATUS_BLUE} />
      <path
        d="M5.5 9.5 L7.5 11.5 L12.5 6.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MessageStatusIcon({
  status,
  peer,
}: {
  status: MessageDeliveryStatus;
  peer: PublicUser;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center"
      role="img"
      aria-label={STATUS_LABEL[status]}
      title={STATUS_LABEL[status]}
    >
      {status === "seen" ? (
        <ProfileAvatar
          displayName={peer.displayName}
          avatarUrl={peer.avatarUrl}
          size="xs"
          className="shadow-none"
        />
      ) : status === "delivered" ? (
        <DeliveredIcon />
      ) : (
        <SentIcon />
      )}
    </span>
  );
}

export function MessageStatusIconForMessage({
  message,
  peerLastReadAt,
  peer,
  allowSeen = true,
}: {
  message: { createdAt: string; deliveredAt: string | null };
  peerLastReadAt: string | null;
  peer: PublicUser;
  allowSeen?: boolean;
}) {
  let status = deriveMessageStatus(message, peerLastReadAt);
  if (!allowSeen && status === "seen") status = "delivered";
  return <MessageStatusIcon status={status} peer={peer} />;
}
