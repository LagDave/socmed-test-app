import { useEffect, useRef, useState } from "react";
import { Camera, Eye, Trash2 } from "lucide-react";
import type { PublicUser } from "@/api/types";
import { OnlinePresenceIndicator } from "@/components/OnlinePresenceIndicator";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ProfileHeaderPresence } from "@/components/ProfileHeaderPresence";
import { useFriendOnline } from "@/hooks/useFriendOnline";

type ProfileAvatarMenuProps = {
  user: PublicUser;
  canEdit: boolean;
  onChangePicture: () => void;
  onViewPicture: () => void;
  onRemovePicture: () => void;
};

export function ProfileAvatarMenu({
  user,
  canEdit,
  onChangePicture,
  onViewPicture,
  onRemovePicture,
}: ProfileAvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const canViewPresence = user.isOnline !== undefined;
  const isOnline = useFriendOnline(user.id, user.isOnline, canViewPresence);
  const canOpenMenu = canEdit || Boolean(user.avatarUrl);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
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

  const avatar = (
    <>
      <ProfileAvatar
        displayName={user.displayName}
        avatarUrl={user.avatarUrl}
        size="xl"
        className="bg-card shadow-lg ring-4 ring-card transition-transform duration-200 group-hover:scale-[1.02]"
      />
      {isOnline && (
        <OnlinePresenceIndicator className="bottom-[5%] right-[5%] size-6 border-[3px]" />
      )}
      <ProfileHeaderPresence user={user} />
    </>
  );

  if (!canOpenMenu) {
    return <span className="relative block">{avatar}</span>;
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Profile picture options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setOpen((value) => !value)}
      >
        {avatar}
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
                disabled={!user.avatarUrl}
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
