import {
  MESSAGE_NEW,
  getMessagesSocket,
  type MessageEventPayload,
} from "@/api/socket";

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

export const MESSAGE_SOUND_GROUPS: MessageSoundGroup[] = ["Classic", "Cute", "Happy", "Excited"];

export type ActivitySoundId =
  | "alert"
  | "beep"
  | "digital"
  | "notify"
  | "buzz"
  | "whistle"
  | "nudge"
  | "badge"
  | "classic"
  | "marimba"
  | "horn"
  | "pop"
  | "levels";

export type ActivitySoundGroup = "Digital" | "Tone";

export type ActivitySoundOption = {
  id: ActivitySoundId;
  label: string;
  description: string;
  url: string;
  group: ActivitySoundGroup;
};

/** Bump when replacing sound assets so browsers reload cached files. */
const SOUND_ASSET_VERSION = "17";

export const ACTIVITY_SOUND_OPTIONS: ActivitySoundOption[] = [
  { id: "alert", label: "Alert", description: "Urgent double beep", url: `/sounds/activity-alert.wav?v=${SOUND_ASSET_VERSION}`, group: "Digital" },
  { id: "beep", label: "Beep", description: "Single clean beep", url: `/sounds/activity-beep.wav?v=${SOUND_ASSET_VERSION}`, group: "Digital" },
  { id: "digital", label: "Digital", description: "8-bit ascending power-up", url: `/sounds/activity-digital.wav?v=${SOUND_ASSET_VERSION}`, group: "Digital" },
  { id: "notify", label: "Notify", description: "SMS-style sine chirps", url: `/sounds/activity-notify.wav?v=${SOUND_ASSET_VERSION}`, group: "Digital" },
  { id: "buzz", label: "Buzz", description: "Short buzzer pulse", url: `/sounds/activity-buzz.wav?v=${SOUND_ASSET_VERSION}`, group: "Digital" },
  { id: "whistle", label: "Whistle", description: "Two-tone whistle", url: `/sounds/activity-whistle.wav?v=${SOUND_ASSET_VERSION}`, group: "Digital" },
  { id: "nudge", label: "Nudge", description: "Double tap reminder", url: `/sounds/activity-nudge.wav?v=${SOUND_ASSET_VERSION}`, group: "Digital" },
  { id: "badge", label: "Badge", description: "New-item two-note ding", url: `/sounds/activity-badge.wav?v=${SOUND_ASSET_VERSION}`, group: "Digital" },
  { id: "classic", label: "Classic", description: "Three-note mail alert rise", url: `/sounds/activity-classic.wav?v=${SOUND_ASSET_VERSION}`, group: "Tone" },
  { id: "marimba", label: "Marimba", description: "Triple fading wood taps", url: `/sounds/activity-marimba.wav?v=${SOUND_ASSET_VERSION}`, group: "Tone" },
  { id: "horn", label: "Horn", description: "Staccato brass fanfare", url: `/sounds/activity-horn.wav?v=${SOUND_ASSET_VERSION}`, group: "Tone" },
  { id: "pop", label: "Pop", description: "Rubber-band twang snap", url: `/sounds/activity-pop.wav?v=${SOUND_ASSET_VERSION}`, group: "Tone" },
  { id: "levels", label: "Levels", description: "Three-step level-up rise", url: `/sounds/activity-levels.wav?v=${SOUND_ASSET_VERSION}`, group: "Tone" },
];

export const ACTIVITY_SOUND_GROUPS: ActivitySoundGroup[] = ["Digital", "Tone"];

/** Bump when replacing sound assets so browsers reload cached files. */
const MESSAGE_SOUND_ASSET_VERSION = "3";

const PLAYBACK_VOLUME = 0.38;
const ACTIVITY_PLAYBACK_VOLUME = 0.15;

