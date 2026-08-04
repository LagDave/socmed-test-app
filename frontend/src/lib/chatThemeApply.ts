import type { CSSProperties } from "react";
import type { ChatTheme, ConversationThemeView } from "@/api/types";
import { pickForeground, pickThreadForeground, pickThreadMutedForeground, meetsContrast } from "@/lib/chatThemeContrast";
import { findGraphicPreset } from "@/lib/chatThemePresets";

export type ResolvedChatTheme = {
  active: boolean;
  background: string;
  backgroundSample: string;
  bubbleMine: string;
  bubbleTheirs: string;
  bubbleMineFg: string;
  bubbleTheirsFg: string;
  accent: string;
  accentFg: string;
  threadFg: string;
  threadMutedFg: string;
  composerBg: string;
};

function extractFirstHex(color: string): string | null {
  const match = /#([0-9A-Fa-f]{6})/.exec(color);
  return match ? `#${match[1]}` : null;
}

function sampleBackgroundColor(background: string, fallback: string): string {
  return extractFirstHex(background) ?? fallback;
}

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

function finalizeResolvedTheme(
  background: string,
  colors: Pick<
    ResolvedChatTheme,
    "bubbleMine" | "bubbleTheirs" | "bubbleMineFg" | "bubbleTheirsFg" | "accent" | "accentFg"
  >
): ResolvedChatTheme {
  const backgroundSample = sampleBackgroundColor(background, colors.bubbleTheirs);
  const threadFg = pickThreadForeground(background, backgroundSample);
  const threadMutedFg = pickThreadMutedForeground(background, backgroundSample);
  return {
    active: true,
    background,
    backgroundSample,
    ...colors,
    threadFg,
    threadMutedFg,
    composerBg: colors.accent,
  };
}

export function resolveChatTheme(theme: ChatTheme | null | undefined): ResolvedChatTheme {
  if (!theme) {
    return {
      active: false,
      background: "",
      backgroundSample: "",
      bubbleMine: "",
      bubbleTheirs: "",
      bubbleMineFg: "",
      bubbleTheirsFg: "",
      accent: "",
      accentFg: "",
      threadFg: "",
      threadMutedFg: "",
      composerBg: "",
    };
  }

  if (theme.kind === "preset") {
    const preset = findGraphicPreset(theme.presetId);
    if (!preset) {
      return resolveChatTheme(null);
    }
    return finalizeResolvedTheme(
      preset.background,
      resolveColors(preset.bubbleMine, preset.bubbleTheirs, preset.accent)
    );
  }

  if (theme.kind === "solid") {
    return finalizeResolvedTheme(
      theme.background,
      resolveColors(theme.bubbleMine, theme.bubbleTheirs, theme.accent)
    );
  }

  const gradient = `linear-gradient(${theme.angle}deg, ${theme.stops[0]} 0%, ${theme.stops[1]} 100%)`;
  return finalizeResolvedTheme(
    gradient,
    resolveColors(theme.bubbleMine, theme.bubbleTheirs, theme.accent)
  );
}

export function resolveConversationTheme(view: ConversationThemeView | null): ResolvedChatTheme {
  return resolveChatTheme(view?.theme ?? null);
}

export function chatThemeCssVars(resolved: ResolvedChatTheme): CSSProperties {
  if (!resolved.active) return {};
  return {
    "--chat-bg": resolved.background,
    "--chat-bg-sample": resolved.backgroundSample,
    "--chat-bubble-mine": resolved.bubbleMine,
    "--chat-bubble-theirs": resolved.bubbleTheirs,
    "--chat-bubble-mine-fg": resolved.bubbleMineFg,
    "--chat-bubble-theirs-fg": resolved.bubbleTheirsFg,
    "--chat-accent": resolved.accent,
    "--chat-accent-fg": resolved.accentFg,
    "--chat-thread-fg": resolved.threadFg,
    "--chat-thread-muted": resolved.threadMutedFg,
    "--chat-composer-bg": resolved.composerBg,
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
