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

export function isChatThemePresetId(value: string): value is ChatThemePresetId {
  return (CHAT_THEME_PRESET_IDS as readonly string[]).includes(value);
}
