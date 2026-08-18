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

const DARK_VARIANT_CHANNEL_FACTOR = 0.4;
const DARK_VARIANT_BUBBLE_CHANNEL_FACTOR = 0.3;

function darkenThemeColors(value: string, factor = DARK_VARIANT_CHANNEL_FACTOR): string {
  return value.replace(/#[0-9A-Fa-f]{6}/g, (hex) => {
    const channels = [1, 3, 5].map((index) => Math.round(parseInt(hex.slice(index, index + 2), 16) * factor));
    return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  });
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

export function resolveChatTheme(theme: ChatTheme | null | undefined, useDarkVariant = false): ResolvedChatTheme {
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
      useDarkVariant ? darkenThemeColors(preset.background) : preset.background,
      resolveColors(
        useDarkVariant ? darkenThemeColors(preset.bubbleMine, DARK_VARIANT_BUBBLE_CHANNEL_FACTOR) : preset.bubbleMine,
        useDarkVariant ? darkenThemeColors(preset.bubbleTheirs, DARK_VARIANT_BUBBLE_CHANNEL_FACTOR) : preset.bubbleTheirs,
        useDarkVariant ? darkenThemeColors(preset.accent) : preset.accent
      )
    );
  }

  if (theme.kind === "solid") {
    return finalizeResolvedTheme(
      useDarkVariant ? darkenThemeColors(theme.background) : theme.background,
      resolveColors(useDarkVariant ? darkenThemeColors(theme.bubbleMine) : theme.bubbleMine, useDarkVariant ? darkenThemeColors(theme.bubbleTheirs) : theme.bubbleTheirs, useDarkVariant ? darkenThemeColors(theme.accent) : theme.accent)
    );
  }

  const gradient = `linear-gradient(${theme.angle}deg, ${theme.stops[0]} 0%, ${theme.stops[1]} 100%)`;
  return finalizeResolvedTheme(
    useDarkVariant ? darkenThemeColors(gradient) : gradient,
    resolveColors(useDarkVariant ? darkenThemeColors(theme.bubbleMine) : theme.bubbleMine, useDarkVariant ? darkenThemeColors(theme.bubbleTheirs) : theme.bubbleTheirs, useDarkVariant ? darkenThemeColors(theme.accent) : theme.accent)
  );
}

export function resolveConversationTheme(view: ConversationThemeView | null, useDarkVariant = false): ResolvedChatTheme {
  return resolveChatTheme(view?.theme ?? null, useDarkVariant);
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
