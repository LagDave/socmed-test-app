import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FeedComposer } from "@/components/FeedComposer";
import { FeedEmptyState, FeedPostSkeleton, FeedWelcomeCard } from "@/components/FeedEmptyState";
import { PostCard } from "@/components/PostCard";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { api } from "@/api/client";

export function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    patchPostSummary,
    removePost,
  } = useFeedPosts(Boolean(user));
  const [pageError, setPageError] = useState<string | null>(null);
  const [sharingPostId, setSharingPostId] = useState<string | null>(null);
  const sharingRef = useRef(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !user) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "240px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [user, loadMore, posts.length, hasMore]);

  async function onShare(postId: string) {
    if (sharingRef.current) return;
    sharingRef.current = true;
    setSharingPostId(postId);
    setPageError(null);
    try {
      await api.post(`/api/posts/${postId}/share`);
      await refresh();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to share");
    } finally {
      sharingRef.current = false;
      setSharingPostId(null);
    }
  }

  async function confirmDeletePost() {
    if (!pendingDeleteId || deleting || deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setPageError(null);
    try {
      await api.delete(`/api/posts/${pendingDeleteId}`);
      removePost(pendingDeleteId);
      setPendingDeleteId(null);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }

  const displayError = pageError ?? error;

  if (authLoading) {
    return (
      <section className="feed-page space-y-4">
        <FeedPostSkeleton />
        <FeedPostSkeleton />
      </section>
    );
  }

  if (!user) {
    return (
      <section className="feed-page space-y-4">
        <FeedWelcomeCard />
      </section>
    );
  }

  return (
    <section className="feed-page space-y-6">
      <FeedComposer
        user={user}
        onPosted={() => void refresh()}
        onError={(message) => setPageError(message || null)}
      />

      {displayError && (
        <p className="feed-alert px-4 py-3 text-sm text-muted-foreground" role="alert">
          {displayError}
        </p>
      )}

      {loading && posts.length === 0 ? (
        <div className="space-y-5">
          <FeedPostSkeleton />
          <FeedPostSkeleton />
          <FeedPostSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <FeedEmptyState />
      ) : (
        <ul className="space-y-5">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard
                post={post}
                currentUserId={user.id}
                showActionLabels
                sharingPostId={sharingPostId}
                onDelete={setPendingDeleteId}
                onShare={(postId) => void onShare(postId)}
                onReactionSummaryChange={patchPostSummary}
              />
            </li>
          ))}
        </ul>
      )}

      {!loading && posts.length > 0 && (
        <div ref={loadMoreRef} className="flex min-h-10 items-center justify-center py-3">
          {loadingMore && <p className="text-sm text-muted-foreground">Loading more…</p>}
          {!loadingMore && !hasMore && (
            <p className="feed-end-divider w-full max-w-sm">You&apos;re all caught up</p>
          )}
        </div>
      )}

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
