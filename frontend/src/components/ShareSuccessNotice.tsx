import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ShareSuccessNoticeProps = {
  message: string;
  className?: string;
};

export function ShareSuccessNotice({ message, className }: ShareSuccessNoticeProps) {
  return (
    <p
      className={cn("share-success-notice", className)}
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
