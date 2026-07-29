import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ImagePlus, MessageCircle, SendHorizontal } from "lucide-react";
import { api } from "@/api/client";
import type {
  ConversationListItem,
  MessageView,
  PublicUser,
  ReactionEmoji,
} from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const POLL_MS = 2500;
const EMOJI_OPTIONS: { emoji: ReactionEmoji; glyph: string }[] = [
  { emoji: "like", glyph: "👍" },
  { emoji: "heart", glyph: "❤️" },
  { emoji: "haha", glyph: "😂" },
  { emoji: "wow", glyph: "😮" },
];

function snippet(item: ConversationListItem): string {
  const last = item.lastMessage;
  if (!last) return "No messages yet";
  if (last.isUnsent) return "Unsent a message";
  if (last.imageUrl && last.body) return last.body;
  if (last.imageUrl) return "Sent a photo";
  return last.body || "";
}

function MessageReactions({
  message,
  onChange,
}: {
  message: MessageView;
  onChange: (next: MessageView) => void;
}) {
  const [busy, setBusy] = useState(false);
  if (message.isUnsent) return null;

  async function apply(emoji: ReactionEmoji) {
    if (busy) return;
    setBusy(true);
    try {
      if (message.reactionSummary.viewerEmoji === emoji) {
        const data = await api.delete<{ message: MessageView }>(
          `/api/messages/messages/${message.id}/reaction`
        );
        onChange(data.message);
      } else {
        const data = await api.put<{ message: MessageView }>(
          `/api/messages/messages/${message.id}/reaction`,
          { emoji }
        );
        onChange(data.message);
      }
    } catch {
      /* keep prior summary */
    } finally {
      setBusy(false);
    }
  }

  const visible = EMOJI_OPTIONS.filter((o) => message.reactionSummary.counts[o.emoji] > 0);

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {EMOJI_OPTIONS.map((o) => (
        <button
          key={o.emoji}
          type="button"
          disabled={busy}
          aria-label={`React ${o.emoji}`}
          className={cn(
            "rounded-md px-1.5 py-0.5 text-sm transition-colors hover:bg-accent",
            message.reactionSummary.viewerEmoji === o.emoji && "bg-accent"
          )}
          onClick={() => void apply(o.emoji)}
        >
          {o.glyph}
        </button>
      ))}
      {visible.length > 0 && (
        <span className="ml-1 text-xs text-muted-foreground">
          {visible.map((o) => `${o.glyph}${message.reactionSummary.counts[o.emoji]}`).join(" ")}
        </span>
      )}
    </div>
  );
}

function ThreadView({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [peer, setPeer] = useState<PublicUser | null>(null);
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const data = await api.get<{
      conversationId: string;
      peer: PublicUser;
      messages: MessageView[];
    }>(`/api/messages/conversations/${conversationId}`);
    setPeer(data.peer);
    setMessages(data.messages);
    await api.post(`/api/messages/conversations/${conversationId}/read`);
  }

  useEffect(() => {
    let cancelled = false;
    void load()
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden) return;
      void load().catch(() => undefined);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const data = await api.post<{ message: MessageView }>(
        `/api/messages/conversations/${conversationId}/messages`,
        { body: text }
      );
      setBody("");
      setMessages((prev) => [...prev, data.message]);
      await api.post(`/api/messages/conversations/${conversationId}/read`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  async function onImage(file: File | null) {
    if (!file || sending) return;
    setSending(true);
    setError(null);
    try {
      const uploaded = await api.upload<{ url: string }>("/api/uploads", file);
      const caption = body.trim() || undefined;
      const data = await api.post<{ message: MessageView }>(
        `/api/messages/conversations/${conversationId}/messages`,
        { body: caption, imageUrl: uploaded.url }
      );
      setBody("");
      setMessages((prev) => [...prev, data.message]);
      await api.post(`/api/messages/conversations/${conversationId}/read`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSending(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onUnsend(id: string) {
    try {
      const data = await api.delete<{ message: MessageView }>(`/api/messages/messages/${id}`);
      setMessages((prev) => prev.map((m) => (m.id === id ? data.message : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unsend failed");
    }
  }

  function patchMessage(next: MessageView) {
    setMessages((prev) => prev.map((m) => (m.id === next.id ? next : m)));
  }

  return (
    <div className="flex min-h-[70vh] flex-col rounded-2xl border border-border bg-card soft-card-shadow">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate("/messages")}>
          Back
        </Button>
        <div className="min-w-0">
          <p className="truncate font-semibold">{peer?.displayName || "…"}</p>
          {peer?.username && (
            <p className="truncate text-xs text-muted-foreground">@{peer.username}</p>
          )}
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => {
          const mine = m.senderId === user?.id;
          return (
            <div
              key={m.id}
              className={cn("flex flex-col", mine ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  m.isUnsent
                    ? "border border-dashed border-border bg-transparent italic text-muted-foreground"
                    : mine
                      ? "bg-foreground text-background"
                      : "bg-secondary text-foreground"
                )}
              >
                {m.isUnsent ? (
                  "Unsent a message"
                ) : (
                  <>
                    {m.imageUrl && (
                      <img
                        src={m.imageUrl}
                        alt=""
                        className="mb-2 max-h-56 rounded-lg object-cover"
                      />
                    )}
                    {m.body}
                  </>
                )}
              </div>
              {!m.isUnsent && (
                <>
                  <MessageReactions message={m} onChange={patchMessage} />
                  {mine && (
                    <button
                      type="button"
                      className="mt-0.5 text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                      onClick={() => void onUnsend(m.id)}
                    >
                      Unsend
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 text-sm text-muted-foreground">{error}</p>}

      <form onSubmit={onSend} className="flex items-end gap-2 border-t border-border p-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => void onImage(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Attach image"
          disabled={sending}
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
        </Button>
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message"
          aria-label="Message"
          className="flex-1"
          disabled={sending}
        />
        <Button type="submit" size="icon" aria-label="Send" disabled={sending || !body.trim()}>
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function InboxView() {
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .get<{ conversations: ConversationListItem[] }>("/api/messages/conversations")
      .then((d) => setItems(d.conversations))
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="soft-page-canvas -mx-4 rounded-2xl px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-border bg-card p-6 soft-card-shadow">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="mt-1 text-sm text-muted-foreground">Chat with friends.</p>
        </header>
        {error && <p className="text-sm text-muted-foreground">{error}</p>}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <MessageCircle
              className="size-10 text-muted-foreground/40"
              aria-hidden="true"
              strokeWidth={1.25}
            />
            <p className="text-sm text-muted-foreground">
              No conversations yet. Message a friend from Friends or their profile.
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link to="/friends">Go to Friends</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/messages/${c.id}`}
                  className="flex items-start justify-between gap-3 py-3 transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {c.peer.displayName}{" "}
                      <span className="font-normal text-muted-foreground">
                        @{c.peer.username}
                      </span>
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{snippet(c)}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="mt-1 shrink-0 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold text-background">
                      {c.unreadCount > 9 ? "9+" : c.unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function MessagesPage() {
  const { conversationId } = useParams();
  if (conversationId) {
    return (
      <div className="soft-page-canvas -mx-4 rounded-2xl px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <ThreadView conversationId={conversationId} />
        </div>
      </div>
    );
  }
  return <InboxView />;
}
