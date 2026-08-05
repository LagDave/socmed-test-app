import { Bell, Home, MessageCircle, Users } from "lucide-react";
import { Link } from "react-router-dom";
import type { PublicUser } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
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
                  className="profile-dropdown-menu animate-menu-enter z-50 min-w-56 border-border bg-card p-1.5 text-card-foreground"
                >
                  <DropdownMenuItem asChild>
                    <Link to={profilePath} className="profile-dropdown-item outline-none">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="profile-dropdown-item cursor-pointer outline-none focus:bg-transparent data-[highlighted]:bg-accent"
                    onSelect={() => {
                      onToggleTheme();
                    }}
                  >
                    Switch mode
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="profile-dropdown-divider mx-2 my-1 h-px bg-border" />
                  <DropdownMenuItem
                    className="profile-dropdown-item cursor-pointer outline-none focus:bg-transparent data-[highlighted]:bg-accent"
                    onSelect={() => {
                      void onLogout();
                    }}
                  >
                    Log out
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