export const MESSAGE_SOUND_OPTIONS: MessageSoundOption[] = [
  { id: "chime", label: "Chime", description: "Soft marimba note", url: `/sounds/message-chime.wav?v=${MESSAGE_SOUND_ASSET_VERSION}`, group: "Classic" },
  { id: "pop", label: "Pop", description: "Gentle bloop", url: `/sounds/message-pop.wav?v=${MESSAGE_SOUND_ASSET_VERSION}`, group: "Classic" },
  { id: "bell", label: "Bell", description: "Glass bell fade", url: `/sounds/message-bell.wav?v=${MESSAGE_SOUND_ASSET_VERSION}`, group: "Classic" },
  { id: "ping", label: "Ping", description: "Light tap", url: `/sounds/message-ping.wav?v=${MESSAGE_SOUND_ASSET_VERSION}`, group: "Classic" },
  { id: "bubble", label: "Bubble", description: "Soft water drops", url: `/sounds/message-bubble.wav?v=${MESSAGE_SOUND_ASSET_VERSION}`, group: "Cute" },
  { id: "giggle", label: "Giggle", description: "Tiny bouncy notes", url: `/sounds/message-giggle.wav?v=${MESSAGE_SOUND_ASSET_VERSION}`, group: "Cute" },
  { id: "twinkle", label: "Twinkle", description: "Delicate harp rise", url: `/sounds/message-twinkle.wav?v=${MESSAGE_SOUND_ASSET_VERSION}`, group: "Cute" },
  { id: "cheer", label: "Cheer", description: "Warm major roll", url: `/sounds/message-cheer.wav?v=${MESSAGE_SOUND_ASSET_VERSION}`, group: "Happy" },
  { id: "sunny", label: "Sunny", description: "Mellow two-tone hum", url: `/sounds/message-sunny.wav?v=${MESSAGE_SOUND_ASSET_VERSION}`, group: "Happy" },
  { id: "daisy", label: "Daisy", description: "Sweet mini melody", url: `/sounds/message-daisy.wav?v=${MESSAGE_SOUND_ASSET_VERSION}`, group: "Happy" },
  { id: "yay", label: "Yay!", description: "Quiet rising fanfare", url: `/sounds/message-yay.wav?v=${MESSAGE_SOUND_ASSET_VERSION}`, group: "Excited" },
  { id: "spark", label: "Spark", description: "Smooth sparkle glide", url: `/sounds/message-spark.wav?v=${MESSAGE_SOUND_ASSET_VERSION}`, group: "Excited" },
  { id: "zip", label: "Zip", description: "Soft swoop up", url: `/sounds/message-zip.wav?v=${MESSAGE_SOUND_ASSET_VERSION}`, group: "Excited" },
  { id: "party", label: "Party", description: "Muted thump + chord", url: `/sounds/message-party.wav?v=${MESSAGE_SOUND_ASSET_VERSION}`, group: "Excited" },
];

const LEGACY_ENABLED_STORAGE_KEY = "socmed.sounds.enabled";
const MESSAGE_ENABLED_STORAGE_KEY = "socmed.sounds.messageEnabled";
const ACTIVITY_ENABLED_STORAGE_KEY = "socmed.sounds.activityEnabled";
const MESSAGE_SOUND_STORAGE_KEY = "socmed.sounds.messageId";
const ACTIVITY_SOUND_STORAGE_KEY = "socmed.sounds.activityId";
const MESSAGE_SOUND_TAB_CHANNEL = "socmed-message-sound";
const ACTIVITY_SOUND_TAB_CHANNEL = "socmed-activity-sound";

/** Inaudible clip — unlocks autoplay without using message sound files. */
const SILENT_UNLOCK_DATA_URL =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

export type NotificationSoundPreferences = {
  messageEnabled: boolean;
  activityEnabled: boolean;
  messageSoundId: MessageSoundId | null;
  activitySoundId: ActivitySoundId | null;
};

type SoundRuntime = {
  activePrefs: NotificationSoundPreferences;
  isUnlocked: boolean;
  messageAudio: HTMLAudioElement | null;
  activityAudio: HTMLAudioElement | null;
  lastPlayedMessageId: string | null;
  lastPlayedAt: number;
  tabChannel: BroadcastChannel | null;
  recentTabMessageIds: Set<string>;
  ownTabBroadcastIds: Set<string>;
  lastPlayedActivityId: string | null;
  lastPlayedActivityAt: number;
  activityTabChannel: BroadcastChannel | null;
  recentTabActivityIds: Set<string>;
  ownTabActivityBroadcastIds: Set<string>;
};

type MessageSoundContext = {
  userId: string | null;
  pathname: string;
};

/** Conversation id when route is `/messages/:conversationId`, else null. */
export function getOpenConversationIdFromPathname(pathname: string): string | null {
  const match = /^\/messages\/([^/]+)/.exec(pathname);
  return match?.[1] ?? null;
}

