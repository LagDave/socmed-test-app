/**
 * Notification-style activity sounds (16-bit mono 44.1 kHz).
 * Run: node scripts/generate-activity-sounds.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 44100;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "../frontend/public/sounds");
const PEAK = 0.95;

function clamp(v, lo = -1, hi = 1) {
  return Math.max(lo, Math.min(hi, v));
}

function finalize(samples) {
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const x = samples[i];
    out[i] = Math.sign(x) * (1 - Math.exp(-Math.abs(x) * 3.5));
  }
  let max = 0;
  for (const s of out) max = Math.max(max, Math.abs(s));
  if (max < 1e-6) return out;
  const scale = PEAK / max;
  for (let i = 0; i < out.length; i++) out[i] = clamp(out[i] * scale);
  return out;
}

function env(t, { attack = 0.002, hold = 0, release = 0.07, total = 0.2 } = {}) {
  if (t < attack) return t / attack;
  if (t < attack + hold) return 1;
  if (t > total - release) return Math.max(0, (total - t) / release);
  return 1;
}

function wave(type, phase) {
  const x = phase % (2 * Math.PI);
  if (type === "sine") return Math.sin(x);
  if (type === "square") return x < Math.PI ? 1 : -1;
  if (type === "triangle") return (2 / Math.PI) * Math.asin(Math.sin(x));
  return Math.sin(x);
}

function render(fn, duration) {
  const n = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / SAMPLE_RATE, i);
  return out;
}

function concat(...tracks) {
  const len = tracks.reduce((s, t) => s + t.length, 0);
  const out = new Float32Array(len);
  let offset = 0;
  for (const track of tracks) {
    out.set(track, offset);
    offset += track.length;
  }
  return out;
}

function gap(ms) {
  return new Float32Array(Math.floor(ms * SAMPLE_RATE));
}

function writeWav(name, samples) {
  const normalized = finalize(samples);
  const dataSize = normalized.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < normalized.length; i++) {
    buf.writeInt16LE(Math.round(normalized[i] * 32767), 44 + i * 2);
  }
  writeFileSync(join(OUT_DIR, name), buf);
}

function ping(freq, dur, { release = 0.08, harmonics = [1, 2.2, 3.5] } = {}) {
  return render((t) => {
    const e = env(t, { attack: 0.001, release, total: dur });
    let s = 0;
    for (let h = 0; h < harmonics.length; h++) {
      s += Math.sin(2 * Math.PI * freq * harmonics[h] * t) / (h + 1);
    }
    return s * 0.55 * e;
  }, dur);
}

function note(freq, dur, waveType = "sine") {
  return render((t) => {
    const e = env(t, { attack: 0.002, release: dur * 0.45, total: dur });
    return wave(waveType, 2 * Math.PI * freq * t) * 0.6 * e;
  }, dur);
}

function beep(freq, dur) {
  return render((t) => {
    const e = env(t, { attack: 0.001, release: 0.025, total: dur });
    return wave("square", 2 * Math.PI * freq * t) * 0.45 * e;
  }, dur);
}

function pseudoNoise(i) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

// ── Digital ───────────────────────────────────────────────────────────────

function soundAlert() {
  return concat(beep(1046, 0.09), gap(0.06), beep(1318, 0.11));
}

function soundBeep() {
  return beep(880, 0.12);
}

/** Retro 8-bit: four ascending square blips (power-up style). */
function soundDigital() {
  const steps = [
    { freq: 523, dur: 0.055 },
    { freq: 659, dur: 0.055 },
    { freq: 784, dur: 0.055 },
    { freq: 988, dur: 0.08 },
  ];
  const parts = [];
  for (let i = 0; i < steps.length; i++) {
    if (i > 0) parts.push(gap(0.025));
    parts.push(beep(steps[i].freq, steps[i].dur));
  }
  return concat(...parts);
}

/** SMS-style: three soft sine chirps — same, same, higher. */
function soundNotify() {
  function chirp(freq, dur) {
    return render((t) => {
      const e = env(t, { attack: 0.002, release: 0.035, total: dur });
      return Math.sin(2 * Math.PI * freq * t) * 0.65 * e;
    }, dur);
  }
  return concat(
    chirp(880, 0.07),
    gap(0.09),
    chirp(880, 0.07),
    gap(0.09),
    chirp(1174, 0.1)
  );
}

function soundBuzz() {
  return render((t) => {
    const dur = 0.14;
    const e = env(t, { attack: 0.002, release: 0.04, total: dur });
    const buzz = wave("square", 2 * Math.PI * 180 * t);
    const gate = Math.sin(2 * Math.PI * 28 * t) > 0 ? 1 : 0;
    return buzz * gate * 0.4 * e;
  }, 0.14);
}

function soundWhistle() {
  return render((t) => {
    const dur = 0.22;
    const e = env(t, { attack: 0.01, release: 0.06, total: dur });
    const progress = t / dur;
    const freq = 900 + 500 * Math.sin(Math.PI * progress);
    return Math.sin(2 * Math.PI * freq * t) * 0.55 * e;
  }, 0.22);
}

