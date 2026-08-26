import { Bell, ChevronRight, Home, LogOut, MessageCircle, Moon, Sun, Users } from "lucide-react";
import { Link } from "react-router-dom";
import type { PublicUser } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import type { Theme } from "@/lib/theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { NavIconLink } from "./NavIconLink";

export type AppNavbarProps = {
  user: PublicUser | null;
  profilePath: string;
  isProfileActive: boolean;
  feedCount: number;
  messagesCount: number;
  notificationCount: number;
  theme: Theme;
  onToggleTheme: () => void;
  onLogout: () => void;
};

export function AppNavbar({
  user,
  profilePath,
  isProfileActive,
  feedCount,
  messagesCount,
  notificationCount,
  theme,
  onToggleTheme,
  onLogout,
}: AppNavbarProps) {
  return (
    <header className="app-navbar">
      <div className="app-navbar-inner">
        <Link to="/" className="app-navbar-brand truncate">
          SocMed
        </Link>

        <nav
          className="app-navbar-pill-track"
          aria-label="Primary"
        >
          <NavIconLink
            to="/"
            end
            label="Feed"
            variant="pill"
            badge={feedCount}
            icon={<Home className="size-[18px]" strokeWidth={2} aria-hidden="true" />}
          />
          {user && (
            <NavIconLink
              to="/messages"
              label="Messages"
              variant="pill"
              badge={messagesCount}
              icon={<MessageCircle className="size-[18px]" strokeWidth={2} aria-hidden="true" />}
            />
          )}
          {user && (
            <NavIconLink
              to="/friends"
              label="Friends"
              variant="pill"
              icon={<Users className="size-[18px]" strokeWidth={2} aria-hidden="true" />}
            />
          )}
        </nav>

        <div className="app-navbar-actions" aria-label="Account">
          {user ? (
            <>
              <NavIconLink
                to="/notifications"
                label="Notifications"
                variant="action"
                badge={notificationCount}
                icon={<Bell className="size-[18px]" strokeWidth={2} aria-hidden="true" />}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "app-navbar-profile-trigger",
                      isProfileActive && "app-navbar-profile-trigger-active"
                    )}
                    aria-label="Profile menu"
                    title="Profile menu"
                  >
                    <ProfileAvatar
                      displayName={user.displayName}
                      avatarUrl={user.avatarUrl}
                      size="xs"
                      className="app-navbar-profile-avatar border-0 shadow-none"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className={cn(
                    "app-navbar-profile-menu animate-menu-enter z-50",
                    theme === "dark" && "!shadow-none"
                  )}
                >
                  <DropdownMenuItem asChild>
                    <Link
                      to={profilePath}
                      aria-label={`View ${user.displayName}'s profile`}
                      className="app-navbar-profile-menu-summary"
                    >
                      <ProfileAvatar
                        displayName={user.displayName}
                        avatarUrl={user.avatarUrl}
                        size="sm"
                        className="app-navbar-profile-menu-avatar"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="app-navbar-profile-menu-name truncate">{user.displayName}</span>
                      </span>
                      <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="app-navbar-profile-menu-divider" />
                  <DropdownMenuItem
                    className="app-navbar-profile-menu-item"
                    onSelect={() => {
                      onToggleTheme();
                    }}
                  >
                    {theme === "dark" ? (
                      <Sun className="size-[18px] shrink-0" aria-hidden="true" />
                    ) : (
                      <Moon className="size-[18px] shrink-0" aria-hidden="true" />
                    )}
                    <span>{theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="app-navbar-profile-menu-divider" />
                  <DropdownMenuItem
                    className="app-navbar-profile-menu-item app-navbar-profile-menu-item-destructive"
                    onSelect={() => {
                      void onLogout();
                    }}
                  >
                    <LogOut className="size-[18px] shrink-0" aria-hidden="true" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button asChild variant="outline" size="sm" className="ml-1">
                <Link to="/login">Sign in</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
