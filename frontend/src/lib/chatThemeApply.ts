import type { CSSProperties } from "react";
import type { ChatTheme, ConversationThemeView } from "@/api/types";
import { pickForeground, meetsContrast } from "@/lib/chatThemeContrast";
import { findGraphicPreset } from "@/lib/chatThemePresets";

export type ResolvedChatTheme = {
  active: boolean;
  background: string;
  bubbleMine: string;
  bubbleTheirs: string;
  bubbleMineFg: string;
  bubbleTheirsFg: string;
  accent: string;
  accentFg: string;
};

function resolveColors(
  bubbleMine: string,
  bubbleTheirs: string,
  accent: string
): Pick<
  ResolvedChatTheme,
  "bubbleMine" | "bubbleTheirs" | "bubbleMineFg" | "bubbleTheirsFg" | "accent" | "accentFg"
> {
  return {
    bubbleMine,
    bubbleTheirs,
    bubbleMineFg: pickForeground(bubbleMine),
    bubbleTheirsFg: pickForeground(bubbleTheirs),
    accent,
    accentFg: pickForeground(accent),
  };
}

export function resolveChatTheme(theme: ChatTheme | null | undefined): ResolvedChatTheme {
  if (!theme) {
    return {
      active: false,
      background: "",
      bubbleMine: "",
      bubbleTheirs: "",
      bubbleMineFg: "",
      bubbleTheirsFg: "",
      accent: "",
      accentFg: "",
    };
  }

  if (theme.kind === "preset") {
    const preset = findGraphicPreset(theme.presetId);
    if (!preset) {
      return resolveChatTheme(null);
    }
    return {
      active: true,
      background: preset.background,
      ...resolveColors(preset.bubbleMine, preset.bubbleTheirs, preset.accent),
    };
  }

  if (theme.kind === "solid") {
    return {
      active: true,
      background: theme.background,
      ...resolveColors(theme.bubbleMine, theme.bubbleTheirs, theme.accent),
    };
  }

  const gradient = `linear-gradient(${theme.angle}deg, ${theme.stops[0]} 0%, ${theme.stops[1]} 100%)`;
  return {
    active: true,
    background: gradient,
    ...resolveColors(theme.bubbleMine, theme.bubbleTheirs, theme.accent),
  };
}

export function resolveConversationTheme(view: ConversationThemeView | null): ResolvedChatTheme {
  return resolveChatTheme(view?.theme ?? null);
}

export function chatThemeCssVars(resolved: ResolvedChatTheme): CSSProperties {
  if (!resolved.active) return {};
  return {
    "--chat-bg": resolved.background,
    "--chat-bubble-mine": resolved.bubbleMine,
    "--chat-bubble-theirs": resolved.bubbleTheirs,
    "--chat-bubble-mine-fg": resolved.bubbleMineFg,
    "--chat-bubble-theirs-fg": resolved.bubbleTheirsFg,
    "--chat-accent": resolved.accent,
    "--chat-accent-fg": resolved.accentFg,
  } as CSSProperties;
}

export function themesEqual(a: ChatTheme | null, b: ChatTheme | null): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** True when auto-picked bubble foreground/background pairs meet WCAG 4.5:1. */
export function themeBubbleContrastOk(theme: ChatTheme | null | undefined): boolean {
  const resolved = resolveChatTheme(theme);
  if (!resolved.active) return false;
  return (
    meetsContrast(resolved.bubbleMineFg, resolved.bubbleMine) &&
    meetsContrast(resolved.bubbleTheirsFg, resolved.bubbleTheirs)
  );
}
