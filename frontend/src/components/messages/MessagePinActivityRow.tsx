import { Pin } from "lucide-react";
import type { MessagePinActivityView } from "@/api/types";
import { cn } from "@/lib/utils";

export function MessagePinActivityRow({
  activity,
  themed,
}: {
  activity: MessagePinActivityView;
  themed: boolean;
}) {
  const verb = activity.action === "pinned" ? "pinned a message" : "unpinned a message";
  return (
    <div className="my-5 flex items-center gap-3 px-3" role="status">
      <span className={cn("h-px flex-1", themed ? "bg-white/15" : "bg-border/70")} />
      <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur", themed ? "border-white/20 bg-black/20 text-white/90 shadow-black/10" : "border-border/70 bg-background/85 text-muted-foreground")}>
        <Pin className={cn("h-3.5 w-3.5", themed ? "text-white/80" : "text-primary")} aria-hidden="true" />
        <span>{activity.actorDisplayName} {verb}</span>
      </span>
      <span className={cn("h-px flex-1", themed ? "bg-white/15" : "bg-border/70")} />
    </div>
  );
}
