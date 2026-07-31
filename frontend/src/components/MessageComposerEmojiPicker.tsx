import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPOSER_EMOJI_OPTIONS } from "@/lib/composerEmojiOptions";
import { cn } from "@/lib/utils";

export function MessageComposerEmojiPicker({
  disabled,
  onPick,
  className,
}: {
  disabled?: boolean;
  onPick: (emoji: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative shrink-0", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        aria-label="Insert emoji"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Smile className="h-4 w-4" />
      </Button>
      {open && (
        <div
          className="absolute bottom-full left-0 z-20 mb-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-border/80 bg-background p-2 shadow-lg"
          role="listbox"
          aria-label="Choose emoji"
        >
          <div className="grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto">
            {COMPOSER_EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                role="option"
                aria-label={emoji}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-lg leading-none hover:bg-accent"
                onClick={() => {
                  onPick(emoji);
                  setOpen(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
