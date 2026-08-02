import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FeedComposer } from "@/components/FeedComposer";
import { FeedEmptyState, FeedPostSkeleton } from "@/components/FeedEmptyState";
import { PostCard } from "@/components/PostCard";
import { SharePostDialog } from "@/components/SharePostDialog";
import { Button } from "@/components/ui/button";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { api } from "@/api/client";
import type { PostView } from "@/api/types";

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
  const [shareTarget, setShareTarget] = useState<PostView | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const shareBusyRef = useRef(false);
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

  function openShare(postId: string) {
    const target = posts.find((p) => p.id === postId) ?? null;
    if (target) {
      setShareError(null);
      setShareTarget(target);
    }
  }

  async function confirmShare(caption: string) {
    if (!shareTarget || shareBusyRef.current) return;
    shareBusyRef.current = true;
    setShareBusy(true);
    setShareError(null);
    setPageError(null);
    try {
      await api.post(`/api/posts/${shareTarget.id}/share`, { body: caption });
      setShareTarget(null);
      await refresh();
    } catch (err) {
      setShareError(err instanceof Error ? err.message : "Failed to share");
    } finally {
      shareBusyRef.current = false;
      setShareBusy(false);
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
        <div className="feed-card px-6 py-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome to SocMed</h1>
          <p className="mt-3 text-muted-foreground">Sign in to see posts from you and your friends.</p>
          <Button asChild className="mt-6">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="feed-page space-y-5">
      <FeedComposer
        user={user}
        onPosted={() => void refresh()}
        onError={(message) => setPageError(message || null)}
      />

      {displayError && (
        <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground" role="alert">
          {displayError}
        </p>
      )}

      {loading && posts.length === 0 ? (
        <div className="space-y-4">
          <FeedPostSkeleton />
          <FeedPostSkeleton />
          <FeedPostSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <FeedEmptyState />
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard
                post={post}
                currentUserId={user.id}
                onDelete={setPendingDeleteId}
                onShare={openShare}
                onReactionSummaryChange={patchPostSummary}
              />
            </li>
          ))}
        </ul>
      )}

      {!loading && posts.length > 0 && (
        <div ref={loadMoreRef} className="flex min-h-10 items-center justify-center py-2">
          {loadingMore && <p className="text-sm text-muted-foreground">Loading more…</p>}
          {!loadingMore && !hasMore && (
            <p className="text-xs text-muted-foreground">You&apos;re all caught up</p>
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

      {user && (
        <SharePostDialog
          open={shareTarget !== null}
          post={shareTarget}
          user={user}
          busy={shareBusy}
          error={shareError}
          onConfirm={(caption) => void confirmShare(caption)}
          onCancel={() => {
            if (!shareBusy) {
              setShareTarget(null);
              setShareError(null);
            }
          }}
        />
      )}
    </section>
  );
}
