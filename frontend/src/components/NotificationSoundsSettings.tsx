import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  Heart,
  MessageSquare,
  Music2,
  PartyPopper,
  Play,
  Sparkles,
  Sun,
  Volume2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ACTIVITY_SOUND_GROUPS,
  ACTIVITY_SOUND_OPTIONS,
  MESSAGE_SOUND_GROUPS,
  MESSAGE_SOUND_OPTIONS,
  previewActivitySound,
  previewMessageSound,
  readNotificationSoundPreferences,
  saveNotificationSoundPreferences,
  type ActivitySoundGroup,
  type ActivitySoundId,
  type MessageSoundGroup,
  type MessageSoundId,
} from "@/lib/notificationSounds";
import { cn } from "@/lib/utils";

const MESSAGE_GROUP_META: Record<
  MessageSoundGroup,
  { icon: typeof Music2; blurb: string }
> = {
  Classic: { icon: Music2, blurb: "Clean and minimal" },
  Cute: { icon: Sparkles, blurb: "Soft and playful" },
  Happy: { icon: Sun, blurb: "Warm and uplifting" },
  Excited: { icon: PartyPopper, blurb: "Bright and energetic" },
};

const ACTIVITY_GROUP_META: Record<
  ActivitySoundGroup,
  { icon: typeof Bell; blurb: string }
> = {
  Digital: { icon: Zap, blurb: "Beeps, chirps, and alerts" },
  Tone: { icon: Bell, blurb: "Classic dings, pops, and stingers" },
};

function messageSoundLabel(id: MessageSoundId | null): string {
  if (!id) return "None chosen";
  return MESSAGE_SOUND_OPTIONS.find((option) => option.id === id)?.label ?? id;
}

function activitySoundLabel(id: ActivitySoundId): string {
  return ACTIVITY_SOUND_OPTIONS.find((option) => option.id === id)?.label ?? id;
}

