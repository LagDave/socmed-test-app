import type { ChatThemePayload } from "../constants/chatThemeSchema";
import { isChatThemePresetId } from "../constants/chatThemePresets";

const PRESET_NAMES: Record<string, string> = {
  "romance-hearts": "Hearts",
  "romance-rose": "Rose Garden",
  "holiday-winter": "Winter Snow",
  "holiday-sparkle": "Festive Lights",
  "music-vinyl": "Vinyl Groove",
  "movies-reel": "Cinema Reel",
  "event-confetti": "Confetti Party",
  "nature-forest": "Forest Walk",
};

export function formatChatThemeLabel(theme: ChatThemePayload | null | undefined): string | null {
  if (!theme) return null;

  if (theme.kind === "preset") {
    return isChatThemePresetId(theme.presetId) ? PRESET_NAMES[theme.presetId] ?? null : null;
  }

  if (theme.kind === "solid" || theme.kind === "gradient") {
    return "Custom";
  }

  return null;
}

export function themeSystemLogText(theme: ChatThemePayload | null): string {
  const label = formatChatThemeLabel(theme);
  return label ? `Updated theme to ${label}.` : "Reset chat theme.";
}
