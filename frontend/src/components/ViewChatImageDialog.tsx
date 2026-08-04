import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";

type ViewChatImageDialogProps = {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
};

export function ViewChatImageDialog({ open, imageUrl, onClose }: ViewChatImageDialogProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Dismiss"
        className="modal-backdrop absolute inset-0"
        onClick={() => onCloseRef.current()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="modal-panel animate-modal-enter relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <h2 id={titleId} className="text-sm font-medium text-muted-foreground">
            Image preview
          </h2>
          <Button
            ref={closeRef}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onCloseRef.current()}
          >
            Close
          </Button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center bg-muted/30 p-4">
          <img
            src={imageUrl}
            alt=""
            className="max-h-[calc(90vh-5rem)] max-w-full rounded-lg object-contain shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
