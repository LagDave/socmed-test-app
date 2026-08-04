import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Trash2 } from "lucide-react";
import type { ConversationListItem } from "@/api/types";
import { ConversationListRow } from "@/components/ConversationListRow";
import { cn } from "@/lib/utils";

const DELETE_WIDTH = 88;
const OPEN_THRESHOLD = 44;

export function SwipeableConversationListRow({
  item,
  onDelete,
  isPeerTyping = false,
  viewerId,
}: {
  item: ConversationListItem;
  onDelete: (id: string, peerName: string) => void;
  isPeerTyping?: boolean;
  viewerId?: string;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const startY = useRef(0);
  const axisLocked = useRef<"horizontal" | "vertical" | null>(null);
  const openRef = useRef(false);
  const offsetRef = useRef(0);
  const surfaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  function snap(open: boolean) {
    openRef.current = open;
    setOffset(open ? -DELETE_WIDTH : 0);
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startOffset.current = offsetRef.current;
    axisLocked.current = null;
    setDragging(true);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!axisLocked.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axisLocked.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      if (axisLocked.current === "horizontal") {
        surfaceRef.current?.setPointerCapture(e.pointerId);
      }
    }
    if (axisLocked.current !== "horizontal") return;

    const next = Math.min(0, Math.max(-DELETE_WIDTH, startOffset.current + dx));
    setOffset(next);
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const wasHorizontal = axisLocked.current === "horizontal";
    setDragging(false);

    if (wasHorizontal) {
      snap(offsetRef.current <= -OPEN_THRESHOLD);
      if (surfaceRef.current?.hasPointerCapture(e.pointerId)) {
        surfaceRef.current.releasePointerCapture(e.pointerId);
      }
    } else if (openRef.current) {
      snap(false);
    }

    axisLocked.current = null;
  }

  function onDeleteClick() {
    snap(false);
    onDelete(item.id, item.peer.displayName);
  }

  const isOpen = offset < 0;

  return (
    <li className="relative overflow-hidden rounded-xl">
      <div
        className="absolute inset-y-0 right-0 flex w-[88px] items-stretch rounded-r-xl bg-red-500 dark:bg-red-600"
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-white transition-transform active:scale-95"
          onClick={onDeleteClick}
          aria-label={`Delete conversation with ${item.peer.displayName}`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <Trash2 className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
          </span>
          <span className="text-[11px] font-semibold tracking-wide">Delete</span>
        </button>
      </div>

      <div
        ref={surfaceRef}
        className={cn(
          "relative touch-pan-y rounded-xl bg-background",
          !dragging && "transition-transform duration-200 ease-out",
          isOpen && "shadow-[-6px_0_16px_-8px_rgba(0,0,0,0.35)] dark:shadow-[-6px_0_16px_-8px_rgba(0,0,0,0.6)]"
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <ConversationListRow
          item={item}
          onDelete={onDelete}
          isPeerTyping={isPeerTyping}
          viewerId={viewerId}
          className="rounded-xl border-b-0 bg-background"
        />
      </div>
    </li>
  );
}
