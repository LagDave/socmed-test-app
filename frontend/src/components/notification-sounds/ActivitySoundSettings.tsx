import { useEffect, useState } from "react";
import { Bell, Play, Volume2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ACTIVITY_SOUND_GROUPS,
  ACTIVITY_SOUND_OPTIONS,
  previewActivitySound,
  readNotificationSoundPreferences,
  saveActivitySoundPreferences,
  type ActivitySoundGroup,
  type ActivitySoundId,
} from "@/lib/notificationSounds";
import { cn } from "@/lib/utils";
import { SoundSettingsPicker } from "./SoundSettingsPicker";

const ACTIVITY_GROUP_META: Record<ActivitySoundGroup, { icon: typeof Bell; blurb: string }> = {
  Digital: { icon: Zap, blurb: "Beeps, chirps, and alerts" },
  Tone: { icon: Bell, blurb: "Classic dings, pops, and stingers" },
};

function activitySoundLabel(id: ActivitySoundId | null): string {
  if (!id) return "No sound";
  return ACTIVITY_SOUND_OPTIONS.find((option) => option.id === id)?.label ?? id;
}

export function ActivitySoundSettings() {
  const [saved, setSaved] = useState(() => readNotificationSoundPreferences());
  const [draftEnabled, setDraftEnabled] = useState(saved.activityEnabled);
  const [draftSoundId, setDraftSoundId] = useState<ActivitySoundId | null>(saved.activitySoundId);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const hasUnsavedChanges =
    draftEnabled !== saved.activityEnabled || draftSoundId !== saved.activitySoundId;

  useEffect(() => {
    const sync = () => {
      const prefs = readNotificationSoundPreferences();
      setSaved(prefs);
      setDraftEnabled(prefs.activityEnabled);
      setDraftSoundId(prefs.activitySoundId);
    };
    window.addEventListener("socmed:sounds-preference", sync);
    return () => window.removeEventListener("socmed:sounds-preference", sync);
  }, []);

  useEffect(() => {
    if (!saveNotice) return;
    const id = window.setTimeout(() => setSaveNotice(null), 3000);
    return () => window.clearTimeout(id);
  }, [saveNotice]);

  function selectSound(id: ActivitySoundId | null) {
    setDraftSoundId(id);
    if (id) previewActivitySound(id);
  }

  function saveSettings() {
    saveActivitySoundPreferences({ enabled: draftEnabled, soundId: draftSoundId });
    setSaved(readNotificationSoundPreferences());
    setSaveNotice("Activity sound settings saved.");
    if (draftEnabled && draftSoundId) previewActivitySound(draftSoundId);
  }

  return (
    <section className="feed-card overflow-hidden text-card-foreground">
      <div className="border-b border-border/80 bg-secondary/40 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border/80">
            <Volume2 className="size-4 text-foreground" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold tracking-tight">Activity sounds</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Choose the sound for friend requests, comments, and replies.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <button
          type="button"
          role="switch"
          aria-checked={draftEnabled}
          onClick={() => setDraftEnabled((enabled) => !enabled)}
          className={cn(
            "flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 text-left transition-colors",
            draftEnabled ? "border-foreground/15 bg-accent/30" : "border-border bg-background hover:bg-accent/20"
          )}
        >
          <span className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-secondary">
              <Bell className="size-4 text-foreground" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-medium">Play activity sounds</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {draftEnabled ? "On — customize the tone below" : "Currently off"}
              </span>
            </span>
          </span>
          <span className={cn("relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors", draftEnabled ? "bg-foreground" : "bg-muted")} aria-hidden="true">
            <span className={cn("absolute top-0.5 size-5 rounded-full bg-background shadow-sm transition-transform", draftEnabled ? "translate-x-5" : "translate-x-0.5")} />
          </span>
        </button>

        {draftEnabled && (
          <SoundSettingsPicker
            groups={ACTIVITY_SOUND_GROUPS}
            groupMeta={ACTIVITY_GROUP_META}
            options={ACTIVITY_SOUND_OPTIONS}
            selectedId={draftSoundId}
            noSoundLabel="No activity sound"
            noSoundDescription="Keep activity alerts silent."
            onSelect={selectSound}
          />
        )}

        <div className={cn("rounded-xl border px-4 py-3.5", hasUnsavedChanges ? "border-foreground/20 bg-accent/25" : "border-border bg-secondary/30")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {hasUnsavedChanges ? "You have unsaved changes." : saveNotice ?? `Active: ${activitySoundLabel(saved.activitySoundId)}`}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Click anywhere once after sign-in if audio does not play.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button type="button" size="sm" disabled={!draftEnabled || !draftSoundId} variant="outline" onPointerDown={() => draftSoundId && previewActivitySound(draftSoundId)}>
                <Play className="size-3.5" aria-hidden="true" />
                Preview
              </Button>
              <Button type="button" size="sm" disabled={!hasUnsavedChanges} onClick={saveSettings}>Save activity sounds</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
