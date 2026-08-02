export type WordEffectKind = "hearts" | "confetti" | "sparkle" | "flame" | "pop";

export type WordEffectRule = {
  words: string[];
  effect: WordEffectKind;
  placement: "overlay" | "inline";
};

export const WORD_EFFECT_RULES: WordEffectRule[] = [
  { words: ["love"], effect: "hearts", placement: "overlay" },
  { words: ["xoxo"], effect: "hearts", placement: "overlay" },
  { words: ["congrats"], effect: "confetti", placement: "overlay" },
  { words: ["congratulations"], effect: "confetti", placement: "overlay" },
  { words: ["yay"], effect: "confetti", placement: "overlay" },
  { words: ["happy birthday"], effect: "sparkle", placement: "overlay" },
  { words: ["birthday"], effect: "sparkle", placement: "overlay" },
  { words: ["fire"], effect: "flame", placement: "inline" },
  { words: ["lit"], effect: "flame", placement: "inline" },
  { words: ["wow"], effect: "pop", placement: "inline" },
  { words: ["omg"], effect: "pop", placement: "inline" },
];

const OVERLAY_RULES = WORD_EFFECT_RULES.filter((r) => r.placement === "overlay").sort(
  (a, b) => Math.max(...b.words.map((w) => w.length)) - Math.max(...a.words.map((w) => w.length))
);

const INLINE_RULES = WORD_EFFECT_RULES.filter((r) => r.placement === "inline");

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getOverlayEffect(body: string | null | undefined): WordEffectKind | null {
  if (!body) return null;
  const lower = body.toLowerCase();
  for (const rule of OVERLAY_RULES) {
    for (const word of rule.words) {
      const re = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
      if (re.test(lower)) return rule.effect;
    }
  }
  return null;
}

/** Any trigger word (overlay or inline) → screen effect kind */
export function getMessageWordEffect(body: string | null | undefined): WordEffectKind | null {
  const overlay = getOverlayEffect(body);
  if (overlay) return overlay;
  if (!body) return null;
  const lower = body.toLowerCase();
  for (const rule of INLINE_RULES) {
    for (const word of rule.words) {
      const re = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
      if (re.test(lower)) return rule.effect;
    }
  }
  return null;
}

export function wordToEffectKind(word: string): WordEffectKind | null {
  return getMessageWordEffect(word);
}

export type BodySegment = {
  text: string;
  effect?: WordEffectKind;
};

export function splitBodyWithInlineEffects(body: string): BodySegment[] {
  if (!INLINE_RULES.length) return [{ text: body }];

  const inlineWords = INLINE_RULES.flatMap((r) => r.words);
  const wordToEffect = new Map<string, WordEffectKind>();
  for (const rule of INLINE_RULES) {
    for (const word of rule.words) {
      wordToEffect.set(word.toLowerCase(), rule.effect);
    }
  }

  const pattern = inlineWords
    .sort((a, b) => b.length - a.length)
    .map((w) => escapeRegex(w))
    .join("|");
  if (!pattern) return [{ text: body }];

  const re = new RegExp(`\\b(${pattern})\\b`, "gi");
  const segments: BodySegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(body)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: body.slice(lastIndex, match.index) });
    }
    const matched = match[0];
    segments.push({
      text: matched,
      effect: wordToEffect.get(matched.toLowerCase()),
    });
    lastIndex = match.index + matched.length;
  }

  if (lastIndex < body.length) {
    segments.push({ text: body.slice(lastIndex) });
  }

  return segments.length ? segments : [{ text: body }];
}

export function overlayEffectClass(effect: WordEffectKind): string {
  return `chat-word-effect-overlay chat-word-effect-${effect}`;
}

export function inlineEffectClass(effect: WordEffectKind): string {
  return `chat-word-effect-inline chat-word-effect-inline-${effect}`;
}
