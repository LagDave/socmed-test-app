import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[680px] items-center justify-between px-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            SocMed application
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">Feed</Link>
            </Button>
            {user && (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/friends">Friends</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/u/${user.username || "me"}`}>Profile</Link>
                </Button>
                <ThemeToggle />
                <Button size="sm" variant="outline" onClick={() => void logout()}>
                  Log out
                </Button>
              </>
            )}
            {!user && (
              <>
                <ThemeToggle />
                <Button asChild variant="outline" size="sm">
                  <Link to="/login">Sign in</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[680px] px-4 py-6">{children}</main>
    </div>
  );
}
