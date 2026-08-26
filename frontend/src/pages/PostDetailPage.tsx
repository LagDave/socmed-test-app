import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "@/api/client";
import type { CommentView, PostView, ReactionSummary } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { CommentsSection } from "@/components/CommentsSection";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PostCard } from "@/components/PostCard";
import { SharePostDialog } from "@/components/SharePostDialog";
import { ShareSuccessNotice } from "@/components/ShareSuccessNotice";
import { Button } from "@/components/ui/button";
import { groupComments } from "@/lib/groupComments";
import { isNotificationReturnState, NOTIFICATIONS_PATH } from "@/lib/notificationNavigation";
import { commentsForPostImage, postMediaImages } from "@/lib/postMedia";

type PendingDelete =
  | { type: "post" }
  | { type: "comment"; comment: CommentView; kind: "comment" | "reply" };

const POST_COMMENTS_HASH = "#comments";
const POST_PHOTOS_HASH = "#photos";

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
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const shareBusyRef = useRef(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const commentsSectionRef = useRef<HTMLDivElement>(null);
  const commentComposerRef = useRef<HTMLDivElement>(null);

  const mediaImages = useMemo(() => (post ? postMediaImages(post) : []), [post]);
  const hasPhotoThreads = mediaImages.some((image) => Boolean(image.id));
  const postLevelComments = useMemo(
    () => commentsForPostImage(comments, null),
    [comments]
  );
  const { threads: postThreads, orphans: postOrphans } = useMemo(
    () => groupComments(postLevelComments),
    [postLevelComments]
  );

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

  function patchPhotoSummary(postImageId: string, reactionSummary: ReactionSummary) {
    setPost((prev) =>
      prev
        ? {
            ...prev,
            images: prev.images.map((img) =>
              img.id === postImageId ? { ...img, reactionSummary } : img
            ),
          }
        : prev
    );
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
    setShareDialogOpen(false);
    setShareError(null);
    shareBusyRef.current = false;
    setShareBusy(false);
    busyRef.current = false;
    setBusy(false);
    setPendingDelete(null);
    void load().catch((e: Error) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!post) return;
    if (location.hash === POST_COMMENTS_HASH) {
      const animationFrameId = requestAnimationFrame(() => {
        const commentScrollTarget = commentComposerRef.current ?? commentsSectionRef.current;
        commentScrollTarget?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
      return () => cancelAnimationFrame(animationFrameId);
    }
    if (location.hash === POST_PHOTOS_HASH) {
      document.getElementById("photos")?.scrollIntoView({ block: "start" });
    }
  }, [post, location.hash]);

  async function submitComment(input: {
    text: string;
    file: File | null;
    parentId: string | null;
  }): Promise<void> {
    if (!id) {
      throw new Error("Post unavailable.");
    }
    if (busyRef.current) return;
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
        postImageId: null,
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
    setReplyTo(null);
  }

  function openShare() {
    setShareError(null);
    setShareNotice(null);
    setShareDialogOpen(true);
  }

  async function confirmShare(caption: string) {
    if (!post || shareBusyRef.current) return;
    shareBusyRef.current = true;
    setShareBusy(true);
    setShareError(null);
    setError(null);
    setShareNotice(null);
    try {
      await api.post(`/api/posts/${post.id}/share`, { body: caption });
      await load();
      setShareDialogOpen(false);
      setShareNotice("Shared to your feed.");
    } catch (err) {
      setShareError(err instanceof Error ? err.message : "Failed to share");
    } finally {
      shareBusyRef.current = false;
      setShareBusy(false);
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
      if (replyTo?.id === comment.id) setReplyTo(null);
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

  const showPostLevelComments = !hasPhotoThreads;
  const isSinglePhotoPost = hasPhotoThreads && mediaImages.length === 1;
  const showGeneralComments = showPostLevelComments || isSinglePhotoPost;
  const showPostLevelCaptionComments =
    hasPhotoThreads &&
    !isSinglePhotoPost &&
    (postLevelComments.length > 0 || Boolean(post.body.trim()));
  const cameFromNotifications = isNotificationReturnState(location.state);
  const backPath = cameFromNotifications ? NOTIFICATIONS_PATH : "/";
  const backLabel = cameFromNotifications ? "Back to notifications" : "Back to feed";
  const shouldAutoFocusComments = location.hash === POST_COMMENTS_HASH;

  return (
    <section className="feed-page space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
        <Link to={backPath}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      </Button>

      {user ? (
        <PostCard
          post={post}
          currentUserId={user.id}
          postMediaMode="detail"
          onDelete={() => setPendingDelete({ type: "post" })}
          onShare={() => openShare()}
          onReactionSummaryChange={(_, summary) => patchPostSummary(summary)}
          onPhotoReactionSummaryChange={patchPhotoSummary}
        />
      ) : (
        <article className="feed-card px-4 py-4">
          <p className="font-semibold">{post.author.displayName}</p>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{post.body}</p>
        </article>
      )}

      {shareNotice && <ShareSuccessNotice message={shareNotice} />}

      {showPostLevelCaptionComments && (
        <CommentsSection
          comments={postLevelComments}
          threads={postThreads}
          orphans={postOrphans}
          user={user}
          busy={busy}
          replyTo={
            replyTo && (replyTo.postImageId ?? null) === null ? replyTo : null
          }
          onCommentSubmit={onCommentSubmit}
          onReplySubmit={onReplySubmit}
          onStartReply={setReplyTo}
          onClearReply={() => setReplyTo(null)}
          onDeleteComment={(comment, kind) =>
            setPendingDelete({ type: "comment", comment, kind })
          }
          onReactionSummaryChange={patchCommentSummary}
          sectionRef={commentsSectionRef}
          composerRef={commentComposerRef}
          title="Post comments"
          composerAutoFocus={shouldAutoFocusComments}
        />
      )}

      {showGeneralComments && (
        <CommentsSection
          comments={postLevelComments}
          threads={postThreads}
          orphans={postOrphans}
          user={user}
          busy={busy}
          replyTo={replyTo}
          onCommentSubmit={onCommentSubmit}
          onReplySubmit={onReplySubmit}
          onStartReply={setReplyTo}
          onClearReply={() => setReplyTo(null)}
          onDeleteComment={(comment, kind) =>
            setPendingDelete({ type: "comment", comment, kind })
          }
          onReactionSummaryChange={patchCommentSummary}
          sectionRef={commentsSectionRef}
          composerRef={commentComposerRef}
          composerAutoFocus={shouldAutoFocusComments}
        />
      )}

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

      {user && post && (
        <SharePostDialog
          open={shareDialogOpen}
          post={post}
          user={user}
          busy={shareBusy}
          error={shareError}
          onConfirm={(caption) => void confirmShare(caption)}
          onCancel={() => {
            if (!shareBusy) {
              setShareDialogOpen(false);
              setShareError(null);
            }
          }}
        />
      )}
    </section>
  );
}
