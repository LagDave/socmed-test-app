import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ViewChatImageDialogProps = {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
};

export function ViewChatImageDialog({ open, imageUrl, onClose }: ViewChatImageDialogProps) {
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
        aria-label="Chat image"
        className="animate-modal-enter relative z-10 inline-flex max-w-full"
      >
        <Button
          ref={closeRef}
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10 size-6 rounded-full bg-transparent p-0 text-white mix-blend-difference hover:bg-transparent hover:text-white"
          aria-label="Close image preview"
          onClick={() => onCloseRef.current()}
        >
          <X className="size-3.5" aria-hidden="true" />
        </Button>
        <img
          src={imageUrl}
          alt=""
          className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-lg sm:max-w-[32rem]"
        />
      </div>
    </div>
  );
}
