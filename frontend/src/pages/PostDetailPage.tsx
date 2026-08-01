import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "@/api/client";
import type { CommentView, PostView, ReactionSummary } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { CommentsSection } from "@/components/CommentsSection";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { groupComments } from "@/lib/groupComments";

type PendingDelete =
  | { type: "post" }
  | { type: "comment"; comment: CommentView; kind: "comment" | "reply" };

export function PostDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<PostView | null>(null);
  const [comments, setComments] = useState<CommentView[]>([]);
  const [replyTo, setReplyTo] = useState<CommentView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [sharingPostId, setSharingPostId] = useState<string | null>(null);
  const sharingRef = useRef(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const commentsSectionRef = useRef<HTMLDivElement>(null);

  const { threads, orphans } = useMemo(() => groupComments(comments), [comments]);

  async function load() {
    if (!id) return;
    const p = await api.get<{ post: PostView }>(`/api/posts/${id}`);
    const c = await api.get<{ comments: CommentView[] }>(`/api/posts/${id}/comments`);
    setPost(p.post);
    setComments(c.comments);
  }

  function patchPostSummary(reactionSummary: ReactionSummary) {
    setPost((prev) => (prev ? { ...prev, reactionSummary } : prev));
  }

  function patchCommentSummary(commentId: string, reactionSummary: ReactionSummary) {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, reactionSummary } : c))
    );
  }

  useEffect(() => {
    setPost(null);
    setComments([]);
    setReplyTo(null);
    setError(null);
    setShareNotice(null);
    busyRef.current = false;
    setBusy(false);
    sharingRef.current = false;
    setSharingPostId(null);
    setPendingDelete(null);
    void load().catch((e: Error) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!post || location.hash !== "#comments") return;
    commentsSectionRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [post, location.hash]);

  function clearReply() {
    setReplyTo(null);
  }

  function startReply(comment: CommentView) {
    setReplyTo(comment);
  }

  async function submitComment(input: {
    text: string;
    file: File | null;
    parentId: string | null;
  }): Promise<void> {
    if (!id || busyRef.current) return;
    const text = input.text.trim();
    if (!text && !input.file) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      let imageUrl: string | null = null;
      if (input.file) {
        const up = await api.upload<{ url: string }>("/api/uploads", input.file);
        imageUrl = up.url;
      }
      await api.post(`/api/posts/${id}/comments`, {
        body: text || " ",
        imageUrl,
        parentId: input.parentId,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      throw err;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function onCommentSubmit(input: { text: string; file: File | null }) {
    await submitComment({ ...input, parentId: null });
  }

  async function onReplySubmit(input: { text: string; file: File | null }) {
    if (!replyTo) return;
    await submitComment({ ...input, parentId: replyTo.id });
    clearReply();
  }

  async function onShare(postId: string) {
    if (!post || sharingRef.current) return;
    sharingRef.current = true;
    setSharingPostId(postId);
    setError(null);
    setShareNotice(null);
    try {
      await api.post(`/api/posts/${postId}/share`);
      setShareNotice("Shared to your feed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share");
    } finally {
      sharingRef.current = false;
      setSharingPostId(null);
    }
  }

  async function confirmPendingDelete() {
    if (!pendingDelete || deleting || deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setError(null);
    try {
      if (pendingDelete.type === "post") {
        if (!post) return;
        await api.delete(`/api/posts/${post.id}`);
        setPendingDelete(null);
        navigate("/");
        return;
      }

      const { comment } = pendingDelete;
      await api.delete(`/api/comments/${comment.id}`);
      if (replyTo?.id === comment.id) clearReply();
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }

  if (!post) {
    return (
      <section className="feed-page space-y-4">
        <p className="text-sm text-muted-foreground">{error || "Loading…"}</p>
      </section>
    );
  }

  const deleteDialogTitle =
    pendingDelete?.type === "post"
      ? "Delete this post?"
      : pendingDelete?.kind === "reply"
        ? "Delete this reply?"
        : "Delete this comment?";

  const deleteDialogDescription =
    pendingDelete?.type === "post"
      ? "This removes the post and all of its comments."
      : pendingDelete?.kind === "comment"
        ? "This also removes any replies under this comment."
        : undefined;

  return (
    <section className="feed-page space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
        <Link to="/">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to feed
        </Link>
      </Button>

      {user ? (
        <PostCard
          post={post}
          currentUserId={user.id}
          mediaLayout="fullBleed"
          showActionLabels
          sharingPostId={sharingPostId}
          onDelete={() => setPendingDelete({ type: "post" })}
          onShare={(postId) => void onShare(postId)}
          onReactionSummaryChange={(_, summary) => patchPostSummary(summary)}
        />
      ) : (
        <article className="feed-card px-4 py-4">
          <p className="font-semibold">{post.author.displayName}</p>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{post.body}</p>
        </article>
      )}

      {shareNotice && (
        <p className="feed-alert px-4 py-2.5 text-sm text-muted-foreground">{shareNotice}</p>
      )}

      <CommentsSection
        comments={comments}
        threads={threads}
        orphans={orphans}
        user={user}
        busy={busy}
        replyTo={replyTo}
        onCommentSubmit={onCommentSubmit}
        onReplySubmit={onReplySubmit}
        onStartReply={startReply}
        onClearReply={clearReply}
        onDeleteComment={(comment, kind) =>
          setPendingDelete({ type: "comment", comment, kind })
        }
        onReactionSummaryChange={patchCommentSummary}
        sectionRef={commentsSectionRef}
      />

      {error && (
        <p className="feed-alert px-4 py-3 text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={deleteDialogTitle}
        description={deleteDialogDescription}
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={() => void confirmPendingDelete()}
      />
    </section>
  );
}
