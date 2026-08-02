import { useEffect, useMemo, useState } from "react";
import type { WordEffectKind } from "@/lib/chatWordEffects";
import {
  getOverlayEffect,
  inlineEffectClass,
  splitBodyWithInlineEffects,
} from "@/lib/chatWordEffects";

const OVERLAY_PARTICLES: Record<WordEffectKind, string[]> = {
  hearts: ["❤️", "💕", "💗", "💖"],
  confetti: ["🎉", "🎊", "✨", "🥳"],
  sparkle: ["✨", "⭐", "🎈", "🎂"],
  flame: ["🔥"],
  pop: ["💥"],
};

function WordEffectParticles({
  effect,
  messageId,
}: {
  effect: WordEffectKind;
  messageId: string;
}) {
  const [play, setPlay] = useState(true);
  const particles = useMemo(() => {
    const particleGlyphs = OVERLAY_PARTICLES[effect] ?? ["✨"];
    return Array.from({ length: 7 }, (_, index) => ({
      id: `${messageId}-${effect}-${index}`,
      glyph: particleGlyphs[index % particleGlyphs.length],
      left: 6 + ((index * 17) % 82),
      delayMs: index * 60,
      sizeRem: 1.1 + (index % 3) * 0.12,
    }));
  }, [effect, messageId]);

  useEffect(() => {
    setPlay(true);
    const timer = window.setTimeout(() => setPlay(false), 1700);
    return () => window.clearTimeout(timer);
  }, [messageId, effect]);

  if (!play) return null;

  return (
    <div
      className={`pointer-events-none absolute -inset-x-1 -top-6 bottom-0 z-10 overflow-visible chat-word-overlay chat-word-overlay-${effect}`}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <span
          key={particle.id}
          className={`chat-word-particle chat-word-particle-${effect} absolute bottom-0 leading-none`}
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.delayMs}ms`,
            fontSize: `${particle.sizeRem}rem`,
          }}
        >
          {particle.glyph}
        </span>
      ))}
    </div>
  );
}

export function MessageBodyWithEffects({
  body,
  messageId,
}: {
  body: string | null;
  messageId: string;
}) {
  const overlayEffect = getOverlayEffect(body);

  if (!body) return null;

  const segments = splitBodyWithInlineEffects(body);

  return (
    <span className="relative z-0 inline break-words whitespace-pre-wrap">
      {overlayEffect && <WordEffectParticles effect={overlayEffect} messageId={messageId} />}
      {segments.map((segment, index) =>
        segment.effect ? (
          <span key={index} className={inlineEffectClass(segment.effect)}>
            {segment.effect === "flame" && (
              <span className="chat-word-inline-emoji" aria-hidden="true">
                🔥{" "}
              </span>
            )}
            {segment.effect === "pop" && (
              <span className="chat-word-inline-emoji" aria-hidden="true">
                💥{" "}
              </span>
            )}
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </span>
  );
}
