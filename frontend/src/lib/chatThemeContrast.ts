const HEX_RE = /^#([0-9A-Fa-f]{6})$/;

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = HEX_RE.exec(hex);
  if (!match) return null;
  const n = parseInt(match[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function relativeLuminanceFromHex(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return relativeLuminance(rgb.r, rgb.g, rgb.b);
}

function extractHexColors(color: string): string[] {
  const matches = color.match(/#([0-9A-Fa-f]{6})/gi);
  if (!matches) return [];
  return [...new Set(matches.map((match) => match.toLowerCase()))];
}

function darkestHex(hexes: string[]): string {
  return hexes.reduce((darkest, hex) => {
    const luminance = relativeLuminanceFromHex(hex) ?? 1;
    const darkestLuminance = relativeLuminanceFromHex(darkest) ?? 1;
    return luminance < darkestLuminance ? hex : darkest;
  });
}

export function contrastRatio(fgHex: string, bgHex: string): number {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  if (!fg || !bg) return 1;
  const l1 = relativeLuminance(fg.r, fg.g, fg.b);
  const l2 = relativeLuminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function pickForeground(bgHex: string): "#000000" | "#ffffff" {
  const black = contrastRatio("#000000", bgHex);
  const white = contrastRatio("#ffffff", bgHex);
  const chosen = white >= black ? "#ffffff" : "#000000";
  if (contrastRatio(chosen, bgHex) >= 4.5) return chosen;
  return chosen === "#ffffff" ? "#000000" : "#ffffff";
}

/** Muted label color that stays readable on the given background. */
export function pickMutedForeground(bgHex: string): string {
  const fg = pickForeground(bgHex);
  if (fg === "#ffffff") {
    for (const candidate of ["#f3f4f6", "#e5e7eb", "#d1d5db", "#9ca3af"]) {
      if (meetsContrast(candidate, bgHex, 4.5)) return candidate;
    }
    return "#ffffff";
  }
  for (const candidate of ["#374151", "#4b5563", "#6b7280"]) {
    if (meetsContrast(candidate, bgHex, 4.5)) return candidate;
  }
  return "#000000";
}

/** Thread text color that stays readable across gradient stops. */
export function pickThreadForeground(
  background: string,
  fallbackSample: string
): "#000000" | "#ffffff" {
  const samples = extractHexColors(background);
  const hexes = samples.length > 0 ? samples : [fallbackSample];
  const whiteOk = hexes.every((hex) => meetsContrast("#ffffff", hex, 4.5));
  const blackOk = hexes.every((hex) => meetsContrast("#000000", hex, 4.5));

  if (whiteOk && !blackOk) return "#ffffff";
  if (blackOk && !whiteOk) return "#000000";

  return pickForeground(darkestHex(hexes));
}

/** Muted thread labels that stay readable across gradient stops. */
export function pickThreadMutedForeground(background: string, fallbackSample: string): string {
  const samples = extractHexColors(background);
  const hexes = samples.length > 0 ? samples : [fallbackSample];
  const anchor = darkestHex(hexes);
  const fg = pickForeground(anchor);

  if (fg === "#ffffff") {
    for (const candidate of ["#f3f4f6", "#e5e7eb", "#d1d5db", "#9ca3af"]) {
      if (hexes.every((hex) => meetsContrast(candidate, hex, 4.5))) return candidate;
    }
    return "#ffffff";
  }

  for (const candidate of ["#374151", "#4b5563", "#6b7280"]) {
    if (hexes.every((hex) => meetsContrast(candidate, hex, 4.5))) return candidate;
  }
  return "#000000";
}

export function meetsContrast(fgHex: string, bgHex: string, min = 4.5): boolean {
  return contrastRatio(fgHex, bgHex) >= min;
}
