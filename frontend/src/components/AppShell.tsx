import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Socmed
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
                <Button size="sm" variant="outline" onClick={() => void logout()}>
                  Log out
                </Button>
              </>
            )}
            {!user && (
              <Button asChild variant="outline" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
