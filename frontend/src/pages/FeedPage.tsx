import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { PostView, ReactionSummary } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { submitOnEnter } from "@/lib/submitOnEnter";

export function FeedPage() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<PostView[]>([]);
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);

  async function load() {
    const data = await api.get<{ posts: PostView[] }>("/api/feed");
    setPosts(data.posts);
    await api.post("/api/feed/seen").catch(() => undefined);
  }

  function patchPostSummary(postId: string, reactionSummary: ReactionSummary) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, reactionSummary } : p)));
  }

  useEffect(() => {
    if (!user) return;
    void load().catch((e: Error) => setError(e.message));
  }, [user]);

  async function onCompose(e: FormEvent) {
    e.preventDefault();
    if (busyRef.current) return;
    const text = body.trim();
    if (!text) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const up = await api.upload<{ url: string }>("/api/uploads", imageFile);
        imageUrl = up.url;
      }
      await api.post("/api/posts", { body: text, imageUrl });
      setBody("");
      setImageFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function confirmDeletePost() {
    if (!pendingDeleteId || deleting || deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/api/posts/${pendingDeleteId}`);
      setPendingDeleteId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!user) {
    return (
      <section className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">SocMed application</h1>
        <p className="text-muted-foreground">Sign in to see your feed.</p>
        <Button asChild>
          <Link to="/login">Sign in</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="px-1">
        <h1 className="text-2xl font-semibold tracking-tight">Feed</h1>
        <p className="text-sm text-muted-foreground">You and your mutuals.</p>
      </div>

      <form onSubmit={onCompose} className="feed-card space-y-2 p-3">
        <Textarea
          placeholder="What's on your mind?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={submitOnEnter}
          required
          className="min-h-[52px] resize-none border-0 bg-transparent px-1 py-1 text-[15px] shadow-none focus-visible:ring-0"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="h-8 max-w-xs border-0 bg-transparent px-0 py-0 shadow-none"
          />
          <Button type="submit" size="sm" disabled={busy}>
            Post
          </Button>
        </div>
        {error && <p className="text-sm text-muted-foreground">{error}</p>}
      </form>

      <ul className="space-y-4">
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            viewerId={user.id}
            onDeleteRequest={setPendingDeleteId}
            onReactionChange={patchPostSummary}
          />
        ))}
        {posts.length === 0 && (
          <li className="feed-card p-8 text-center text-sm text-muted-foreground">No posts yet.</li>
        )}
      </ul>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this post?"
        description="This removes the post and all of its comments."
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDeleteId(null);
        }}
        onConfirm={() => void confirmDeletePost()}
      />
    </section>
  );
}
