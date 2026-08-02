/** Bundled graphic preset ids — validated server-side on theme writes. */
export const CHAT_THEME_PRESET_IDS = [
  "romance-hearts",
  "romance-rose",
  "holiday-winter",
  "holiday-sparkle",
  "music-vinyl",
  "movies-reel",
  "event-confetti",
  "nature-forest",
] as const;

export type ChatThemePresetId = (typeof CHAT_THEME_PRESET_IDS)[number];

/** Bubble colors for bundled presets — used for server-side contrast validation. */
export const CHAT_THEME_PRESET_BUBBLES: Record<
  ChatThemePresetId,
  { bubbleMine: string; bubbleTheirs: string }
> = {
  "romance-hearts": { bubbleMine: "#d81b60", bubbleTheirs: "#ffffff" },
  "romance-rose": { bubbleMine: "#c9184a", bubbleTheirs: "#fffbfc" },
  "holiday-winter": { bubbleMine: "#1565c0", bubbleTheirs: "#ffffff" },
  "holiday-sparkle": { bubbleMine: "#e63946", bubbleTheirs: "#f1faee" },
  "music-vinyl": { bubbleMine: "#e94560", bubbleTheirs: "#2a2a3e" },
  "movies-reel": { bubbleMine: "#ffd700", bubbleTheirs: "#2d2d2d" },
  "event-confetti": { bubbleMine: "#ffffff", bubbleTheirs: "#1a1a2e" },
  "nature-forest": { bubbleMine: "#1b4332", bubbleTheirs: "#d8f3dc" },
};

export function isChatThemePresetId(value: string): value is ChatThemePresetId {
  return (CHAT_THEME_PRESET_IDS as readonly string[]).includes(value);
}