/** True when the user is viewing the thread for this conversation. */
export function isViewingConversation(pathname: string, conversationId: string): boolean {
  return getOpenConversationIdFromPathname(pathname) === conversationId;
}

/** True when the user is viewing the notifications page. */
export function isViewingNotificationsPage(pathname: string): boolean {
  return pathname === "/notifications" || pathname.startsWith("/notifications/");
}

type MessageSoundBridge = {
  fn: (payload: MessageEventPayload) => void;
  getContext: () => MessageSoundContext;
  registered: boolean;
  socket: ReturnType<typeof getMessagesSocket> | null;
};

function soundRuntime(): SoundRuntime {
  const key = "__socmedSoundRuntime";
  const root = globalThis as typeof globalThis & { [key]?: SoundRuntime };
  if (!root[key]) {
    const tabChannel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel(MESSAGE_SOUND_TAB_CHANNEL)
        : null;
    const activityTabChannel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel(ACTIVITY_SOUND_TAB_CHANNEL)
        : null;
    root[key] = {
      activePrefs: readNotificationSoundPreferencesFromStorage(),
      isUnlocked: false,
      messageAudio: null,
      activityAudio: null,
      lastPlayedMessageId: null,
      lastPlayedAt: 0,
      tabChannel,
      recentTabMessageIds: new Set(),
      ownTabBroadcastIds: new Set(),
      lastPlayedActivityId: null,
      lastPlayedActivityAt: 0,
      activityTabChannel,
      recentTabActivityIds: new Set(),
      ownTabActivityBroadcastIds: new Set(),
    };
    tabChannel?.addEventListener("message", (event: MessageEvent<{ messageId?: string }>) => {
      const messageId = event.data?.messageId;
      if (!messageId) return;
      const runtime = root[key]!;
      if (runtime.ownTabBroadcastIds.delete(messageId)) return;
      runtime.recentTabMessageIds.add(messageId);
      window.setTimeout(() => runtime.recentTabMessageIds.delete(messageId), 3000);
    });
    activityTabChannel?.addEventListener("message", (event: MessageEvent<{ notificationId?: string }>) => {
      const notificationId = event.data?.notificationId;
      if (!notificationId) return;
      const runtime = root[key]!;
      if (runtime.ownTabActivityBroadcastIds.delete(notificationId)) return;
      runtime.recentTabActivityIds.add(notificationId);
      window.setTimeout(() => runtime.recentTabActivityIds.delete(notificationId), 3000);
    });
  }
  return root[key]!;
}

function messageSoundBridge(): MessageSoundBridge {
  const key = "__socmedMessageSoundBridge";
  const root = globalThis as typeof globalThis & { [key]?: MessageSoundBridge };
  if (!root[key]) {
    root[key] = {
      registered: false,
      socket: null,
      getContext: () => ({ userId: null, pathname: "/" }),
      fn: (payload: MessageEventPayload) => {
        const bridge = root[key]!;
        const { userId, pathname } = bridge.getContext();
        const msg = payload.message;
        if (!userId || msg.senderId === userId) return;
        if (isViewingConversation(pathname, msg.conversationId)) return;
        playMessageNotificationSound(msg.id);
      },
    };
  }
  return root[key]!;
}

function isMessageSoundId(value: string): value is MessageSoundId {
  return MESSAGE_SOUND_OPTIONS.some((option) => option.id === value);
}

function isActivitySoundId(value: string): value is ActivitySoundId {
  return ACTIVITY_SOUND_OPTIONS.some((option) => option.id === value);
}

function readStoredBoolean(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw === "true";
  } catch {
    return fallback;
  }
}

function readNotificationSoundPreferencesFromStorage(): NotificationSoundPreferences {
  const legacyEnabled = readStoredBoolean(LEGACY_ENABLED_STORAGE_KEY, true);
  const messageEnabled = readStoredBoolean(MESSAGE_ENABLED_STORAGE_KEY, legacyEnabled);
  const activityEnabled = readStoredBoolean(ACTIVITY_ENABLED_STORAGE_KEY, legacyEnabled);

  let messageSoundId: MessageSoundId | null = null;
  try {
    const raw = localStorage.getItem(MESSAGE_SOUND_STORAGE_KEY);
    if (raw && isMessageSoundId(raw)) messageSoundId = raw;
  } catch {
    /* ignore */
  }

  let activitySoundId: ActivitySoundId | null = null;
  try {
    const raw = localStorage.getItem(ACTIVITY_SOUND_STORAGE_KEY);
    if (raw && isActivitySoundId(raw)) activitySoundId = raw;
  } catch {
    /* ignore */
  }

  return { messageEnabled, activityEnabled, messageSoundId, activitySoundId };
}

