import { MessageCircle } from "lucide-react";

export function MessagesRowSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-border" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-4">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-secondary" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex justify-between gap-2">
              <div className="h-4 w-36 animate-pulse rounded bg-secondary" />
              <div className="h-3 w-12 animate-pulse rounded bg-secondary" />
            </div>
            <div className="h-3 w-4/5 max-w-xs animate-pulse rounded bg-secondary" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MessagesThreadSkeleton() {
  return (
    <div className="space-y-4 px-1 py-2" aria-hidden="true">
      <div className="flex justify-center">
        <div className="h-6 w-24 animate-pulse rounded-full bg-secondary" />
      </div>
      <div className="flex items-end gap-2">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-secondary" />
        <div className="h-14 w-48 animate-pulse rounded-2xl bg-secondary" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="h-10 w-40 animate-pulse rounded-2xl bg-secondary" />
        <div className="h-10 w-56 animate-pulse rounded-2xl bg-secondary" />
      </div>
      <div className="flex items-end gap-2">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-secondary" />
        <div className="h-12 w-52 animate-pulse rounded-2xl bg-secondary" />
      </div>
    </div>
  );
}

export function MessageDaySeparator({ label }: { label: string }) {
  return (
    <div className="message-day-separator flex justify-center py-0.5">
      <span className="rounded-full border border-border/60 bg-secondary/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function MessageSystemLog({ text }: { text: string }) {
  return <p className="message-system-log" role="status">{text}</p>;
}

export function MessagesEmptyThread({ peerName }: { peerName: string }) {
  return (
    <div className="messages-empty-thread flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary">
        <MessageCircle className="size-6 text-muted-foreground/70" aria-hidden="true" strokeWidth={1.25} />
      </span>
      <div className="space-y-1">
        <p className="text-base font-medium">No messages yet</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Say hi to {peerName}. Your conversation stays here.
        </p>
      </div>
    </div>
  );
}

export function MessagesInboxEmptyConversations() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary">
        <MessageCircle className="size-6 text-muted-foreground/70" aria-hidden="true" strokeWidth={1.25} />
      </span>
      <div className="space-y-1">
        <p className="text-base font-medium">No conversations yet</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Pick a friend above to start chatting.
        </p>
      </div>
    </div>
  );
}

export function MessagesErrorBanner({ message }: { message: string }) {
  return (
    <p className="messages-error-banner border-b border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
      {message}
    </p>
  );
}

export function MessagesInlineError({ message }: { message: string }) {
  return (
    <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{message}</p>
  );
}