/** Double tap — same pitch, quick reminder nudge. */
function soundNudge() {
  function tap() {
    return render((t) => {
      const e = env(t, { attack: 0.001, release: 0.04, total: 0.06 });
      return wave("triangle", 2 * Math.PI * 740 * t) * 0.6 * e;
    }, 0.06);
  }
  return concat(tap(), gap(0.07), tap());
}

/** Badge counter — short low ding then brighter confirm. */
function soundBadge() {
  function badgeNote(freq, dur) {
    return render((t) => {
      const e = env(t, { attack: 0.002, release: 0.05, total: dur });
      return (
        (Math.sin(2 * Math.PI * freq * t) * 0.55 +
          Math.sin(2 * Math.PI * freq * 2 * t) * 0.2) *
        e
      );
    }, dur);
  }
  return concat(badgeNote(659, 0.08), gap(0.05), badgeNote(988, 0.11));
}

// ── Tone (classic notification dings) ─────────────────────────────────────

/** You've-got-mail style: three-note upward arpeggio. */
function soundClassic() {
  return concat(note(659, 0.06), note(784, 0.06), note(988, 0.1));
}

/** Triple marimba tap — same pitch, fading hits. */
function soundMarimba() {
  function hit(gain) {
    return render((t) => {
      const dur = 0.09;
      const e = env(t, { attack: 0.001, release: 0.05, total: dur });
      const f = 698;
      const bar =
        Math.sin(2 * Math.PI * f * t) * 0.5 +
        Math.sin(2 * Math.PI * f * 3.9 * t) * 0.28;
      return bar * Math.exp(-t * 18) * gain * e;
    }, 0.09);
  }
  return concat(hit(1), gap(0.04), hit(0.75), gap(0.04), hit(0.5));
}

/** Staccato fanfare: three brass stabs upward. */
function soundHorn() {
  return concat(
    note(392, 0.07, "saw"),
    gap(0.03),
    note(523, 0.07, "saw"),
    gap(0.03),
    note(659, 0.1, "saw")
  );
}

/** Rubber-band twang — stretch up then snap. */
function soundPop() {
  return render((t) => {
    const dur = 0.12;
    const e = env(t, { attack: 0.001, release: 0.045, total: dur });
    const progress = t / dur;
    const freq = 320 + 680 * progress * progress;
    const twang = Math.sin(2 * Math.PI * freq * t);
    const snap = progress > 0.65 ? Math.exp(-(progress - 0.65) * 18) : 1;
    return twang * snap * 0.7 * e;
  }, 0.12);
}

function soundLevels() {
  function step(freq, dur) {
    return render((t) => {
      const e = env(t, { attack: 0.002, release: 0.04, total: dur });
      return Math.sin(2 * Math.PI * freq * t) * 0.65 * e;
    }, dur);
  }
  return concat(
    step(523, 0.07),
    gap(0.03),
    step(659, 0.07),
    gap(0.03),
    step(784, 0.09)
  );
}

const sounds = {
  "activity-alert.wav": soundAlert(),
  "activity-beep.wav": soundBeep(),
  "activity-digital.wav": soundDigital(),
  "activity-notify.wav": soundNotify(),
  "activity-buzz.wav": soundBuzz(),
  "activity-whistle.wav": soundWhistle(),
  "activity-nudge.wav": soundNudge(),
  "activity-badge.wav": soundBadge(),
  "activity-classic.wav": soundClassic(),
  "activity-marimba.wav": soundMarimba(),
  "activity-horn.wav": soundHorn(),
  "activity-pop.wav": soundPop(),
  "activity-levels.wav": soundLevels(),
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, samples] of Object.entries(sounds)) {
  writeWav(name, samples);
  console.log("wrote", name);
}

// Remove obsolete assets from prior catalogs
const obsolete = [
  "activity-swoosh.wav",
  "activity-ping.wav",
  "activity.wav",
  "activity-bell.wav",
  "activity-doorbell.wav",
  "activity-glass.wav",
  "activity-tritone.wav",
  "activity-knock.wav",
  "activity-coin.wav",
  "activity-ding.wav",
  "activity-droplet.wav",
  "activity-soft.wav",
  "activity-chime.wav",
  "activity-ripple.wav",
  "activity-sparkle.wav",
  "activity-bells.wav",
  "activity-tap.wav",
  "activity-glow.wav",
  "activity-bloom.wav",
  "activity-wave.wav",
  "activity-rise.wav",
  "activity-pulse.wav",
  "activity-fanfare.wav",
];

import { unlinkSync, existsSync } from "node:fs";
for (const name of obsolete) {
  const path = join(OUT_DIR, name);
  if (existsSync(path)) {
    unlinkSync(path);
    console.log("removed", name);
  }
}
