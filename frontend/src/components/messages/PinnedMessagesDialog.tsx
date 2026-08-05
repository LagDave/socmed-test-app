import { useEffect, useRef } from "react";
import { Pin, PinOff, X } from "lucide-react";
import type { PinnedMessageView } from "@/api/types";
import { Button } from "@/components/ui/button";

function messagePreview(message: PinnedMessageView): string {
  if (message.body?.trim()) return message.body.trim();
  if (message.imageUrl) return "Photo";
  return "Message";
}

export function PinnedMessagesDialog({
  open,
  messages,
  onClose,
  onUnpin,
  unpinningMessageId,
}: {
  open: boolean;
  messages: PinnedMessageView[];
  onClose: () => void;
  onUnpin: (messageId: string) => void;
  unpinningMessageId: string | null;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close pinned messages"
        className="absolute inset-0 bg-foreground/40"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pinned-messages-title"
        className="relative z-10 flex max-h-[min(80vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Pin className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 id="pinned-messages-title" className="text-lg font-semibold">Pinned messages</h2>
          </div>
          <Button ref={closeRef} type="button" variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </header>
        <div className="min-h-0 overflow-y-auto p-3">
          {messages.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">No pinned messages yet.</p>
          ) : (
            messages.map((message) => (
              <div key={message.messageId} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted/60">
                <Pin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{message.senderDisplayName}</p>
                  <p className="truncate text-sm text-muted-foreground">{messagePreview(message)}</p>
                </div>
                <Button type="button" variant="ghost" size="sm" disabled={unpinningMessageId === message.messageId} onClick={() => onUnpin(message.messageId)}>
                  <PinOff className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Unpin
                </Button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
