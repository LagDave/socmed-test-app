import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Camera, ImageIcon, MessageCircle, MoreHorizontal, Pencil, Settings, Share2, Trash2, UserRound, Eye, Sparkles } from "lucide-react";
import { api } from "@/api/client";
import { openConversationWithUsername } from "@/api/messages";
import type { PostView, PublicUser, ReactionSummary } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { PhotoUpdateDialog } from "@/components/PhotoUpdateDialog";
import { PostCard } from "@/components/PostCard";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ViewProfilePictureDialog } from "@/components/ViewProfilePictureDialog";
import { ViewCoverPhotoDialog } from "@/components/ViewCoverPhotoDialog";
import { Button } from "@/components/ui/button";

function toAbsoluteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${window.location.origin}${trimmed}`;
  return trimmed;
}

type ProfileAvatarMenuProps = {
  displayName: string;
  avatarUrl: string | null;
  canEdit: boolean;
  onChangePicture: () => void;
  onViewPicture: () => void;
  onRemovePicture: () => void;
};

function ProfileAvatarMenu({
  displayName,
  avatarUrl,
  canEdit,
  onChangePicture,
  onViewPicture,
  onRemovePicture,
}: ProfileAvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Profile picture options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setOpen((v) => !v)}
      >
        <ProfileAvatar
          displayName={displayName}
          avatarUrl={avatarUrl}
          size="xl"
          className="bg-card shadow-lg ring-4 ring-card transition-transform duration-200 group-hover:scale-[1.02]"
        />
        {canEdit && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Camera className="size-6 text-white" aria-hidden="true" />
          </span>
        )}
      </button>
      {open && (
        <div role="menu" className="profile-dropdown-menu animate-menu-enter absolute left-full top-1/2 z-30 ml-2 min-w-56 -translate-y-1/2">
          {canEdit && (
            <button type="button" role="menuitem" className="profile-dropdown-item" onClick={() => run(onChangePicture)}>
              <Camera className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              Change profile picture
            </button>
          )}
          {canEdit && <div className="profile-dropdown-divider" />}
          <button type="button" role="menuitem" className="profile-dropdown-item" onClick={() => run(onViewPicture)}>
            <Eye className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            View profile picture
          </button>
          {canEdit && (
            <>
              <div className="profile-dropdown-divider" />
              <button
                type="button"
                role="menuitem"
                disabled={!avatarUrl}
                className="profile-dropdown-item text-destructive/90"
                onClick={() => run(onRemovePicture)}
              >
                <Trash2 className="size-4 shrink-0" aria-hidden="true" />
                Remove profile picture
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

type ProfileMenuProps = {
  showEditProfile: boolean;
  hasCover: boolean;
  onEditProfile: () => void;
  onViewCover: () => void;
  onRemoveCover: () => void;
  onViewProfile: () => void;
  onCopyLink: () => void;
};

function ProfileOverflowMenu({
  showEditProfile,
  hasCover,
  onEditProfile,
  onViewCover,
  onRemoveCover,
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
    <div ref={rootRef} className="relative shrink-0">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Profile options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="size-9 rounded-full bg-card/95 text-card-foreground shadow-md ring-1 ring-border/60 backdrop-blur-sm hover:bg-card"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="size-5" />
      </Button>
      {open && (
        <div role="menu" className="profile-dropdown-menu animate-menu-enter absolute right-0 top-full z-30 mt-1.5 min-w-56">
          {showEditProfile && (
            <button type="button" role="menuitem" className="profile-dropdown-item" onClick={() => run(onEditProfile)}>
              <Pencil className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              Edit profile
            </button>
          )}
          {showEditProfile && hasCover && (
            <button type="button" role="menuitem" className="profile-dropdown-item" onClick={() => run(onViewCover)}>
              <Eye className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              View cover photo
            </button>
          )}
          {showEditProfile && hasCover && (
            <button
              type="button"
              role="menuitem"
              className="profile-dropdown-item text-destructive/90"
              onClick={() => run(onRemoveCover)}
            >
              <Trash2 className="size-4 shrink-0" aria-hidden="true" />
              Remove cover photo
            </button>
          )}
          {(showEditProfile && hasCover) && <div className="profile-dropdown-divider" />}
          <button type="button" role="menuitem" className="profile-dropdown-item" onClick={() => run(onViewProfile)}>
            <UserRound className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            View profile
          </button>
          <button
            type="button"
            role="menuitem"
            className="profile-dropdown-item"
            onClick={() =>
              run(() => {
                void navigate("/settings");
              })
            }
          >
            <Settings className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            Account settings
          </button>
          <button
            type="button"
            role="menuitem"
            className="profile-dropdown-item"
            onClick={() =>
              run(() => {
                void onCopyLink();
              })
            }
          >
            <Share2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            Copy profile link
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
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [posts, setPosts] = useState<PostView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [menuNotice, setMenuNotice] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [coverUrlInput, setCoverUrlInput] = useState("");
  const [isMutual, setIsMutual] = useState(false);
  const [avatarPostCaption, setAvatarPostCaption] = useState("");
  const [coverPostCaption, setCoverPostCaption] = useState("");
  const [pendingPhotoUpdate, setPendingPhotoUpdate] = useState<{
    kind: "avatar" | "cover";
    file: File;
    previewUrl: string;
    caption: string;
  } | null>(null);
  const [photoUpdateError, setPhotoUpdateError] = useState<string | null>(null);
  const [photoUpdateBusy, setPhotoUpdateBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewAvatarOpen, setViewAvatarOpen] = useState(false);
  const [viewCoverOpen, setViewCoverOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);

  const isSelf = Boolean(me && profile && me.id === profile.id);
  const isPublicPreview = searchParams.get("view") === "public";
  const canEditAvatar = isSelf && !isPublicPreview;

  useEffect(() => {
    if (!username) return;
    void api
      .get<{ user: PublicUser }>(`/api/users/${username}`)
      .then((d) => {
        setProfile(d.user);
        setDisplayName(d.user.displayName);
        setBio(d.user.bio || "");
        setEditUsername(d.user.username || "");
        setAvatarUrlInput(toAbsoluteUrl(d.user.avatarUrl || ""));
        setCoverUrlInput(toAbsoluteUrl(d.user.coverUrl || ""));
      })
      .catch((e: Error) => setError(e.message));
  }, [username]);

  useEffect(() => {
    if (!username) return;
    setPostsError(null);
    void api
      .get<{ posts: PostView[] }>(`/api/users/${username}/posts`)
      .then((d) => setPosts(d.posts))
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
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setEditError(null);
    const nextAvatarUrl = toAbsoluteUrl(avatarUrlInput) || null;
    const nextCoverUrl = toAbsoluteUrl(coverUrlInput) || null;
    const avatarChanged = nextAvatarUrl !== toAbsoluteUrl(profile?.avatarUrl || "");
    const coverChanged = nextCoverUrl !== toAbsoluteUrl(profile?.coverUrl || "");
    try {
      const payload: Record<string, unknown> = {
        displayName,
        username: editUsername,
        bio,
        avatarUrl: nextAvatarUrl,
        coverUrl: nextCoverUrl,
      };
      if (avatarChanged && nextAvatarUrl) {
        payload.avatarPostCaption = avatarPostCaption.trim() || null;
      }
      if (coverChanged && nextCoverUrl) {
        payload.coverPostCaption = coverPostCaption.trim() || null;
      }
      const data = await api.patch<{ user: PublicUser }>("/api/me/profile", payload);
      setProfile(data.user);
      setUser(data.user);
      setAvatarUrlInput(toAbsoluteUrl(data.user.avatarUrl || ""));
      setCoverUrlInput(toAbsoluteUrl(data.user.coverUrl || ""));
      setAvatarPostCaption("");
      setCoverPostCaption("");
      setEditOpen(false);
      if (avatarChanged || coverChanged) {
        await reloadPosts();
      }
      if (data.user.username && data.user.username !== username) {
        navigate(`/u/${data.user.username}`, { replace: true });
      }
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Save failed");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function onAvatarFile(file: File | null) {
    if (!file) return;
    setEditError(null);
    try {
      const data = await api.upload<{ url: string }>("/api/uploads", file);
      setAvatarUrlInput(toAbsoluteUrl(data.url));
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function onCoverFile(file: File | null) {
    if (!file) return;
    setEditError(null);
    try {
      const data = await api.upload<{ url: string }>("/api/uploads", file);
      setCoverUrlInput(toAbsoluteUrl(data.url));
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function queuePhotoUpdate(kind: "avatar" | "cover", file: File) {
    setPhotoUpdateError(null);
    setPendingPhotoUpdate((current) => {
      if (current?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return {
        kind,
        file,
        previewUrl: URL.createObjectURL(file),
        caption: "",
      };
    });
  }

  function closePhotoUpdateDialog() {
    setPendingPhotoUpdate((current) => {
      if (current?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return null;
    });
    setPhotoUpdateError(null);
  }

  async function confirmPhotoUpdate() {
    if (!pendingPhotoUpdate || photoUpdateBusy) return;
    setPhotoUpdateBusy(true);
    setPhotoUpdateError(null);
    setError(null);
    const { kind, file, caption } = pendingPhotoUpdate;
    try {
      const data = await api.upload<{ url: string }>("/api/uploads", file);
      const nextUrl = toAbsoluteUrl(data.url);
      const payload =
        kind === "avatar"
          ? { avatarUrl: nextUrl, avatarPostCaption: caption.trim() || null }
          : { coverUrl: nextUrl, coverPostCaption: caption.trim() || null };
      const updated = await api.patch<{ user: PublicUser }>("/api/me/profile", payload);
      setProfile(updated.user);
      setUser(updated.user);
      if (kind === "avatar") {
        setAvatarUrlInput(nextUrl);
      } else {
        setCoverUrlInput(nextUrl);
      }
      await reloadPosts();
      setMenuNotice(kind === "avatar" ? "Profile picture updated" : "Cover photo updated");
      closePhotoUpdateDialog();
    } catch (err) {
      setPhotoUpdateError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setPhotoUpdateBusy(false);
    }
  }

  async function onHeaderAvatarFile(file: File | null) {
    if (!file) return;
    queuePhotoUpdate("avatar", file);
  }

  async function onHeaderCoverFile(file: File | null) {
    if (!file) return;
    queuePhotoUpdate("cover", file);
  }

  async function removeAvatar() {
    setError(null);
    setMenuNotice(null);
    try {
      const data = await api.patch<{ user: PublicUser }>("/api/me/profile", { avatarUrl: null });
      setProfile(data.user);
      setUser(data.user);
      setAvatarUrlInput("");
      setMenuNotice("Profile picture removed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove picture");
    }
  }

  async function removeCover() {
    setError(null);
    setMenuNotice(null);
    try {
      const data = await api.patch<{ user: PublicUser }>("/api/me/profile", { coverUrl: null });
      setProfile(data.user);
      setUser(data.user);
      setCoverUrlInput("");
      setMenuNotice("Cover photo removed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove cover photo");
    }
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
    setError(null);
    try {
      await api.delete(`/api/posts/${pendingDeleteId}`);
      setPendingDeleteId(null);
      await reloadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }

  function openEditDialog() {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setBio(profile.bio || "");
    setEditUsername(profile.username || "");
    setAvatarUrlInput(toAbsoluteUrl(profile.avatarUrl || ""));
    setCoverUrlInput(toAbsoluteUrl(profile.coverUrl || ""));
    setAvatarPostCaption("");
    setCoverPostCaption("");
    setEditError(null);
    setEditOpen(true);
  }

  if (!profile) {
    if (error) {
      return <p className="text-sm text-muted-foreground">{error}</p>;
    }
    return (
      <div className="feed-card profile-header-card overflow-hidden">
        <div className="profile-cover h-28 sm:h-32" />
        <div className="px-5 pb-6 pt-16">
          <div className="profile-skeleton-shimmer h-7 w-48 rounded-lg" />
          <div className="profile-skeleton-shimmer mt-2 h-4 w-28 rounded-md" />
          <div className="profile-skeleton-shimmer mt-5 h-16 w-full max-w-md rounded-xl" />
        </div>
      </div>
    );
  }

  const handle = profile.username ? `@${profile.username}` : "@no-username";
  const profilePath = profile.username ? `/u/${profile.username}` : "/u/me";
  const postCount = posts.length;
  const headerAvatarUrl = profile.avatarUrl;
  const headerCoverUrl = profile.coverUrl;
  const avatarPhotoChanged =
    Boolean(toAbsoluteUrl(avatarUrlInput)) &&
    toAbsoluteUrl(avatarUrlInput) !== toAbsoluteUrl(profile.avatarUrl || "");
  const coverPhotoChanged =
    Boolean(toAbsoluteUrl(coverUrlInput)) &&
    toAbsoluteUrl(coverUrlInput) !== toAbsoluteUrl(profile.coverUrl || "");

  return (
    <>
      <section className="animate-fade-up space-y-5">
      <header className="feed-card profile-header-card text-card-foreground">
        <div className="relative">
          <div className="relative h-40 overflow-hidden sm:h-52">
            {headerCoverUrl ? (
              <img
                src={headerCoverUrl}
                alt=""
                className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out hover:scale-[1.02]"
              />
            ) : (
              <div className="profile-cover absolute inset-0" aria-hidden="true" />
            )}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 via-black/10 to-transparent"
              aria-hidden="true"
            />
            {canEditAvatar && (
              <>
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void onHeaderCoverFile(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => coverFileInputRef.current?.click()}
                  className="group absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/25 focus-visible:bg-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  aria-label="Change cover photo"
                  title="Change cover photo"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-black/55 text-white opacity-0 shadow-lg transition-all group-hover:opacity-100 group-focus-visible:opacity-100">
                    <ImageIcon className="size-4" aria-hidden="true" />
                  </span>
                </button>
              </>
            )}
          </div>
          {isSelf && (
            <div className="absolute right-3 top-3 z-20">
              <ProfileOverflowMenu
                showEditProfile={!isPublicPreview}
                hasCover={Boolean(profile.coverUrl)}
                onEditProfile={openEditDialog}
                onViewCover={() => setViewCoverOpen(true)}
                onRemoveCover={() => void removeCover()}
                onViewProfile={() => {
                  setSearchParams({ view: "public" }, { replace: true });
                  setMenuNotice(null);
                }}
                onCopyLink={() => void copyProfileLink()}
              />
            </div>
          )}
        </div>

        <div className="relative overflow-visible px-5 pb-5">
          <div className="absolute left-5 top-0 z-10 -translate-y-1/2">
            {canEditAvatar || headerAvatarUrl ? (
              <>
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void onHeaderAvatarFile(e.target.files?.[0] || null)}
                />
                <ProfileAvatarMenu
                  displayName={profile.displayName}
                  avatarUrl={headerAvatarUrl}
                  canEdit={canEditAvatar}
                  onChangePicture={() => avatarFileInputRef.current?.click()}
                  onViewPicture={() => setViewAvatarOpen(true)}
                  onRemovePicture={() => void removeAvatar()}
                />
              </>
            ) : (
              <ProfileAvatar
                displayName={profile.displayName}
                avatarUrl={headerAvatarUrl}
                size="xl"
                className="bg-card shadow-lg ring-4 ring-card"
              />
            )}
          </div>

          <div className="pt-16 sm:pl-36 sm:pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{profile.displayName}</h1>
                <p className="mt-1 truncate text-sm font-medium text-muted-foreground">{handle}</p>
              </div>

              {!isSelf && profile.username && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {!isMutual && (
                    <Button type="button" className="min-w-28" onClick={() => void sendFriendRequest()}>
                      Add friend
                    </Button>
                  )}
                  {isMutual && (
                    <Button type="button" variant="outline" className="gap-2" onClick={() => void openMessage()}>
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Message
                    </Button>
                  )}
                </div>
              )}

              {isSelf && isPublicPreview && (
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => {
                    searchParams.delete("view");
                    setSearchParams(searchParams, { replace: true });
                  }}
                >
                  Back to edit
                </Button>
              )}
            </div>

            {profile.bio && (
              <div className="profile-bio-panel mt-4 max-w-prose">
                <p className="text-[15px] leading-relaxed text-foreground/90">{profile.bio}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {error && <p className="px-1 text-sm text-muted-foreground">{error}</p>}

      {isSelf && isPublicPreview && (
        <p className="px-1 text-center text-sm text-muted-foreground">
          Public preview · <Link className="underline underline-offset-2" to={profilePath}>Open shareable URL</Link>
        </p>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-border/70 px-1 pb-3">
          <h2 className="text-lg font-semibold tracking-tight">Posts</h2>
          {postCount > 0 && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
              {postCount} total
            </span>
          )}
        </div>

        <ul className="space-y-3">
          {posts.map((p, index) => (
            <li
              key={p.id}
              className="feed-card timeline-post-card animate-fade-up px-4 py-3.5"
              style={{ animationDelay: `${Math.min(index * 45, 270)}ms` }}
            >
              {me && (
                <PostCard
                  post={p}
                  viewerId={me.id}
                  onDeleteRequest={setPendingDeleteId}
                  onReactionChange={patchPostSummary}
                />
              )}
            </li>
          ))}
          {posts.length === 0 && !postsError && (
            <li className="feed-card profile-empty-state px-6 py-14 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-4 text-base font-semibold text-foreground">No posts yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {isSelf
                  ? "Share something from the Feed and it will show up here on your timeline."
                  : "This profile has not posted anything yet."}
              </p>
            </li>
          )}
          {postsError && (
            <li className="feed-card px-6 py-8 text-center text-sm text-muted-foreground">{postsError}</li>
          )}
        </ul>
      </div>
      </section>

      <ViewProfilePictureDialog
        open={viewAvatarOpen}
        displayName={profile.displayName}
        avatarUrl={headerAvatarUrl}
        onClose={() => setViewAvatarOpen(false)}
      />

      <ViewCoverPhotoDialog
        open={viewCoverOpen}
        displayName={profile.displayName}
        coverUrl={headerCoverUrl}
        onClose={() => setViewCoverOpen(false)}
      />

      <PhotoUpdateDialog
        open={pendingPhotoUpdate !== null}
        kind={pendingPhotoUpdate?.kind ?? "avatar"}
        previewUrl={pendingPhotoUpdate?.previewUrl ?? ""}
        caption={pendingPhotoUpdate?.caption ?? ""}
        error={photoUpdateError}
        busy={photoUpdateBusy}
        onCaptionChange={(value) =>
          setPendingPhotoUpdate((current) => (current ? { ...current, caption: value } : current))
        }
        onConfirm={() => void confirmPhotoUpdate()}
        onCancel={closePhotoUpdateDialog}
      />

      <EditProfileDialog
        open={editOpen}
        displayName={displayName}
        username={editUsername}
        bio={bio}
        avatarUrlInput={avatarUrlInput}
        coverUrlInput={coverUrlInput}
        showAvatarCaption={avatarPhotoChanged}
        showCoverCaption={coverPhotoChanged}
        avatarPostCaption={avatarPostCaption}
        coverPostCaption={coverPostCaption}
        error={editError}
        busy={saving}
        onDisplayNameChange={setDisplayName}
        onUsernameChange={setEditUsername}
        onBioChange={setBio}
        onAvatarUrlChange={setAvatarUrlInput}
        onCoverUrlChange={setCoverUrlInput}
        onAvatarPostCaptionChange={setAvatarPostCaption}
        onCoverPostCaptionChange={setCoverPostCaption}
        onAvatarFile={(file) => void onAvatarFile(file)}
        onCoverFile={(file) => void onCoverFile(file)}
        onSubmit={(e) => void onSave(e)}
        onCancel={() => {
          if (!saving) setEditOpen(false);
        }}
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
          className="animate-toast-in fixed bottom-5 right-5 z-50 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-[0_12px_32px_rgba(0,0,0,0.14)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
        >
          {menuNotice}
        </div>
      )}
    </>
  );
}