function MessageSoundPickerGrid({
  selectedId,
  onSelect,
}: {
  selectedId: MessageSoundId | null;
  onSelect: (id: MessageSoundId) => void;
}) {
  return (
    <>
      {MESSAGE_SOUND_GROUPS.map((group) => {
        const meta = MESSAGE_GROUP_META[group];
        const GroupIcon = meta.icon;
        const options = MESSAGE_SOUND_OPTIONS.filter((option) => option.group === group);
        return (
          <div key={group} className="space-y-3">
            <div className="flex items-center gap-2">
              <GroupIcon className="size-4 text-muted-foreground" strokeWidth={1.75} />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {group}
                </h4>
                <p className="text-[11px] text-muted-foreground">{meta.blurb}</p>
              </div>
            </div>

            <ul className="grid gap-2 sm:grid-cols-2">
              {options.map((option) => {
                const selected = selectedId === option.id;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(option.id)}
                      className={cn(
                        "group flex h-full w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all",
                        selected
                          ? "border-foreground bg-accent/50 shadow-sm ring-1 ring-foreground/10"
                          : "border-border bg-background hover:border-foreground/20 hover:bg-accent/25"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
                          selected
                            ? "bg-foreground text-background"
                            : "bg-secondary text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {selected ? (
                          <Check className="size-4" strokeWidth={2.25} aria-hidden="true" />
                        ) : (
                          <Play
                            className="size-3.5 translate-x-0.5"
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm font-medium">{option.label}</span>
                          {group === "Cute" && (
                            <Heart
                              className="size-3 text-muted-foreground/70"
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                          {option.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </>
  );
}

function ActivitySoundPickerGrid({
  selectedId,
  onSelect,
}: {
  selectedId: ActivitySoundId;
  onSelect: (id: ActivitySoundId) => void;
}) {
  return (
    <>
      {ACTIVITY_SOUND_GROUPS.map((group) => {
        const meta = ACTIVITY_GROUP_META[group];
        const GroupIcon = meta.icon;
        const options = ACTIVITY_SOUND_OPTIONS.filter((option) => option.group === group);
        return (
          <div key={group} className="space-y-3">
            <div className="flex items-center gap-2">
              <GroupIcon className="size-4 text-muted-foreground" strokeWidth={1.75} />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {group}
                </h4>
                <p className="text-[11px] text-muted-foreground">{meta.blurb}</p>
              </div>
            </div>

            <ul className="grid gap-2 sm:grid-cols-2">
              {options.map((option) => {
                const selected = selectedId === option.id;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(option.id)}
                      className={cn(
                        "group flex h-full w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all",
                        selected
                          ? "border-foreground bg-accent/50 shadow-sm ring-1 ring-foreground/10"
                          : "border-border bg-background hover:border-foreground/20 hover:bg-accent/25"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
                          selected
                            ? "bg-foreground text-background"
                            : "bg-secondary text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {selected ? (
                          <Check className="size-4" strokeWidth={2.25} aria-hidden="true" />
                        ) : (
                          <Play
                            className="size-3.5 translate-x-0.5"
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-sm font-medium">{option.label}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                          {option.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </>
  );
}

export function NotificationSoundsSettings() {
  const [saved, setSaved] = useState(() => readNotificationSoundPreferences());
  const [draftEnabled, setDraftEnabled] = useState(saved.enabled);
  const [draftMessageSoundId, setDraftMessageSoundId] = useState<MessageSoundId | null>(
    saved.messageSoundId
  );
  const [draftActivitySoundId, setDraftActivitySoundId] = useState<ActivitySoundId>(
    saved.activitySoundId
  );
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const hasUnsavedChanges =
    draftEnabled !== saved.enabled ||
    draftMessageSoundId !== saved.messageSoundId ||
    draftActivitySoundId !== saved.activitySoundId;

  useEffect(() => {
    const sync = () => {
      const prefs = readNotificationSoundPreferences();
      setSaved(prefs);
      setDraftEnabled(prefs.enabled);
      setDraftMessageSoundId(prefs.messageSoundId);
      setDraftActivitySoundId(prefs.activitySoundId);
    };
    window.addEventListener("socmed:sounds-preference", sync);
    return () => window.removeEventListener("socmed:sounds-preference", sync);
  }, []);

  useEffect(() => {
    if (!saveNotice) return;
    const id = window.setTimeout(() => setSaveNotice(null), 3000);
    return () => window.clearTimeout(id);
  }, [saveNotice]);

  function selectMessageSound(id: MessageSoundId) {
    setDraftMessageSoundId(id);
    previewMessageSound(id);
  }

  function selectActivitySound(id: ActivitySoundId) {
    setDraftActivitySoundId(id);
    previewActivitySound(id);
  }

  function saveSoundSettings() {
    if (draftEnabled && !draftMessageSoundId) return;
    saveNotificationSoundPreferences({
      enabled: draftEnabled,
      messageSoundId: draftMessageSoundId,
      activitySoundId: draftActivitySoundId,
    });
    setSaved({
      enabled: draftEnabled,
      messageSoundId: draftMessageSoundId,
      activitySoundId: draftActivitySoundId,
    });
    setSaveNotice("Saved — your notification sounds are now active.");
    if (draftEnabled) {
      if (draftMessageSoundId) previewMessageSound(draftMessageSoundId);
      previewActivitySound(draftActivitySoundId);
    }
  }

  return (
    <section className="feed-card overflow-hidden text-card-foreground">
      <div className="border-b border-border/80 bg-secondary/40 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border/80">
            <Volume2 className="size-4 text-foreground" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold tracking-tight">Notification sounds</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Message and activity sounds use separate libraries — pick a different tone for each.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <button
          type="button"
          role="switch"
          aria-checked={draftEnabled}
          onClick={() => setDraftEnabled((on) => !on)}
          className={cn(
            "flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 text-left transition-colors",
            draftEnabled
              ? "border-foreground/15 bg-accent/30"
              : "border-border bg-background hover:bg-accent/20"
          )}
        >
          <span className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-secondary">
              <Bell className="size-4 text-foreground" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-medium">Play notification sounds</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {saved.enabled ? "On — customize sounds below" : "Currently off"}
              </span>
            </span>
          </span>
          <span
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors",
              draftEnabled ? "bg-foreground" : "bg-muted"
            )}
            aria-hidden="true"
          >
            <span
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-background shadow-sm transition-transform",
                draftEnabled ? "translate-x-5" : "translate-x-0.5"
              )}
            />
          </span>
        </button>

        {draftEnabled && (
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <MessageSquare className="size-4 text-foreground" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-medium">Message sounds</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    For direct messages only. Active:{" "}
                    <span className="font-medium text-foreground">
                      {messageSoundLabel(saved.messageSoundId)}
                    </span>
                  </p>
                </div>
              </div>
              <MessageSoundPickerGrid
                selectedId={draftMessageSoundId}
                onSelect={selectMessageSound}
              />
            </div>

            <div className="space-y-5 border-t border-border pt-8">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <Bell className="size-4 text-foreground" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-medium">Activity sounds</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    For friend requests, comments, and replies — separate from message tones. Active:{" "}
                    <span className="font-medium text-foreground">
                      {activitySoundLabel(saved.activitySoundId)}
                    </span>
                  </p>
                </div>
              </div>
              <ActivitySoundPickerGrid
                selectedId={draftActivitySoundId}
                onSelect={selectActivitySound}
              />
            </div>
          </div>
        )}

        <div
          className={cn(
            "rounded-xl border px-4 py-3.5",
            hasUnsavedChanges ? "border-foreground/20 bg-accent/25" : "border-border bg-secondary/30"
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {hasUnsavedChanges ? (
                <p className="text-sm text-foreground">You have unsaved changes.</p>
              ) : saveNotice ? (
                <p className="text-sm font-medium text-foreground">{saveNotice}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Messages:{" "}
                  <span className="font-medium text-foreground">
                    {messageSoundLabel(saved.messageSoundId)}
                  </span>
                  {" · "}
                  Activity:{" "}
                  <span className="font-medium text-foreground">
                    {activitySoundLabel(saved.activitySoundId)}
                  </span>
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">
                Click anywhere once after sign-in if audio does not play.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={!draftEnabled}
                variant="outline"
                onPointerDown={() => {
                  if (draftMessageSoundId) previewMessageSound(draftMessageSoundId);
                  previewActivitySound(draftActivitySoundId);
                }}
              >
                <Play className="size-3.5" aria-hidden="true" />
                Preview both
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!hasUnsavedChanges || (draftEnabled && !draftMessageSoundId)}
                onClick={saveSoundSettings}
              >
                Save sound settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
