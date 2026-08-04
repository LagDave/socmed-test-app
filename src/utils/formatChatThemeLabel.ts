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

const SOLID_SWATCH_NAMES: Record<string, string> = {
  "#1a1a2e": "Midnight",
  "#0077b6": "Ocean",
  "#cdb4db": "Lavender",
  "#b7e4c7": "Mint",
  "#ff6b35": "Sunset",
  "#495057": "Slate",
};

const GRADIENT_SWATCH_NAMES: Record<string, string> = {
  "135:#667eea:#764ba2": "Purple Haze",
  "120:#ffecd2:#fcb69f": "Peach Glow",
  "160:#0f2027:#203a43": "Northern Lights",
  "45:#a18cd1:#fbc2eb": "Cotton Candy",
  "90:#11998e:#38ef7d": "Tropical",
  "135:#f12711:#f5af19": "Warm Flame",
};

export function formatChatThemeLabel(theme: ChatThemePayload | null | undefined): string | null {
  if (!theme) return null;

  if (theme.kind === "preset") {
    return isChatThemePresetId(theme.presetId) ? PRESET_NAMES[theme.presetId] ?? null : null;
  }

  if (theme.kind === "solid") {
    return SOLID_SWATCH_NAMES[theme.background.toLowerCase()] ?? "Custom";
  }

  if (theme.kind === "gradient") {
    const key = `${theme.angle}:${theme.stops[0].toLowerCase()}:${theme.stops[1].toLowerCase()}`;
    return GRADIENT_SWATCH_NAMES[key] ?? "Custom";
  }

  return null;
}

export function themeSystemLogText(theme: ChatThemePayload | null): string {
  const label = formatChatThemeLabel(theme);
  return label ? `Updated theme to ${label}.` : "Reset chat theme.";
}
