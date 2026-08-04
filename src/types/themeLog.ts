import { randomUUID } from "crypto";
import type { ChatThemePayload } from "../constants/chatThemeSchema";
import { themeSystemLogText } from "../utils/formatChatThemeLabel";

/** Keep inbox activity compact while retaining enough recent theme context for a thread. */
export const THEME_LOG_LIMIT = 50;

export type ThemeLogEntry = {
  id: string;
  text: string;
  createdAt: string;
  updatedBy: string;
};

export function parseThemeLog(raw: unknown): ThemeLogEntry[] {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  const entries: ThemeLogEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string") continue;
    if (typeof row.text !== "string") continue;
    if (typeof row.createdAt !== "string") continue;
    if (typeof row.updatedBy !== "string") continue;
    entries.push({
      id: row.id,
      text: row.text,
      createdAt: row.createdAt,
      updatedBy: row.updatedBy,
    });
  }
  return entries.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function createThemeLogEntry(theme: ChatThemePayload | null, updatedBy: string): ThemeLogEntry {
  const now = new Date();
  return {
    id: randomUUID(),
    text: themeSystemLogText(theme),
    createdAt: now.toISOString(),
    updatedBy,
  };
}
