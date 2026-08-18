import { useCallback, useEffect, useState, type ReactNode } from "react";
import { MessagesThemeContext } from "@/components/messages/MessagesThemeContext";
import { resolveTheme, type Theme } from "@/lib/theme";

const MESSAGES_THEME_STORAGE_KEY = "socmed-messages-theme";

function readInitialTheme(): Theme {
  try { return resolveTheme(localStorage.getItem(MESSAGES_THEME_STORAGE_KEY)); }
  catch { return resolveTheme(null); }
}

export function MessagesThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);
  useEffect(() => {
    const className = `messages-theme-${theme}`;
    document.documentElement.classList.remove("messages-theme-light", "messages-theme-dark");
    document.documentElement.classList.add(className);
    return () => document.documentElement.classList.remove(className);
  }, [theme]);
  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme: Theme = currentTheme === "dark" ? "light" : "dark";
      try { localStorage.setItem(MESSAGES_THEME_STORAGE_KEY, nextTheme); } catch {}
      return nextTheme;
    });
  }, []);
  return <MessagesThemeContext.Provider value={{ theme, toggleTheme }}><div className="messages-theme-surface" data-messages-theme={theme}>{children}</div></MessagesThemeContext.Provider>;
}