function syncActivePrefsFromStorage(): void {
  soundRuntime().activePrefs = readNotificationSoundPreferencesFromStorage();
}

function activePrefs(): NotificationSoundPreferences {
  return soundRuntime().activePrefs;
}

function messageSoundUrl(id: MessageSoundId): string {
  return MESSAGE_SOUND_OPTIONS.find((option) => option.id === id)?.url ?? MESSAGE_SOUND_OPTIONS[0].url;
}

function activeMessageSoundUrl(): string | null {
  const id = activePrefs().messageSoundId;
  return id ? messageSoundUrl(id) : null;
}

function activitySoundUrl(id: ActivitySoundId): string {
  return ACTIVITY_SOUND_OPTIONS.find((option) => option.id === id)?.url ?? ACTIVITY_SOUND_OPTIONS[0].url;
}

function activeActivitySoundUrl(): string | null {
  const id = activePrefs().activitySoundId;
  return id ? activitySoundUrl(id) : null;
}

function getAudio(kind: SoundKind): HTMLAudioElement {
  const runtime = soundRuntime();
  const audioKey = kind === "message" ? "messageAudio" : "activityAudio";
  if (!runtime[audioKey]) {
    runtime[audioKey] = new Audio();
    runtime[audioKey].preload = "auto";
  }
  return runtime[audioKey];
}

function stopAudio(kind: SoundKind): void {
  const audio = soundRuntime()[kind === "message" ? "messageAudio" : "activityAudio"];
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

/** Returns true when playback actually started. */
function playSoundUrl(kind: SoundKind, url: string, volume: number): Promise<boolean> {
  const audio = getAudio(kind);
  const absolute = new URL(url, window.location.origin).href;

  stopAudio(kind);

  if (audio.src !== absolute) {
    audio.src = absolute;
    audio.load();
  }

  audio.volume = volume;
  return audio
    .play()
    .then(() => {
      soundRuntime().isUnlocked = true;
      return true;
    })
    .catch(() => false);
}

function playMessageSoundUrl(url: string): Promise<boolean> {
  return playSoundUrl("message", url, PLAYBACK_VOLUME);
}

function playActivitySoundUrl(url: string): Promise<boolean> {
  return playSoundUrl("activity", url, ACTIVITY_PLAYBACK_VOLUME);
}

function shouldSkipMessageSound(messageId: string): boolean {
  const runtime = soundRuntime();
  const now = Date.now();

  if (runtime.lastPlayedMessageId === messageId && now - runtime.lastPlayedAt < 3000) {
    return true;
  }
  if (runtime.recentTabMessageIds.has(messageId)) {
    return true;
  }

  return false;
}

function markMessageSoundPlayed(messageId: string): void {
  const runtime = soundRuntime();
  runtime.lastPlayedMessageId = messageId;
  runtime.lastPlayedAt = Date.now();
  runtime.ownTabBroadcastIds.add(messageId);
  runtime.tabChannel?.postMessage({ messageId });
  window.setTimeout(() => runtime.ownTabBroadcastIds.delete(messageId), 100);
}

function shouldSkipActivitySound(notificationId: string): boolean {
  const runtime = soundRuntime();
  const now = Date.now();

  if (runtime.lastPlayedActivityId === notificationId && now - runtime.lastPlayedActivityAt < 3000) {
    return true;
  }
  if (runtime.recentTabActivityIds.has(notificationId)) {
    return true;
  }

  return false;
}

function markActivitySoundPlayed(notificationId: string): void {
  const runtime = soundRuntime();
  runtime.lastPlayedActivityId = notificationId;
  runtime.lastPlayedActivityAt = Date.now();
  runtime.ownTabActivityBroadcastIds.add(notificationId);
  runtime.activityTabChannel?.postMessage({ notificationId });
  window.setTimeout(() => runtime.ownTabActivityBroadcastIds.delete(notificationId), 100);
}

export function bindMessageNotificationSoundContext(
  getContext: () => MessageSoundContext
): void {
  messageSoundBridge().getContext = getContext;
}

export function ensureMessageNotificationSoundListener(): void {
  const bridge = messageSoundBridge();
  const socket = getMessagesSocket();

  if (bridge.socket && bridge.socket !== socket) {
    bridge.socket.off(MESSAGE_NEW, bridge.fn);
    bridge.registered = false;
    bridge.socket = null;
  }

  if (bridge.registered) return;

  socket.on(MESSAGE_NEW, bridge.fn);
  bridge.registered = true;
  bridge.socket = socket;
}

export function teardownMessageNotificationSoundListener(): void {
  const bridge = messageSoundBridge();
  if (!bridge.registered || !bridge.socket) return;

  bridge.socket.off(MESSAGE_NEW, bridge.fn);
  bridge.registered = false;
  bridge.socket = null;
}

export function areNotificationSoundsEnabled(): boolean {
  return activePrefs().messageEnabled || activePrefs().activityEnabled;
}

export function getSelectedMessageSoundId(): MessageSoundId | null {
  return activePrefs().messageSoundId;
}

export function getSelectedActivitySoundId(): ActivitySoundId | null {
  return activePrefs().activitySoundId;
}

export function setNotificationSoundsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(LEGACY_ENABLED_STORAGE_KEY, enabled ? "true" : "false");
    localStorage.setItem(MESSAGE_ENABLED_STORAGE_KEY, enabled ? "true" : "false");
    localStorage.setItem(ACTIVITY_ENABLED_STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    /* storage unavailable */
  }
  soundRuntime().activePrefs = { ...activePrefs(), messageEnabled: enabled, activityEnabled: enabled };
  window.dispatchEvent(new CustomEvent("socmed:sounds-preference"));
}

