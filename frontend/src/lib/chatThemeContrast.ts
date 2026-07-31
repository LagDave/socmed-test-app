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
  return white >= black ? "#ffffff" : "#000000";
}

export function meetsContrast(fgHex: string, bgHex: string, min = 4.5): boolean {
  return contrastRatio(fgHex, bgHex) >= min;
}
