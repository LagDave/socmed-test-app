/** Calendar-day label for message thread separators. */
export function formatMessageDay(input: string | Date, now: Date = new Date()): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";

  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (startOf(date).getTime() - startOf(now).getTime()) / 86_400_000
  );

  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" as const } : {}),
  });
}

export function isSameCalendarDay(a: string | Date, b: string | Date): boolean {
  const d1 = a instanceof Date ? a : new Date(a);
  const d2 = b instanceof Date ? b : new Date(b);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return false;
  return d1.toDateString() === d2.toDateString();
}

const MESSAGE_TIME_GAP_MS = 10 * 60 * 1000;

export function messagesHaveTimeGap(a: MessageViewLike, b: MessageViewLike): boolean {
  const t1 = new Date(a.createdAt).getTime();
  const t2 = new Date(b.createdAt).getTime();
  if (Number.isNaN(t1) || Number.isNaN(t2)) return false;
  return Math.abs(t2 - t1) >= MESSAGE_TIME_GAP_MS;
}

export function messagesShareGroup(a: MessageViewLike, b: MessageViewLike): boolean {
  if (a.senderId !== b.senderId) return false;
  const t1 = new Date(a.createdAt).getTime();
  const t2 = new Date(b.createdAt).getTime();
  if (Number.isNaN(t1) || Number.isNaN(t2)) return false;
  return !messagesHaveTimeGap(a, b);
}

type MessageViewLike = { senderId: string; createdAt: string };