export function setSelectedMessageSoundId(id: MessageSoundId): void {
  try {
    localStorage.setItem(MESSAGE_SOUND_STORAGE_KEY, id);
  } catch {
    /* storage unavailable */
  }
  soundRuntime().activePrefs = { ...activePrefs(), messageSoundId: id };
  window.dispatchEvent(new CustomEvent("socmed:sounds-preference"));
}

export function setSelectedActivitySoundId(id: ActivitySoundId | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVITY_SOUND_STORAGE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVITY_SOUND_STORAGE_KEY);
    }
  } catch {
    /* storage unavailable */
  }
  soundRuntime().activePrefs = { ...activePrefs(), activitySoundId: id };
  window.dispatchEvent(new CustomEvent("socmed:sounds-preference"));
}

export function saveMessageSoundPreferences(prefs: {
  enabled: boolean;
  soundId: MessageSoundId | null;
}): void {
  try {
    localStorage.setItem(MESSAGE_ENABLED_STORAGE_KEY, prefs.enabled ? "true" : "false");
    if (prefs.soundId) {
      localStorage.setItem(MESSAGE_SOUND_STORAGE_KEY, prefs.soundId);
    } else {
      localStorage.removeItem(MESSAGE_SOUND_STORAGE_KEY);
    }
  } catch {
    /* storage unavailable */
  }
  soundRuntime().activePrefs = {
    ...activePrefs(),
    messageEnabled: prefs.enabled,
    messageSoundId: prefs.soundId,
  };
  window.dispatchEvent(new CustomEvent("socmed:sounds-preference"));
}

export function saveActivitySoundPreferences(prefs: {
  enabled: boolean;
  soundId: ActivitySoundId | null;
}): void {
  try {
    localStorage.setItem(ACTIVITY_ENABLED_STORAGE_KEY, prefs.enabled ? "true" : "false");
    if (prefs.soundId) {
      localStorage.setItem(ACTIVITY_SOUND_STORAGE_KEY, prefs.soundId);
    } else {
      localStorage.removeItem(ACTIVITY_SOUND_STORAGE_KEY);
    }
  } catch {
    /* storage unavailable */
  }
  soundRuntime().activePrefs = {
    ...activePrefs(),
    activityEnabled: prefs.enabled,
    activitySoundId: prefs.soundId,
  };
  window.dispatchEvent(new CustomEvent("socmed:sounds-preference"));
}

