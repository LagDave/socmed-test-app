/** Absolute local datetime for `<time title>`; empty when the instant is invalid. */
export function formatAbsoluteTime(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

/** Absolute date and time for message-group separators. */
export function formatMessageTimeSeparator(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Compact relative time for feed, comment, message, and notification timestamps.
 * Past times → "now", "5min", "4hr", …; no live ticking.
 */
export function formatRelativeTime(input: string | Date, now: Date = new Date()): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";

  const diffSec = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diffSec);

  if (abs < 45) return "now";

  const prefix = diffSec > 0 ? "in " : "";
  const formatUnit = (value: number, unit: string) => `${prefix}${value}${unit}`;

  // Cap minutes below 60 so near-hour boundaries roll into hours (avoid "60min").
  const minutes = Math.round(abs / 60);
  if (minutes < 60) {
    return formatUnit(Math.max(1, minutes), "min");
  }
  if (abs < 60 * 60 * 24) {
    return formatUnit(Math.max(1, Math.round(abs / 3600)), "hr");
  }
  if (abs < 60 * 60 * 24 * 7) {
    return formatUnit(Math.max(1, Math.round(abs / 86400)), "d");
  }
  if (abs < 60 * 60 * 24 * 7 * 5) {
    return formatUnit(Math.max(1, Math.round(abs / (86400 * 7))), "w");
  }
  if (abs < 60 * 60 * 24 * 30 * 12) {
    return formatUnit(Math.max(1, Math.round(abs / (86400 * 30))), "mo");
  }
  return formatUnit(Math.max(1, Math.round(abs / (86400 * 365))), "yr");
}

/** Compact elapsed time for constrained chat metadata, such as "5m ago". */
export function formatCompactRelativeTime(input: string | Date, now: Date = new Date()): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "recently";

  const elapsedSeconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  if (elapsedSeconds < 60) return "just now";

  const elapsedMinutes = Math.round(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${Math.max(1, elapsedMinutes)}m ago`;

  const elapsedHours = Math.round(elapsedSeconds / 3600);
  if (elapsedHours < 24) return `${Math.max(1, elapsedHours)}h ago`;

  const elapsedDays = Math.round(elapsedSeconds / 86400);
  if (elapsedDays < 7) return `${Math.max(1, elapsedDays)}d ago`;

  const elapsedWeeks = Math.round(elapsedSeconds / (86400 * 7));
  if (elapsedWeeks < 5) return `${Math.max(1, elapsedWeeks)}w ago`;

  const elapsedMonths = Math.round(elapsedSeconds / (86400 * 30));
  if (elapsedMonths < 12) return `${Math.max(1, elapsedMonths)}mo ago`;

  return `${Math.max(1, Math.round(elapsedSeconds / (86400 * 365)))}y ago`;
}

/** Compact elapsed time without a relative suffix, such as "5 hr". */
export function formatCompactElapsedTime(input: string | Date, now: Date = new Date()): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "recent";

  const elapsedSeconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  if (elapsedSeconds < 60) return "now";

  const elapsedMinutes = Math.round(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${Math.max(1, elapsedMinutes)} min`;

  const elapsedHours = Math.round(elapsedSeconds / 3600);
  if (elapsedHours < 24) return `${Math.max(1, elapsedHours)} hr`;

  const elapsedDays = Math.round(elapsedSeconds / 86400);
  if (elapsedDays < 7) return `${Math.max(1, elapsedDays)} d`;

  const elapsedWeeks = Math.round(elapsedSeconds / (86400 * 7));
  if (elapsedWeeks < 5) return `${Math.max(1, elapsedWeeks)} w`;

  const elapsedMonths = Math.round(elapsedSeconds / (86400 * 30));
  if (elapsedMonths < 12) return `${Math.max(1, elapsedMonths)} mo`;

  return `${Math.max(1, Math.round(elapsedSeconds / (86400 * 365)))} yr`;
}
