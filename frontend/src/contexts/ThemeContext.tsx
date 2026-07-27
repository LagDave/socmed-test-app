import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  applyThemeClass,
  readStoredTheme,
  resolveTheme,
  writeStoredTheme,
  type Theme,
} from "@/lib/theme";

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

function readInitialTheme(): Theme {
  return resolveTheme(readStoredTheme());
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    writeStoredTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      writeStoredTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme requires ThemeProvider");
  return ctx;
}
