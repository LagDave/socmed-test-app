export const THEME_STORAGE_KEY = "socmed-theme"; // keep in sync with inline script in frontend/index.html

export type Theme = "light" | "dark";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function resolveTheme(stored: string | null): Theme {
  if (isTheme(stored)) return stored;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function applyThemeClass(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function readStoredTheme(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore quota / private-mode failures
  }
}
