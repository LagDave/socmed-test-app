import type { ChatTheme } from "@/api/types";
import {
  findGraphicPreset,
  GRADIENT_PRESETS,
  SOLID_SWATCHES,
} from "@/lib/chatThemePresets";

export function formatChatThemeLabel(theme: ChatTheme | null | undefined): string | null {
  if (!theme) return null;

  if (theme.kind === "preset") {
    return findGraphicPreset(theme.presetId)?.name ?? null;
  }

  if (theme.kind === "solid") {
    return SOLID_SWATCHES.find((s) => JSON.stringify(s.theme) === JSON.stringify(theme))?.name ?? "Custom";
  }

  return GRADIENT_PRESETS.find((g) => JSON.stringify(g.theme) === JSON.stringify(theme))?.name ?? "Custom";
}
