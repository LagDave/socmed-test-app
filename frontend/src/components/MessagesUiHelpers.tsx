export function MessagesRowSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="space-y-1" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
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
    <div className="flex justify-center py-1">
      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function MessagesEmptyThread({ peerName }: { peerName: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="text-sm font-medium text-foreground">No messages yet</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Say hi to {peerName}. Your conversation stays here.
      </p>
    </div>
  );
}

export function MessagesErrorBanner({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-border bg-secondary/60 px-3 py-2 text-sm text-foreground">
      {message}
    </p>
  );
}
