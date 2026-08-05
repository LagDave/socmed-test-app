import type { MessagePinActivityView, MessageView, ThemeLogEntry } from "@/api/types";

export type ThreadTimelineItem =
  | { kind: "message"; key: string; createdAt: string; message: MessageView; index: number }
  | { kind: "system-log"; key: string; createdAt: string; log: ThemeLogEntry }
  | { kind: "pin-activity"; key: string; createdAt: string; activity: MessagePinActivityView };

export function mergeThreadSystemLogs(
  previous: ThemeLogEntry[],
  incoming: ThemeLogEntry[]
): ThemeLogEntry[] {
  const map = new Map<string, ThemeLogEntry>();
  for (const log of previous) map.set(log.id, log);
  for (const log of incoming) map.set(log.id, log);
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function buildThreadTimeline(
  messages: MessageView[],
  systemLogs: ThemeLogEntry[],
  pinActivities: MessagePinActivityView[]
): ThreadTimelineItem[] {
  return [
    ...messages.map((message, index) => ({
      kind: "message" as const,
      key: `msg-${message.id}`,
      createdAt: message.createdAt,
      message,
      index,
    })),
    ...systemLogs.map((log) => ({
      kind: "system-log" as const,
      key: `log-${log.id}`,
      createdAt: log.createdAt,
      log,
    })),
    ...pinActivities.map((activity) => ({
      kind: "pin-activity" as const,
      key: `pin-${activity.id}`,
      createdAt: activity.createdAt,
      activity,
    })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function mergePinActivities(
  previous: MessagePinActivityView[],
  incoming: MessagePinActivityView | null
): MessagePinActivityView[] {
  if (!incoming || previous.some((activity) => activity.id === incoming.id)) return previous;
  return [...previous, incoming].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}
