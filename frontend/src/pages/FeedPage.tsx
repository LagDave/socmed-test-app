import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import type { PostView, ReactionSummary } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PostCard } from "@/components/PostCard";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitOnEnter } from "@/lib/submitOnEnter";

export function FeedPage() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<PostView[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [sharingPostId, setSharingPostId] = useState<string | null>(null);
  const sharingRef = useRef(false);
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
      await api.post("/api/posts", { body: text, imageUrl: null });
      setBody("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function onShare(postId: string) {
    if (sharingRef.current) return;
    sharingRef.current = true;
    setSharingPostId(postId);
    setError(null);
    try {
      await api.post(`/api/posts/${postId}/share`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share");
    } finally {
      sharingRef.current = false;
      setSharingPostId(null);
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
    <section className="space-y-6">
      <form onSubmit={onCompose} className="feed-card px-3 py-2">
        <div className="flex items-center gap-3">
          <Link
            to={`/u/${user.username || "me"}`}
            className="shrink-0"
            aria-label="Your profile"
          >
            <ProfileAvatar displayName={user.displayName} avatarUrl={user.avatarUrl} size="sm" />
          </Link>
          <Textarea
            placeholder="What's on your mind?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={submitOnEnter}
            required
            rows={1}
            className="h-10 min-h-10 min-w-0 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[15px] leading-6 shadow-none focus-visible:ring-0"
          />
          <Button type="submit" size="sm" className="shrink-0" disabled={busy}>
            Post
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-muted-foreground">{error}</p>}
      </form>

      <ul className="space-y-4">
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            viewerId={user.id}
            onDeleteRequest={setPendingDeleteId}
            onReactionChange={patchPostSummary}
            onShareRequest={(postId) => void onShare(postId)}
            sharingPostId={sharingPostId}
          />
        ))}
        {posts.length === 0 && (
          <li className="feed-card px-3 py-6 text-center text-sm text-muted-foreground">No posts yet.</li>
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
