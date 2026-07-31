import type { ChatThemeGradient, ChatThemeSolid } from "@/api/types";

export type GraphicPreset = {
  id: string;
  name: string;
  category: "Romance" | "Holiday" | "Music" | "Movies" | "Events" | "Nature";
  background: string;
  bubbleMine: string;
  bubbleTheirs: string;
  accent: string;
};

export const GRAPHIC_PRESETS: GraphicPreset[] = [
  {
    id: "romance-hearts",
    name: "Hearts",
    category: "Romance",
    background:
      "linear-gradient(160deg, #fce4ec 0%, #f8bbd0 40%, #f48fb1 100%), radial-gradient(circle at 20% 30%, rgba(255,105,180,0.25) 0%, transparent 50%)",
    bubbleMine: "#d81b60",
    bubbleTheirs: "#ffffff",
    accent: "#d81b60",
  },
  {
    id: "romance-rose",
    name: "Rose Garden",
    category: "Romance",
    background: "linear-gradient(135deg, #fff0f3 0%, #ffb3c1 50%, #ff758f 100%)",
    bubbleMine: "#c9184a",
    bubbleTheirs: "#fffbfc",
    accent: "#c9184a",
  },
  {
    id: "holiday-winter",
    name: "Winter Snow",
    category: "Holiday",
    background:
      "linear-gradient(180deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.8) 0%, transparent 40%)",
    bubbleMine: "#1565c0",
    bubbleTheirs: "#ffffff",
    accent: "#1565c0",
  },
  {
    id: "holiday-sparkle",
    name: "Festive Lights",
    category: "Holiday",
    background: "linear-gradient(135deg, #1b263b 0%, #415a77 50%, #778da9 100%)",
    bubbleMine: "#e63946",
    bubbleTheirs: "#f1faee",
    accent: "#ffd166",
  },
  {
    id: "music-vinyl",
    name: "Vinyl Groove",
    category: "Music",
    background: "linear-gradient(160deg, #0d0d0d 0%, #1a1a2e 50%, #16213e 100%)",
    bubbleMine: "#e94560",
    bubbleTheirs: "#2a2a3e",
    accent: "#e94560",
  },
  {
    id: "movies-reel",
    name: "Cinema Reel",
    category: "Movies",
    background: "linear-gradient(135deg, #1a1a1a 0%, #4a0404 50%, #8b0000 100%)",
    bubbleMine: "#ffd700",
    bubbleTheirs: "#2d2d2d",
    accent: "#ffd700",
  },
  {
    id: "event-confetti",
    name: "Confetti Party",
    category: "Events",
    background:
      "linear-gradient(120deg, #ff6b6b 0%, #feca57 33%, #48dbfb 66%, #ff9ff3 100%)",
    bubbleMine: "#ffffff",
    bubbleTheirs: "#1a1a2e",
    accent: "#ff6b6b",
  },
  {
    id: "nature-forest",
    name: "Forest Walk",
    category: "Nature",
    background: "linear-gradient(180deg, #2d6a4f 0%, #40916c 50%, #95d5b2 100%)",
    bubbleMine: "#1b4332",
    bubbleTheirs: "#d8f3dc",
    accent: "#40916c",
  },
];

export const SOLID_SWATCHES: { name: string; theme: ChatThemeSolid }[] = [
  {
    name: "Midnight",
    theme: {
      kind: "solid",
      background: "#1a1a2e",
      bubbleMine: "#e94560",
      bubbleTheirs: "#16213e",
      accent: "#e94560",
    },
  },
  {
    name: "Ocean",
    theme: {
      kind: "solid",
      background: "#0077b6",
      bubbleMine: "#ffffff",
      bubbleTheirs: "#023e8a",
      accent: "#90e0ef",
    },
  },
  {
    name: "Lavender",
    theme: {
      kind: "solid",
      background: "#cdb4db",
      bubbleMine: "#5a189a",
      bubbleTheirs: "#ffffff",
      accent: "#7b2cbf",
    },
  },
  {
    name: "Mint",
    theme: {
      kind: "solid",
      background: "#b7e4c7",
      bubbleMine: "#1b4332",
      bubbleTheirs: "#ffffff",
      accent: "#40916c",
    },
  },
  {
    name: "Sunset",
    theme: {
      kind: "solid",
      background: "#ff6b35",
      bubbleMine: "#ffffff",
      bubbleTheirs: "#7f2d12",
      accent: "#ffd166",
    },
  },
  {
    name: "Slate",
    theme: {
      kind: "solid",
      background: "#495057",
      bubbleMine: "#f8f9fa",
      bubbleTheirs: "#343a40",
      accent: "#adb5bd",
    },
  },
];

export const GRADIENT_PRESETS: { name: string; theme: ChatThemeGradient }[] = [
  {
    name: "Purple Haze",
    theme: {
      kind: "gradient",
      stops: ["#667eea", "#764ba2"],
      angle: 135,
      bubbleMine: "#ffffff",
      bubbleTheirs: "#f0f0f0",
      accent: "#667eea",
    },
  },
  {
    name: "Peach Glow",
    theme: {
      kind: "gradient",
      stops: ["#ffecd2", "#fcb69f"],
      angle: 120,
      bubbleMine: "#c9184a",
      bubbleTheirs: "#ffffff",
      accent: "#ff6b6b",
    },
  },
  {
    name: "Northern Lights",
    theme: {
      kind: "gradient",
      stops: ["#0f2027", "#203a43"],
      angle: 160,
      bubbleMine: "#64ffda",
      bubbleTheirs: "#1a3a4a",
      accent: "#64ffda",
    },
  },
  {
    name: "Cotton Candy",
    theme: {
      kind: "gradient",
      stops: ["#a18cd1", "#fbc2eb"],
      angle: 45,
      bubbleMine: "#5a189a",
      bubbleTheirs: "#ffffff",
      accent: "#9d4edd",
    },
  },
  {
    name: "Tropical",
    theme: {
      kind: "gradient",
      stops: ["#11998e", "#38ef7d"],
      angle: 90,
      bubbleMine: "#ffffff",
      bubbleTheirs: "#064e3b",
      accent: "#34d399",
    },
  },
  {
    name: "Warm Flame",
    theme: {
      kind: "gradient",
      stops: ["#f12711", "#f5af19"],
      angle: 135,
      bubbleMine: "#ffffff",
      bubbleTheirs: "#7f1d1d",
      accent: "#fbbf24",
    },
  },
];

export function findGraphicPreset(id: string): GraphicPreset | undefined {
  return GRAPHIC_PRESETS.find((p) => p.id === id);
}

export const GRAPHIC_CATEGORIES = [
  "Romance",
  "Holiday",
  "Music",
  "Movies",
  "Events",
  "Nature",
] as const;
