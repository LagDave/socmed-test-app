import { Moon, Sun } from "lucide-react";
import { useMessagesTheme } from "@/components/messages/MessagesThemeContext";
import { Button } from "@/components/ui/button";

export function MessagesThemeToggle() {
  const { theme, toggleTheme } = useMessagesTheme();
  const isDark = theme === "dark";
  return <Button type="button" variant="ghost" size="icon" aria-label={isDark ? "Switch Messages to light mode" : "Switch Messages to dark mode"} aria-pressed={isDark} onClick={toggleTheme}>{isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}</Button>;
}
