import type { ReactionEmoji } from "@/api/types";

/**
 * Facebook-equivalent reaction stickers via standard Unicode emoji.
 * (Facebook’s proprietary sticker art can’t be copied; these are the public equivalents.)
 */
export const REACTION_OPTIONS: {
  emoji: ReactionEmoji;
  label: string;
  glyph: string;
}[] = [
  { emoji: "like", label: "Like", glyph: "👍" },
  { emoji: "heart", label: "Heart", glyph: "❤️" },
  { emoji: "haha", label: "Haha", glyph: "😂" },
  { emoji: "wow", label: "Wow", glyph: "😮" },
  { emoji: "sad", label: "Sad", glyph: "😢" },
  { emoji: "angry", label: "Angry", glyph: "😡" },
];

export function reactionOption(emoji: ReactionEmoji | null) {
  const key = emoji ?? "like";
  return REACTION_OPTIONS.find((o) => o.emoji === key) ?? REACTION_OPTIONS[0];
}
