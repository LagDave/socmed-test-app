export type SoundKind = "message" | "activity";

export type MessageSoundId =
  | "chime"
  | "pop"
  | "bell"
  | "ping"
  | "bubble"
  | "giggle"
  | "twinkle"
  | "cheer"
  | "sunny"
  | "daisy"
  | "yay"
  | "spark"
  | "zip"
  | "party";

export type MessageSoundGroup = "Classic" | "Cute" | "Happy" | "Excited";

export type MessageSoundOption = {
  id: MessageSoundId;
  label: string;
  description: string;
  url: string;
  group: MessageSoundGroup;
};

/** Bump when replacing sound assets so browsers reload cached files. */
const SOUND_ASSET_VERSION = "3";

const PLAYBACK_VOLUME = 0.38;

export const MESSAGE_SOUND_OPTIONS: MessageSoundOption[] = [
  { id: "chime", label: "Chime", description: "Soft marimba note", url: `/sounds/message-chime.wav?v=${SOUND_ASSET_VERSION}`, group: "Classic" },
  { id: "pop", label: "Pop", description: "Gentle bloop", url: `/sounds/message-pop.wav?v=${SOUND_ASSET_VERSION}`, group: "Classic" },
  { id: "bell", label: "Bell", description: "Glass bell fade", url: `/sounds/message-bell.wav?v=${SOUND_ASSET_VERSION}`, group: "Classic" },
  { id: "ping", label: "Ping", description: "Light tap", url: `/sounds/message-ping.wav?v=${SOUND_ASSET_VERSION}`, group: "Classic" },
  { id: "bubble", label: "Bubble", description: "Soft water drops", url: `/sounds/message-bubble.wav?v=${SOUND_ASSET_VERSION}`, group: "Cute" },
  { id: "giggle", label: "Giggle", description: "Tiny bouncy notes", url: `/sounds/message-giggle.wav?v=${SOUND_ASSET_VERSION}`, group: "Cute" },
  { id: "twinkle", label: "Twinkle", description: "Delicate harp rise", url: `/sounds/message-twinkle.wav?v=${SOUND_ASSET_VERSION}`, group: "Cute" },
  { id: "cheer", label: "Cheer", description: "Warm major roll", url: `/sounds/message-cheer.wav?v=${SOUND_ASSET_VERSION}`, group: "Happy" },
  { id: "sunny", label: "Sunny", description: "Mellow two-tone hum", url: `/sounds/message-sunny.wav?v=${SOUND_ASSET_VERSION}`, group: "Happy" },
  { id: "daisy", label: "Daisy", description: "Sweet mini melody", url: `/sounds/message-daisy.wav?v=${SOUND_ASSET_VERSION}`, group: "Happy" },
  { id: "yay", label: "Yay!", description: "Quiet rising fanfare", url: `/sounds/message-yay.wav?v=${SOUND_ASSET_VERSION}`, group: "Excited" },
  { id: "spark", label: "Spark", description: "Smooth sparkle glide", url: `/sounds/message-spark.wav?v=${SOUND_ASSET_VERSION}`, group: "Excited" },
  { id: "zip", label: "Zip", description: "Soft swoop up", url: `/sounds/message-zip.wav?v=${SOUND_ASSET_VERSION}`, group: "Excited" },
  { id: "party", label: "Party", description: "Muted thump + chord", url: `/sounds/message-party.wav?v=${SOUND_ASSET_VERSION}`, group: "Excited" },
];

export const MESSAGE_SOUND_GROUPS: MessageSoundGroup[] = ["Classic", "Cute", "Happy", "Excited"];

const ENABLED_STORAGE_KEY = "socmed.sounds.enabled";
const MESSAGE_SOUND_STORAGE_KEY = "socmed.sounds.messageId";
const DEFAULT_MESSAGE_SOUND_ID: MessageSoundId = "chime";

const ACTIVITY_SOUND_URL = `/sounds/activity.wav?v=${SOUND_ASSET_VERSION}`;

/** One preloaded element per URL — same element for preview and live messages. */
const audioPool = new Map<string, HTMLAudioElement>();

let activePrefs = readNotificationSoundPreferencesFromStorage();
let isUnlocked = false;
let lastPlayedAt = 0;

type MessageSoundDedupe = { messageId: string | null; at: number };

function messageSoundDedupeState(): MessageSoundDedupe {
  const key = "__socmedMessageSoundDedupe";
  const root = globalThis as typeof globalThis & { [key]?: MessageSoundDedupe };
  if (!root[key]) root[key] = { messageId: null, at: 0 };
  return root[key]!;
}

function isMessageSoundId(value: string): value is MessageSoundId {
  return MESSAGE_SOUND_OPTIONS.some((option) => option.id === value);
}

function readNotificationSoundPreferencesFromStorage(): {
  enabled: boolean;
  messageSoundId: MessageSoundId;
} {
  let enabled = true;
  try {
    const raw = localStorage.getItem(ENABLED_STORAGE_KEY);
    if (raw !== null) enabled = raw === "true";
  } catch {
    /* ignore */
  }

  let messageSoundId: MessageSoundId = DEFAULT_MESSAGE_SOUND_ID;
  try {
    const raw = localStorage.getItem(MESSAGE_SOUND_STORAGE_KEY);
    if (raw && isMessageSoundId(raw)) messageSoundId = raw;
  } catch {
    /* ignore */
  }

  return { enabled, messageSoundId };
}

