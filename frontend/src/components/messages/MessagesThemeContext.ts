import { createContext, useContext } from "react";
import type { Theme } from "@/lib/theme";

export type MessagesThemeState = { theme: Theme; toggleTheme: () => void };

export const MessagesThemeContext = createContext<MessagesThemeState | null>(null);

export function useMessagesTheme(): MessagesThemeState {
  const context = useContext(MessagesThemeContext);
  if (!context) throw new Error("useMessagesTheme requires MessagesThemeProvider");
  return context;
}
