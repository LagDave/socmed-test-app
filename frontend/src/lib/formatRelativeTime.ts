/** Absolute local datetime for `<time title>`; empty when the instant is invalid. */
export function formatAbsoluteTime(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

/**
 * Human-readable relative time for feed / comment timestamps.
 * Past times → "just now", "5 minutes ago", …; no live ticking.
 */
export function formatRelativeTime(input: string | Date, now: Date = new Date()): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";

  const diffSec = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diffSec);

  if (abs < 45) return "just now";

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const sign = diffSec < 0 ? -1 : 1;

  // Cap minutes below 60 so near-hour boundaries roll into hours (avoid "60 minutes ago").
  const minutes = Math.round(abs / 60);
  if (minutes < 60) {
    return rtf.format(sign * Math.max(1, minutes), "minute");
  }
  if (abs < 60 * 60 * 24) {
    return rtf.format(sign * Math.max(1, Math.round(abs / 3600)), "hour");
  }
  if (abs < 60 * 60 * 24 * 7) {
    return rtf.format(sign * Math.max(1, Math.round(abs / 86400)), "day");
  }
  if (abs < 60 * 60 * 24 * 7 * 5) {
    return rtf.format(sign * Math.max(1, Math.round(abs / (86400 * 7))), "week");
  }
  if (abs < 60 * 60 * 24 * 30 * 12) {
    return rtf.format(sign * Math.max(1, Math.round(abs / (86400 * 30))), "month");
  }
  return rtf.format(sign * Math.max(1, Math.round(abs / (86400 * 365))), "year");
}
