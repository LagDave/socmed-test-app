import type { MessagePinActivityView } from "@/api/types";

function firstName(displayName: string): string {
  const [name] = displayName.trim().split(/\s+/);
  return name || displayName;
}

export function MessagePinActivityRow({
  activity,
  isCurrentUser,
}: {
  activity: MessagePinActivityView;
  isCurrentUser: boolean;
}) {
  const verb = activity.action === "pinned" ? "pinned a message" : "unpinned a message";
  const actor = isCurrentUser ? "You" : firstName(activity.actorDisplayName);
  return <p className="message-pin-activity" role="status">{actor} {verb}</p>;
}
