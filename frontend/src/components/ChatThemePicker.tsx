import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, Palette, Sparkles, X } from "lucide-react";
import type { ChatTheme, ConversationThemeView } from "@/api/types";
import { Button } from "@/components/ui/button";
import { resolveChatTheme, themesEqual } from "@/lib/chatThemeApply";
import {
  GRADIENT_PRESETS,
  GRAPHIC_CATEGORIES,
  GRAPHIC_PRESETS,
  SOLID_SWATCHES,
} from "@/lib/chatThemePresets";
import { cn } from "@/lib/utils";

type ChatThemePickerProps = {
  open: boolean;
  current: ConversationThemeView | null;
  busy?: boolean;
  onApply: (theme: ChatTheme | { reset: true }) => void;
  onClose: () => void;
  onWordEffectSend?: (word: string) => void;
};

const WORD_EFFECT_HINTS = [
  { word: "love", emoji: "❤️" },
  { word: "congrats", emoji: "🎉" },
  { word: "birthday", emoji: "🎂" },
  { word: "fire", emoji: "🔥" },
  { word: "wow", emoji: "💥" },
] as const;

function isThemeSelected(draft: ChatTheme | null, theme: ChatTheme): boolean {
  return themesEqual(draft, theme);
}

function ChatThemePreview({ theme }: { theme: ChatTheme | null }) {
  const resolved = resolveChatTheme(theme);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border/60"
      style={resolved.active ? { background: resolved.background } : undefined}
    >
      {!resolved.active && (
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-muted to-secondary" />
      )}
      <div className="relative space-y-2.5 px-4 py-5">
        <div className="flex justify-start">
          <div
            className="max-w-[72%] rounded-2xl rounded-bl-md px-3 py-2 text-[13px] shadow-sm"
            style={
              resolved.active
                ? { background: resolved.bubbleTheirs, color: resolved.bubbleTheirsFg }
                : undefined
            }
          >
            {!resolved.active && (
              <span className="text-muted-foreground">Hey! Pick a theme 👋</span>
            )}
            {resolved.active && "This is how your chat will look"}
          </div>
        </div>
        <div className="flex justify-end">
          <div
            className="max-w-[72%] rounded-2xl rounded-br-md px-3 py-2 text-[13px] shadow-sm"
            style={
              resolved.active
                ? { background: resolved.bubbleMine, color: resolved.bubbleMineFg }
                : undefined
            }
          >
            {!resolved.active && (
              <span className="text-foreground/70">Your messages appear here</span>
            )}
            {resolved.active && (
              <span>
                love this! <span aria-hidden="true">❤️</span>
              </span>
            )}
          </div>
        </div>
      </div>
      {resolved.active && (
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ background: resolved.accent }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/** Minimal swatch — no card chrome, just color + label */
function ThemeSwatch({
  name,
  previewStyle,
  selected,
  onSelect,
}: {
  name: string;
  previewStyle: CSSProperties;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={name}
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex w-[4.25rem] shrink-0 snap-start flex-col items-center gap-1.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <span
        className={cn(
          "h-14 w-full rounded-2xl transition-transform",
          selected
            ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
            : "opacity-90 hover:scale-105 hover:opacity-100"
        )}
        style={previewStyle}
      >
        {selected && (
          <span className="flex h-full w-full items-center justify-center">
            <Check className="h-4 w-4 text-white drop-shadow-md" strokeWidth={3} aria-hidden="true" />
          </span>
        )}
      </span>
      <span
        className={cn(
          "max-w-full truncate text-center text-[10px] font-medium leading-tight",
          selected ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {name}
      </span>
    </button>
  );
}

function ThemeStrip({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5 last:mb-0">
      <h3 className="mb-2.5 px-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h3>
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 snap-x snap-mandatory scrollbar-none">
        {children}
      </div>
    </section>
  );
}

export function ChatThemePicker({
  open,
  current,
  busy = false,
  onApply,
  onClose,
  onWordEffectSend,
}: ChatThemePickerProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const openedThemeRef = useRef<ChatTheme | null>(null);
  const [draft, setDraft] = useState<ChatTheme | null>(current?.theme ?? null);

  // Only capture baseline when the picker opens — ignore poll/socket theme updates while open
  useEffect(() => {
    if (!open) return;
    const baseline = current?.theme ?? null;
    openedThemeRef.current = baseline;
    setDraft(baseline);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: do not reset draft on current.theme changes while open
  }, [open]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  const baselineTheme = openedThemeRef.current;
  const hasChanges = !themesEqual(draft, baselineTheme);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close theme picker"
        className="absolute inset-0 bg-foreground/50 backdrop-blur-[2px]"
        disabled={busy}
        onClick={() => !busy && onClose()}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "animate-modal-enter relative z-10 flex w-full flex-col overflow-hidden",
          "max-h-[min(92vh,720px)] sm:max-w-md",
          "rounded-t-[1.75rem] border border-border bg-card shadow-2xl sm:rounded-2xl"
        )}
      >
        <div className="flex shrink-0 justify-center pt-2.5 sm:hidden" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <header className="shrink-0 px-5 pb-3 pt-1 sm:pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <Palette className="h-5 w-5 text-foreground" aria-hidden="true" />
              </span>
              <div>
                <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                  Customize chat
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Shared with everyone in this conversation
                </p>
              </div>
            </div>
            <Button
              ref={closeRef}
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full"
              aria-label="Close"
              disabled={busy}
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4">
            <ChatThemePreview theme={draft} />
          </div>

          <div className="mt-4 rounded-xl bg-secondary/40 px-3 py-2.5">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Word effects
            </div>
            <p className="mb-2.5 text-xs leading-relaxed text-muted-foreground">
              Tap a word to send it instantly and trigger a full-screen animation.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {WORD_EFFECT_HINTS.map(({ word, emoji }) => (
                <button
                  key={word}
                  type="button"
                  disabled={!onWordEffectSend || busy}
                  onClick={() => onWordEffectSend?.(word)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border border-border/80 bg-background px-2.5 py-1 text-xs font-medium",
                    "transition-colors hover:border-foreground/30 hover:bg-secondary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  <span aria-hidden="true">{emoji}</span>
                  {word}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 pb-2 pt-1">
          {GRAPHIC_CATEGORIES.map((category) => {
            const items = GRAPHIC_PRESETS.filter((p) => p.category === category);
            if (!items.length) return null;
            return (
              <ThemeStrip key={category} title={category}>
                {items.map((preset) => {
                  const theme: ChatTheme = { kind: "preset", presetId: preset.id };
                  return (
                    <ThemeSwatch
                      key={preset.id}
                      name={preset.name}
                      previewStyle={{ background: preset.background }}
                      selected={isThemeSelected(draft, theme)}
                      onSelect={() => setDraft(theme)}
                    />
                  );
                })}
              </ThemeStrip>
            );
          })}

          <ThemeStrip title="Solid colors">
            {SOLID_SWATCHES.map((swatch) => (
              <ThemeSwatch
                key={swatch.name}
                name={swatch.name}
                previewStyle={{ background: swatch.theme.background }}
                selected={isThemeSelected(draft, swatch.theme)}
                onSelect={() => setDraft(swatch.theme)}
              />
            ))}
          </ThemeStrip>

          <ThemeStrip title="Gradients">
            {GRADIENT_PRESETS.map((item) => (
              <ThemeSwatch
                key={item.name}
                name={item.name}
                previewStyle={{
                  background: `linear-gradient(${item.theme.angle}deg, ${item.theme.stops[0]}, ${item.theme.stops[1]})`,
                }}
                selected={isThemeSelected(draft, item.theme)}
                onSelect={() => setDraft(item.theme)}
              />
            ))}
          </ThemeStrip>
        </div>

        <footer className="shrink-0 border-t border-border bg-card/95 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              disabled={busy}
              onClick={() => onApply({ reset: true })}
            >
              Reset
            </Button>
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={busy || !draft || !hasChanges}
                onClick={() => draft && onApply(draft)}
                className="min-w-[5.5rem]"
              >
                {busy ? "Applying…" : "Apply"}
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
