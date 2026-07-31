import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MessageCircle, MoreHorizontal } from "lucide-react";
import { api } from "@/api/client";
import { openConversationWithUsername } from "@/api/messages";
import type { PostView, PublicUser, ReactionSummary } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { PostCard } from "@/components/PostCard";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Button } from "@/components/ui/button";

type ProfileMenuProps = {
  showEditProfile: boolean;
  onEditProfile: () => void;
  onViewProfile: () => void;
  onCopyLink: () => void;
};

function ProfileOverflowMenu({
  showEditProfile,
  onEditProfile,
  onViewProfile,
  onCopyLink,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div ref={rootRef} className="relative ml-auto shrink-0 self-start">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Profile options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="size-5" />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-56 overflow-hidden rounded-xl border border-border bg-card py-1 text-card-foreground shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        >
          {showEditProfile && (
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm hover:bg-accent"
              onClick={() => run(onEditProfile)}
            >
              Edit Profile
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm hover:bg-accent"
            onClick={() => run(onViewProfile)}
          >
            View Profile
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm hover:bg-accent"
            onClick={() =>
              run(() => {
                void navigate("/settings");
              })
            }
          >
            Account Settings
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm hover:bg-accent"
            onClick={() =>
              run(() => {
                void onCopyLink();
              })
            }
          >
            Copy Profile Link
          </button>
        </div>
      )}
    </div>
  );
}

