import { Check, Play, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SoundOption<SoundId extends string, SoundGroup extends string> = {
  id: SoundId;
  label: string;
  description: string;
  group: SoundGroup;
};

type SoundGroupMeta = {
  icon: LucideIcon;
  blurb: string;
};

type SoundSettingsPickerProps<SoundId extends string, SoundGroup extends string> = {
  groups: SoundGroup[];
  groupMeta: Record<SoundGroup, SoundGroupMeta>;
  options: SoundOption<SoundId, SoundGroup>[];
  selectedId: SoundId | null;
  noSoundLabel: string;
  noSoundDescription: string;
  onSelect: (id: SoundId | null) => void;
};

export function SoundSettingsPicker<SoundId extends string, SoundGroup extends string>({
  groups,
  groupMeta,
  options,
  selectedId,
  noSoundLabel,
  noSoundDescription,
  onSelect,
}: SoundSettingsPickerProps<SoundId, SoundGroup>) {
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "w-full rounded-xl border px-3.5 py-3 text-left text-sm transition-colors",
          !selectedId
            ? "border-foreground bg-accent/50 shadow-sm ring-1 ring-foreground/10"
            : "border-border bg-background hover:border-foreground/20 hover:bg-accent/25"
        )}
      >
        <span className="font-medium">{noSoundLabel}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{noSoundDescription}</span>
      </button>

      {groups.map((group) => {
        const meta = groupMeta[group];
        const GroupIcon = meta.icon;
        const groupOptions = options.filter((option) => option.group === group);

        return (
          <div key={group} className="space-y-3">
            <div className="flex items-center gap-2">
              <GroupIcon className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">{group}</h4>
                <p className="text-[11px] text-muted-foreground">{meta.blurb}</p>
              </div>
            </div>

            <ul className="grid gap-2 sm:grid-cols-2">
              {groupOptions.map((option) => {
                const isSelected = selectedId === option.id;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(option.id)}
                      className={cn(
                        "group flex h-full w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all",
                        isSelected
                          ? "border-foreground bg-accent/50 shadow-sm ring-1 ring-foreground/10"
                          : "border-border bg-background hover:border-foreground/20 hover:bg-accent/25"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
                          isSelected
                            ? "bg-foreground text-background"
                            : "bg-secondary text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {isSelected ? (
                          <Check className="size-4" strokeWidth={2.25} aria-hidden="true" />
                        ) : (
                          <Play className="size-3.5 translate-x-0.5" strokeWidth={2} aria-hidden="true" />
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
    </div>
  );
}