export function saveNotificationSoundPreferences(prefs: {
  enabled: boolean;
  messageSoundId: MessageSoundId | null;
  activitySoundId: ActivitySoundId | null;
}): void {
  try {
    localStorage.setItem(LEGACY_ENABLED_STORAGE_KEY, prefs.enabled ? "true" : "false");
    localStorage.setItem(MESSAGE_ENABLED_STORAGE_KEY, prefs.enabled ? "true" : "false");
    localStorage.setItem(ACTIVITY_ENABLED_STORAGE_KEY, prefs.enabled ? "true" : "false");
    if (prefs.messageSoundId) {
      localStorage.setItem(MESSAGE_SOUND_STORAGE_KEY, prefs.messageSoundId);
    } else {
      localStorage.removeItem(MESSAGE_SOUND_STORAGE_KEY);
    }
    if (prefs.activitySoundId) {
      localStorage.setItem(ACTIVITY_SOUND_STORAGE_KEY, prefs.activitySoundId);
    } else {
      localStorage.removeItem(ACTIVITY_SOUND_STORAGE_KEY);
    }
  } catch {
    /* storage unavailable */
  }
  soundRuntime().activePrefs = {
    messageEnabled: prefs.enabled,
    activityEnabled: prefs.enabled,
    messageSoundId: prefs.messageSoundId,
    activitySoundId: prefs.activitySoundId,
  };
  window.dispatchEvent(new CustomEvent("socmed:sounds-preference"));
}

export function readNotificationSoundPreferences(): NotificationSoundPreferences {
  const prefs = activePrefs();
  return {
    messageEnabled: prefs.messageEnabled,
    activityEnabled: prefs.activityEnabled,
    messageSoundId: prefs.messageSoundId,
    activitySoundId: prefs.activitySoundId,
  };
}

export function areNotificationSoundsUnlocked(): boolean {
  return soundRuntime().isUnlocked;
}

/** Unlock autoplay on the same element used for messages — must run during a click/tap. */
export function unlockNotificationSounds(): void {
  const runtime = soundRuntime();
  if (runtime.isUnlocked) return;

  const audio = getAudio("message");
  audio.src = SILENT_UNLOCK_DATA_URL;
  audio.volume = 0.001;
  void audio
    .play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = PLAYBACK_VOLUME;
      audio.removeAttribute("src");
      audio.load();
      runtime.isUnlocked = true;
    })
    .catch(() => undefined);
}

export function warmActiveMessageSound(): void {
  /* no-op */
}

export function playNotificationSound(kind: SoundKind): void {
  syncActivePrefsFromStorage();
  if (kind === "message" && !activePrefs().messageEnabled) return;
  if (kind === "activity" && !activePrefs().activityEnabled) return;

  const url = kind === "message" ? activeMessageSoundUrl() : activeActivitySoundUrl();
  if (!url) return;
  void (kind === "activity" ? playActivitySoundUrl(url) : playMessageSoundUrl(url));
}

/** Live inbound activity sound — deduped per notification and across tabs. */
export function playActivityNotificationSound(notificationId: string): void {
  syncActivePrefsFromStorage();
  if (!activePrefs().activityEnabled) return;
  if (shouldSkipActivitySound(notificationId)) return;

  const url = activeActivitySoundUrl();
  if (!url) return;

  void playActivitySoundUrl(url).then((played) => {
    if (played) markActivitySoundPlayed(notificationId);
  });
}

export function previewActivitySound(id?: ActivitySoundId): void {
  unlockNotificationSounds();
  const resolved = id ?? getSelectedActivitySoundId();
  if (!resolved) return;
  void playActivitySoundUrl(activitySoundUrl(resolved));
}

/** Live inbound message sound — one clip only, deduped per message and across tabs. */
export function playMessageNotificationSound(messageId: string): void {
  syncActivePrefsFromStorage();
  if (!activePrefs().messageEnabled || !activePrefs().messageSoundId) return;
  if (shouldSkipMessageSound(messageId)) return;

  const url = activeMessageSoundUrl();
  if (!url) return;

  void playMessageSoundUrl(url).then((played) => {
    if (played) markMessageSoundPlayed(messageId);
  });
}

export function previewMessageSound(id: MessageSoundId): void {
  unlockNotificationSounds();
  void playMessageSoundUrl(messageSoundUrl(id));
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (
      event.key === LEGACY_ENABLED_STORAGE_KEY ||
      event.key === MESSAGE_ENABLED_STORAGE_KEY ||
      event.key === ACTIVITY_ENABLED_STORAGE_KEY ||
      event.key === MESSAGE_SOUND_STORAGE_KEY ||
      event.key === ACTIVITY_SOUND_STORAGE_KEY
    ) {
      syncActivePrefsFromStorage();
      window.dispatchEvent(new CustomEvent("socmed:sounds-preference"));
    }
  });
}