export function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: me, setUser } = useAuth();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [posts, setPosts] = useState<PostView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [menuNotice, setMenuNotice] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [isMutual, setIsMutual] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const [sharingPostId, setSharingPostId] = useState<string | null>(null);
  const sharingRef = useRef(false);

  const isSelf = Boolean(me && profile && me.id === profile.id);
  const isPublicPreview = searchParams.get("view") === "public";

  useEffect(() => {
    if (!username) return;
    void api
      .get<{ user: PublicUser }>(`/api/users/${username}`)
      .then((d) => {
        setProfile(d.user);
        setDisplayName(d.user.displayName);
        setBio(d.user.bio || "");
        setEditUsername(d.user.username || "");
      })
      .catch((e: Error) => setError(e.message));
  }, [username]);

  useEffect(() => {
    if (!username) return;
    void api
      .get<{ posts: PostView[] }>(`/api/users/${username}/posts`)
      .then((d) => {
        setPosts(d.posts);
        setPostsError(null);
      })
      .catch((e: Error) => setPostsError(e.message));
  }, [username]);

  useEffect(() => {
    if (!me || !profile || me.id === profile.id) {
      setIsMutual(false);
      return;
    }
    let cancelled = false;
    void api
      .get<{ areFriends: boolean }>(`/api/friends/status/${profile.id}`)
      .then((d) => {
        if (!cancelled) setIsMutual(d.areFriends);
      })
      .catch(() => {
        if (!cancelled) setIsMutual(false);
      });
    return () => {
      cancelled = true;
    };
  }, [me, profile]);

  useEffect(() => {
    if (!menuNotice) return;
    const t = window.setTimeout(() => setMenuNotice(null), 2500);
    return () => window.clearTimeout(t);
  }, [menuNotice]);

  function patchPostSummary(postId: string, reactionSummary: ReactionSummary) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, reactionSummary } : p)));
  }

  async function reloadPosts() {
    if (!username) return;
    const data = await api.get<{ posts: PostView[] }>(`/api/users/${username}/posts`);
    setPosts(data.posts);
    setPostsError(null);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (editBusy) return;
    setEditBusy(true);
    setEditError(null);
    try {
      const data = await api.patch<{ user: PublicUser }>("/api/me/profile", {
        displayName,
        username: editUsername,
        bio,
      });
      setProfile(data.user);
      setUser(data.user);
      setEditOpen(false);
      setMenuNotice("Profile updated");
      if (data.user.username && data.user.username !== username) {
        navigate(`/u/${data.user.username}`, { replace: true });
      }
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setEditBusy(false);
    }
  }

  function openEditProfile() {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setBio(profile.bio || "");
    setEditUsername(profile.username || "");
    setEditError(null);
    setEditOpen(true);
  }

  function closeEditProfile() {
    if (editBusy) return;
    setEditOpen(false);
    setEditError(null);
  }

  async function copyProfileLink() {
    if (!profile?.username) return;
    const url = `${window.location.origin}/u/${profile.username}`;
    try {
      await navigator.clipboard.writeText(url);
      setMenuNotice("Profile link copied");
    } catch {
      setError("Could not copy link");
    }
  }

  async function sendFriendRequest() {
    if (!profile?.username) return;
    try {
      await api.post("/api/friends/request", { username: profile.username });
      alert("Request sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  }

  async function openMessage() {
    if (!profile?.username) return;
    setError(null);
    try {
      const id = await openConversationWithUsername(profile.username);
      navigate(`/messages/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open chat");
    }
  }

  async function confirmDeletePost() {
    if (!pendingDeleteId || deleting || deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setPostsError(null);
    try {
      await api.delete(`/api/posts/${pendingDeleteId}`);
      setPendingDeleteId(null);
      await reloadPosts();
    } catch (err) {
      setPostsError(err instanceof Error ? err.message : "Failed to delete post");
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }

  async function onShare(postId: string) {
    if (sharingRef.current) return;
    sharingRef.current = true;
    setSharingPostId(postId);
    setPostsError(null);
    try {
      await api.post(`/api/posts/${postId}/share`);
      await reloadPosts();
    } catch (err) {
      setPostsError(err instanceof Error ? err.message : "Failed to share");
    } finally {
      sharingRef.current = false;
      setSharingPostId(null);
    }
  }

  if (!profile) {
    return <p className="text-sm text-muted-foreground">{error || "Loading…"}</p>;
  }

  const handle = profile.username ? `@${profile.username}` : "@no-username";
  const profilePath = profile.username ? `/u/${profile.username}` : "/u/me";

  return (
    <section className="space-y-4">
      <header className="feed-card flex items-center gap-5 p-5 text-card-foreground">
        <ProfileAvatar displayName={profile.displayName} avatarUrl={profile.avatarUrl} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{profile.displayName}</h1>
          <p className="mt-0.5 truncate text-sm font-normal text-muted-foreground">{handle}</p>
          {profile.bio && (
            <p className="mt-3 max-w-prose text-sm text-foreground/90">{profile.bio}</p>
          )}
          {!isSelf && profile.username && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {!isMutual && (
                <Button type="button" onClick={() => void sendFriendRequest()}>
                  Add friend
                </Button>
              )}
              {isMutual && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label={`Message ${profile.displayName}`}
                  title="Message"
                  onClick={() => void openMessage()}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          )}
          {isSelf && isPublicPreview && (
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => {
                searchParams.delete("view");
                setSearchParams(searchParams, { replace: true });
              }}
            >
              Back to edit
            </Button>
          )}
        </div>
        {isSelf && (
          <ProfileOverflowMenu
            showEditProfile={!isPublicPreview}
            onEditProfile={openEditProfile}
            onViewProfile={() => {
              setSearchParams({ view: "public" }, { replace: true });
              setMenuNotice(null);
            }}
            onCopyLink={() => void copyProfileLink()}
          />
        )}
      </header>

      {error && <p className="px-1 text-sm text-muted-foreground">{error}</p>}

      {postsError && <p className="px-1 text-sm text-muted-foreground">{postsError}</p>}

      <ul className="space-y-4">
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            viewerId={me?.id ?? ""}
            onDeleteRequest={setPendingDeleteId}
            onReactionChange={patchPostSummary}
            onShareRequest={me ? (postId) => void onShare(postId) : undefined}
            sharingPostId={sharingPostId}
          />
        ))}
        {posts.length === 0 && !postsError && (
          <li className="feed-card px-3 py-6 text-center text-sm text-muted-foreground">No posts yet.</li>
        )}
      </ul>

      {isSelf && isPublicPreview && (
        <p className="px-1 text-center text-sm text-muted-foreground">
          Public preview · <Link className="underline underline-offset-2" to={profilePath}>Open shareable URL</Link>
        </p>
      )}

      <EditProfileDialog
        open={editOpen}
        busy={editBusy}
        error={editError}
        displayName={displayName}
        username={editUsername}
        bio={bio}
        onDisplayNameChange={setDisplayName}
        onUsernameChange={setEditUsername}
        onBioChange={setBio}
        onSave={(e) => void onSave(e)}
        onCancel={closeEditProfile}
      />

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

      {menuNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
        >
          {menuNotice}
        </div>
      )}
    </section>
  );
}
