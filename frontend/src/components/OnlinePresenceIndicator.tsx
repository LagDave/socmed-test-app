import { cn } from "@/lib/utils";

export function OnlinePresenceIndicator({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "absolute bottom-[8%] right-[8%] size-3 rounded-full border-2 border-card bg-emerald-500",
        className
      )}
      aria-hidden="true"
    />
  );
}
