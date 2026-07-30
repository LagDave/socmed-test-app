const SIZE_CLASS = {
  sm: "h-10 w-10 text-sm",
  md: "h-16 w-16 text-xl",
  lg: "h-24 w-24 text-3xl",
} as const;

export type ProfileAvatarSize = keyof typeof SIZE_CLASS;

export function ProfileAvatar({
  displayName,
  avatarUrl,
  size = "lg",
}: {
  displayName: string;
  avatarUrl: string | null;
  size?: ProfileAvatarSize;
}) {
  const dim = SIZE_CLASS[size];
  const letter = displayName.trim().slice(0, 1).toUpperCase() || "?";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`${dim} shrink-0 rounded-full border border-border object-cover shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full border border-border bg-secondary font-semibold text-foreground shadow-sm`}
      aria-hidden="true"
    >
      {letter}
    </div>
  );
}
