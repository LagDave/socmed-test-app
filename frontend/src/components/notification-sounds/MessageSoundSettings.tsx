import { useEffect, useState } from "react";
import { MessageSquare, Music2, PartyPopper, Play, Sparkles, Sun, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MESSAGE_SOUND_GROUPS,
  MESSAGE_SOUND_OPTIONS,
  previewMessageSound,
  readNotificationSoundPreferences,
  saveMessageSoundPreferences,
  type MessageSoundGroup,
  type MessageSoundId,
} from "@/lib/notificationSounds";
import { cn } from "@/lib/utils";
import { SoundSettingsPicker } from "./SoundSettingsPicker";

const MESSAGE_GROUP_META: Record<MessageSoundGroup, { icon: typeof Music2; blurb: string }> = {
  Classic: { icon: Music2, blurb: "Clean and minimal" },
  Cute: { icon: Sparkles, blurb: "Soft and playful" },
  Happy: { icon: Sun, blurb: "Warm and uplifting" },
  Excited: { icon: PartyPopper, blurb: "Bright and energetic" },
};

function messageSoundLabel(id: MessageSoundId | null): string {
  if (!id) return "No sound";
  return MESSAGE_SOUND_OPTIONS.find((option) => option.id === id)?.label ?? id;
}

export function MessageSoundSettings() {
  const [saved, setSaved] = useState(() => readNotificationSoundPreferences());
  const [draftEnabled, setDraftEnabled] = useState(saved.messageEnabled);
  const [draftSoundId, setDraftSoundId] = useState<MessageSoundId | null>(saved.messageSoundId);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const hasUnsavedChanges =
    draftEnabled !== saved.messageEnabled || draftSoundId !== saved.messageSoundId;

  useEffect(() => {
    const sync = () => {
      const prefs = readNotificationSoundPreferences();
      setSaved(prefs);
      setDraftEnabled(prefs.messageEnabled);
      setDraftSoundId(prefs.messageSoundId);
    };
    window.addEventListener("socmed:sounds-preference", sync);
    return () => window.removeEventListener("socmed:sounds-preference", sync);
  }, []);

  useEffect(() => {
    if (!saveNotice) return;
    const id = window.setTimeout(() => setSaveNotice(null), 3000);
    return () => window.clearTimeout(id);
  }, [saveNotice]);

  function selectSound(id: MessageSoundId | null) {
    setDraftSoundId(id);
    if (id) previewMessageSound(id);
  }

  function saveSettings() {
    saveMessageSoundPreferences({ enabled: draftEnabled, soundId: draftSoundId });
    setSaved(readNotificationSoundPreferences());
    setSaveNotice("Message sound settings saved.");
    if (draftEnabled && draftSoundId) previewMessageSound(draftSoundId);
  }

  return (
    <section className="feed-card overflow-hidden text-card-foreground">
      <div className="border-b border-border/80 bg-secondary/40 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border/80">
            <Volume2 className="size-4 text-foreground" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold tracking-tight">Message sounds</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Choose the sound for new direct messages.
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
              <MessageSquare className="size-4 text-foreground" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-medium">Play message sounds</span>
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
            groups={MESSAGE_SOUND_GROUPS}
            groupMeta={MESSAGE_GROUP_META}
            options={MESSAGE_SOUND_OPTIONS}
            selectedId={draftSoundId}
            noSoundLabel="No message sound"
            noSoundDescription="Keep incoming direct messages silent."
            onSelect={selectSound}
          />
        )}

        <div className={cn("rounded-xl border px-4 py-3.5", hasUnsavedChanges ? "border-foreground/20 bg-accent/25" : "border-border bg-secondary/30")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {hasUnsavedChanges ? "You have unsaved changes." : saveNotice ?? `Active: ${messageSoundLabel(saved.messageSoundId)}`}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Click anywhere once after sign-in if audio does not play.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button type="button" size="sm" disabled={!draftEnabled || !draftSoundId} variant="outline" onPointerDown={() => draftSoundId && previewMessageSound(draftSoundId)}>
                <Play className="size-3.5" aria-hidden="true" />
                Preview
              </Button>
              <Button type="button" size="sm" disabled={!hasUnsavedChanges} onClick={saveSettings}>Save message sounds</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