function syncActivePrefsFromStorage(): void {
  activePrefs = readNotificationSoundPreferencesFromStorage();
}

function messageSoundUrl(id: MessageSoundId): string {
  return MESSAGE_SOUND_OPTIONS.find((option) => option.id === id)?.url ?? MESSAGE_SOUND_OPTIONS[0].url;
}

function activeMessageSoundUrl(): string {
  return messageSoundUrl(activePrefs.messageSoundId);
}

function getPooledAudio(url: string): HTMLAudioElement {
  let audio = audioPool.get(url);
  if (!audio) {
    audio = new Audio(url);
    audio.preload = "auto";
    audio.load();
    audioPool.set(url, audio);
  }
  return audio;
}

/** Restart a pooled clip from the beginning — identical path for preview and live. */
function playSoundUrl(url: string): void {
  const audio = getPooledAudio(url);
  audio.pause();
  audio.currentTime = 0;
  audio.volume = PLAYBACK_VOLUME;
  void audio.play().then(() => {
    isUnlocked = true;
  }).catch(() => undefined);
}

function playSoundUrlDebounced(url: string): void {
  const now = Date.now();
  if (now - lastPlayedAt < 400) return;
  lastPlayedAt = now;
  playSoundUrl(url);
}

function warmSound(url: string): void {
  getPooledAudio(url);
}

export function areNotificationSoundsEnabled(): boolean {
  return activePrefs.enabled;
}

export function getSelectedMessageSoundId(): MessageSoundId {
  return activePrefs.messageSoundId;
}

export function setNotificationSoundsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(ENABLED_STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    /* storage unavailable */
  }
  activePrefs = { ...activePrefs, enabled };
  window.dispatchEvent(new CustomEvent("socmed:sounds-preference"));
}

export function setSelectedMessageSoundId(id: MessageSoundId): void {
  try {
    localStorage.setItem(MESSAGE_SOUND_STORAGE_KEY, id);
  } catch {
    /* storage unavailable */
  }
  activePrefs = { ...activePrefs, messageSoundId: id };
  warmSound(messageSoundUrl(id));
  window.dispatchEvent(new CustomEvent("socmed:sounds-preference"));
}

export function saveNotificationSoundPreferences(prefs: {
  enabled: boolean;
  messageSoundId: MessageSoundId;
}): void {
  try {
    localStorage.setItem(ENABLED_STORAGE_KEY, prefs.enabled ? "true" : "false");
    localStorage.setItem(MESSAGE_SOUND_STORAGE_KEY, prefs.messageSoundId);
  } catch {
    /* storage unavailable */
  }
  activePrefs = { ...prefs };
  warmSound(messageSoundUrl(prefs.messageSoundId));
  window.dispatchEvent(new CustomEvent("socmed:sounds-preference"));
}

export function readNotificationSoundPreferences(): {
  enabled: boolean;
  messageSoundId: MessageSoundId;
} {
  return { ...activePrefs };
}

export function areNotificationSoundsUnlocked(): boolean {
  return isUnlocked;
}

export function unlockNotificationSounds(): void {
  if (isUnlocked) {
    warmSound(activeMessageSoundUrl());
    return;
  }

  const url = activeMessageSoundUrl();
  warmSound(url);
  const audio = getPooledAudio(url);
  audio.volume = 0.001;
  void audio
    .play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = PLAYBACK_VOLUME;
      isUnlocked = true;
    })
    .catch(() => {
      isUnlocked = true;
    });
}

export function warmActiveMessageSound(): void {
  warmSound(activeMessageSoundUrl());
}

export function playNotificationSound(kind: SoundKind): void {
  if (!activePrefs.enabled) return;

  const url = kind === "message" ? activeMessageSoundUrl() : ACTIVITY_SOUND_URL;
  warmSound(url);
  playSoundUrlDebounced(url);
}

/** Live inbound message sound — dedupes duplicate socket deliveries / stacked listeners. */
export function playMessageNotificationSound(messageId: string): void {
  if (!activePrefs.enabled) return;

  const dedupe = messageSoundDedupeState();
  const now = Date.now();
  if (dedupe.messageId === messageId && now - dedupe.at < 3000) return;

  dedupe.messageId = messageId;
  dedupe.at = now;

  const url = activeMessageSoundUrl();
  warmSound(url);
  playSoundUrlDebounced(url);
}

export function testNotificationSound(): void {
  unlockNotificationSounds();
  playSoundUrl(activeMessageSoundUrl());
}

export function previewMessageSound(id: MessageSoundId): void {
  unlockNotificationSounds();
  const url = messageSoundUrl(id);
  warmSound(url);
  playSoundUrl(url);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === ENABLED_STORAGE_KEY || event.key === MESSAGE_SOUND_STORAGE_KEY) {
      syncActivePrefsFromStorage();
      warmActiveMessageSound();
      window.dispatchEvent(new CustomEvent("socmed:sounds-preference"));
    }
  });
}
