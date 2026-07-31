import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";

type ViewCoverPhotoDialogProps = {
  open: boolean;
  displayName: string;
  coverUrl: string | null;
  onClose: () => void;
};

export function ViewCoverPhotoDialog({
  open,
  displayName,
  coverUrl,
  onClose,
}: ViewCoverPhotoDialogProps) {
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
        className="modal-panel animate-modal-enter relative z-10 w-full max-w-3xl overflow-hidden"
      >
        <div className="border-b border-border/70 px-5 py-4 sm:px-6">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {displayName}&apos;s cover photo
          </h2>
        </div>
        <div className="bg-muted/30 p-4 sm:p-6">
          {coverUrl ? (
            <div className="overflow-hidden rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.14)] ring-1 ring-border/60">
              <img
                src={coverUrl}
                alt=""
                className="max-h-[min(70vh,28rem)] w-full object-contain"
              />
            </div>
          ) : (
            <div className="profile-cover h-48 rounded-xl sm:h-56" aria-hidden="true" />
          )}
          {!coverUrl && (
            <p className="mt-4 text-center text-sm text-muted-foreground">No cover photo set.</p>
          )}
        </div>
        <div className="flex justify-end border-t border-border/70 px-5 py-4 sm:px-6">
          <Button ref={closeRef} type="button" variant="outline" onClick={() => onCloseRef.current()}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
