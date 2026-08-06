import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Camera, MessageCircle } from "lucide-react";
import { api } from "@/api/client";
import type { CommentView, PostImageView, PostView, ReactionSummary } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { CommentsSection } from "@/components/CommentsSection";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PostActionRow } from "@/components/PostActionRow";
import { ReactionBar } from "@/components/ReactionBar";
import { Button } from "@/components/ui/button";
import { groupComments } from "@/lib/groupComments";
import { isNotificationReturnState, NOTIFICATIONS_PATH } from "@/lib/notificationNavigation";
import { canSharePost } from "@/lib/sharePost";
import { commentsForPostImage, postMediaImages } from "@/lib/postMedia";
import { emptyReactionSummary } from "@/lib/reactions";

type PendingDelete = { comment: CommentView; kind: "comment" | "reply" };

export function PostPhotoCommentsPage() {
  const { postId, photoId } = useParams();
  const location = useLocation();
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

  const media = useMemo(() => (post ? postMediaImages(post) : []), [post]);
  const photo = useMemo(
    () => media.find((item) => item.id === photoId) ?? null,
    [media, photoId]
  );
  const photoIndex = photo ? media.findIndex((item) => item.id === photo.id) : -1;

  const scopedComments = useMemo(
    () => (photoId ? commentsForPostImage(comments, photoId) : []),
    [comments, photoId]
  );
  const { threads, orphans } = useMemo(() => groupComments(scopedComments), [scopedComments]);

  async function load() {
    if (!postId) return;
    const p = await api.get<{ post: PostView }>(`/api/posts/${postId}`);
    const c = await api.get<{ comments: CommentView[] }>(`/api/posts/${postId}/comments`);
    setPost(p.post);
    setComments(c.comments);
  }

  function patchPhotoSummary(reactionSummary: ReactionSummary) {
    if (!photoId) return;
    setPost((prev) =>
      prev
        ? {
            ...prev,
            images: prev.images.map((img) =>
              img.id === photoId ? { ...img, reactionSummary } : img
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
    busyRef.current = false;
    setBusy(false);
    void load().catch((e: Error) => setError(e.message));
  }, [postId, photoId]);

  async function submitComment(input: {
    text: string;
    file: File | null;
    parentId: string | null;
  }): Promise<void> {
    if (!postId || !photoId) {
      throw new Error("This photo is unavailable for comments.");
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
      await api.post(`/api/posts/${postId}/comments`, {
        body: text || " ",
        imageUrl,
        parentId: input.parentId,
        postImageId: photoId,
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

  async function onShare() {
    if (!post || !user || sharingRef.current) return;
    sharingRef.current = true;
    setSharingPostId(post.id);
    setShareNotice(null);
    setError(null);
    try {
      await api.post(`/api/posts/${post.id}/share`);
      await load();
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
      await api.delete(`/api/comments/${pendingDelete.comment.id}`);
      if (replyTo?.id === pendingDelete.comment.id) setReplyTo(null);
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

  if (!photo) {
    const cameFromNotifications = isNotificationReturnState(location.state);
    const backPath = cameFromNotifications ? NOTIFICATIONS_PATH : `/posts/${post.id}`;
    const backLabel = cameFromNotifications ? "Back to notifications" : "Back to post";
    return (
      <section className="feed-page space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
          <Link to={backPath}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {backLabel}
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Photo not found.</p>
      </section>
    );
  }

  const postPath = `/posts/${post.id}`;
  const cameFromNotifications = isNotificationReturnState(location.state);
  const backPath = cameFromNotifications ? NOTIFICATIONS_PATH : postPath;
  const backLabel = cameFromNotifications ? "Back to notifications" : "Back to post";
  const canShare = user ? canSharePost(user.id, post) : false;
  const photoTitle =
    media.length > 1 ? `Photo ${photoIndex + 1} comments` : "Photo comments";
  const commentCount = photo.commentCount ?? scopedComments.length;
  const photoReactionSummary = photo.reactionSummary ?? emptyReactionSummary();

  return (
    <section className="feed-page space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
        <Link to={backPath}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      </Button>

      <article className="photo-comments-hero feed-card overflow-hidden">
        <div className="photo-comments-hero__header flex items-center justify-between gap-3 border-b border-border/50 bg-gradient-to-r from-muted/40 via-muted/20 to-transparent px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Camera className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{photoTitle}</p>
              <p className="text-xs text-muted-foreground">
                {post.author.displayName}
                {media.length > 1 ? ` · ${photoIndex + 1} of ${media.length}` : ""}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border/50">
            <MessageCircle className="size-3.5" aria-hidden="true" />
            {commentCount}
          </span>
        </div>

        <PhotoHero image={photo} photoIndex={photoIndex} total={media.length} />

        {user && photo.id ? (
          <div className="post-photo-action-row feed-action-row px-4 py-3">
            <PostActionRow
              size="md"
              commentCount={commentCount}
              shareCount={post.shareCount}
              showShare
              shareDisabled={!canShare}
              onShare={canShare ? () => void onShare() : undefined}
              shareBusy={sharingPostId === post.id}
              onCommentClick={() =>
                commentsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              <ReactionBar
                size="md"
                targetType="post_image"
                targetId={photo.id}
                summary={photoReactionSummary}
                onSummaryChange={patchPhotoSummary}
              />
            </PostActionRow>
          </div>
        ) : null}
      </article>

      {shareNotice && (
        <p className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground">
          {shareNotice}
        </p>
      )}

      <CommentsSection
        comments={scopedComments}
        threads={threads}
        orphans={orphans}
        user={user}
        busy={busy}
        replyTo={replyTo}
        title={photoTitle}
        sectionRef={commentsSectionRef}
        composerAutoFocus
        onCommentSubmit={(input) => submitComment({ ...input, parentId: null })}
        onReplySubmit={async (input) => {
          if (!replyTo) return;
          await submitComment({ ...input, parentId: replyTo.id });
          setReplyTo(null);
        }}
        onStartReply={setReplyTo}
        onClearReply={() => setReplyTo(null)}
        onDeleteComment={(comment, kind) => setPendingDelete({ comment, kind })}
        onReactionSummaryChange={patchCommentSummary}
      />

      {error && (
        <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.kind === "reply" ? "Delete this reply?" : "Delete this comment?"}
        description={
          pendingDelete?.kind === "comment"
            ? "This also removes any replies under this comment."
            : undefined
        }
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={() => void confirmPendingDelete()}
      />
    </section>
  );
}

function PhotoHero({
  image,
  photoIndex,
  total,
}: {
  image: PostImageView;
  photoIndex: number;
  total: number;
}) {
  return (
    <div className="photo-comments-hero__media relative w-full overflow-hidden bg-muted/20 post-media-single">
      <img
        src={image.url}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
      {total > 1 ? (
        <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white backdrop-blur-sm">
          {photoIndex + 1} / {total}
        </span>
      ) : null}
    </div>
  );
}
