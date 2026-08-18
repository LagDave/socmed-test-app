import { useEffect, useId, useRef } from "react";
import { Search, X } from "lucide-react";
import type { MessageView, PublicUser } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { highlightText } from "@/lib/highlightText";

function HighlightedMessagePreview({ body, query }: { body: string; query: string }) {
  return (
    <span className="line-clamp-2 break-words">
      {highlightText(body, query).map((segment, index) =>
        segment.isMatch ? (
          <mark key={index} className="rounded bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-500/40">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </span>
  );
}

function ConversationSearchResults({
  query,
  results,
  hasMore,
  isSearching,
  error,
  currentUserId,
  peer,
  onSelectMessage,
}: {
  query: string;
  results: MessageView[];
  hasMore: boolean;
  isSearching: boolean;
  error: string | null;
  currentUserId: string | undefined;
  peer: PublicUser | null;
  onSelectMessage: (message: MessageView, query: string) => void;
}) {
  if (!query) return null;

  return (
    <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-border bg-background" aria-live="polite">
      {isSearching && <p className="px-3 py-2.5 text-sm text-muted-foreground">Searching messages…</p>}
      {!isSearching && error && <p className="px-3 py-2.5 text-sm text-destructive">{error}</p>}
      {!isSearching && !error && results.length === 0 && (
        <p className="px-3 py-2.5 text-sm text-muted-foreground">No messages found</p>
      )}
      {!isSearching && !error && results.map((message) => {
        const senderName = message.senderId === currentUserId ? "You" : peer?.displayName ?? "Participant";
        return (
          <button
            key={message.id}
            type="button"
            className="block w-full border-b border-border px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
            onClick={() => onSelectMessage(message, query)}
          >
            <span className="mb-0.5 block text-xs text-muted-foreground">
              {senderName} · {formatRelativeTime(message.createdAt)}
            </span>
            <HighlightedMessagePreview body={message.body ?? ""} query={query} />
          </button>
        );
      })}
      {!isSearching && !error && hasMore && (
        <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">Showing the latest 50 matches</p>
      )}
    </div>
  );
}

export function ConversationSearchPanel({
  query,
  results,
  hasMore,
  isSearching,
  error,
  currentUserId,
  peer,
  hasActiveHighlight,
  onQueryChange,
  onClear,
  onClose,
  onSelectMessage,
}: {
  query: string;
  results: MessageView[];
  hasMore: boolean;
  isSearching: boolean;
  error: string | null;
  currentUserId: string | undefined;
  peer: PublicUser | null;
  hasActiveHighlight: boolean;
  onQueryChange: (query: string) => void;
  onClear: () => void;
  onClose: () => void;
  onSelectMessage: (message: MessageView, query: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const normalizedQuery = query.trim();

  useEffect(() => {
    const focusFrame = window.requestAnimationFrame(() => inputRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh] sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-foreground/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-xl rounded-2xl border border-border/80 bg-card p-4 shadow-2xl shadow-black/20"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">Search conversation</h2>
            {peer && <p className="text-sm text-muted-foreground">Search messages with {peer.displayName}</p>}
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Close search" onClick={onClose}>
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search messages"
            aria-label="Search messages"
            className="pr-10 pl-9"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
            aria-label={hasActiveHighlight && !query ? "Clear selected search highlight" : "Clear search"}
            disabled={!query && !hasActiveHighlight}
            onClick={onClear}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <ConversationSearchResults
          query={normalizedQuery}
          results={results}
          hasMore={hasMore}
          isSearching={isSearching}
          error={error}
          currentUserId={currentUserId}
          peer={peer}
          onSelectMessage={onSelectMessage}
        />
      </section>
    </div>
  );
}
