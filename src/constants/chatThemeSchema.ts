import { z } from "zod";
import { CHAT_THEME_PRESET_IDS } from "./chatThemePresets";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

const hexColor = z.string().regex(HEX_COLOR, "Invalid hex color");

export const chatThemePresetSchema = z.object({
  kind: z.literal("preset"),
  presetId: z.enum(CHAT_THEME_PRESET_IDS),
});

export const chatThemeSolidSchema = z.object({
  kind: z.literal("solid"),
  background: hexColor,
  bubbleMine: hexColor,
  bubbleTheirs: hexColor,
  accent: hexColor,
});

export const chatThemeGradientSchema = z.object({
  kind: z.literal("gradient"),
  stops: z.tuple([hexColor, hexColor]),
  angle: z.number().int().min(0).max(360),
  bubbleMine: hexColor,
  bubbleTheirs: hexColor,
  accent: hexColor,
});

export const chatThemeSchema = z.discriminatedUnion("kind", [
  chatThemePresetSchema,
  chatThemeSolidSchema,
  chatThemeGradientSchema,
]);

export type ChatThemePayload = z.infer<typeof chatThemeSchema>;

export const updateChatThemeSchema = z.union([
  z.object({ reset: z.literal(true) }),
  chatThemeSchema,
]);
