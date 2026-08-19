import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ViewImageDialogProps = {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
};

export function ViewImageDialog({ open, imageUrl, onClose }: ViewImageDialogProps) {
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <button
        type="button"
        aria-label="Dismiss"
        className="image-viewer-backdrop modal-backdrop absolute inset-0"
        onClick={() => onCloseRef.current()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Image preview"
        className="animate-modal-enter relative z-10 flex max-h-[64dvh] max-w-[80vw] items-center justify-center sm:max-h-[min(72dvh,28rem)] sm:max-w-[min(90vw,28rem)]"
      >
        <button
          ref={closeRef}
          type="button"
          aria-label="Close image preview"
          className="absolute right-2 top-2 z-10 grid size-6 place-items-center text-white mix-blend-difference transition-opacity hover:opacity-70 focus-visible:outline-none"
          onClick={() => onCloseRef.current()}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
        <img
          src={imageUrl}
          alt=""
          className="block max-h-[64dvh] max-w-[80vw] object-contain sm:max-h-[min(72dvh,28rem)] sm:max-w-[min(90vw,28rem)]"
        />
      </div>
    </div>,
    document.body,
  );
}
