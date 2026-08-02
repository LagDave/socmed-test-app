import type { ChatThemePayload } from "../constants/chatThemeSchema";
import { CHAT_THEME_PRESET_BUBBLES } from "../constants/chatThemePresets";
import { AppError } from "./AppError";
import { meetsContrast, pickForeground } from "./chatThemeContrast";

function bubblePairPassesContrast(bubbleBg: string, bubbleFg: string): boolean {
  return meetsContrast(bubbleFg, bubbleBg);
}

export function assertThemeBubbleContrast(theme: ChatThemePayload): void {
  const pairs =
    theme.kind === "preset"
      ? CHAT_THEME_PRESET_BUBBLES[theme.presetId]
      : { bubbleMine: theme.bubbleMine, bubbleTheirs: theme.bubbleTheirs };

  const mineFg = pickForeground(pairs.bubbleMine);
  const theirsFg = pickForeground(pairs.bubbleTheirs);

  if (
    !bubblePairPassesContrast(pairs.bubbleMine, mineFg) ||
    !bubblePairPassesContrast(pairs.bubbleTheirs, theirsFg)
  ) {
    throw new AppError(
      "CHAT_THEME_VALIDATION",
      "Message bubble colors do not meet contrast requirements."
    );
  }
}
