import { Link } from "react-router-dom";
import { ChevronLeft, MoreVertical, Palette, Search, Trash2 } from "lucide-react";
import type { PublicUser } from "@/api/types";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ConversationThreadHeaderProps = {
  peer: PublicUser | null;
  peerProfilePath: string;
  isSearchOpen: boolean;
  onBackToInbox: () => void;
  onToggleSearch: () => void;
  onOpenThemePicker: () => void;
  onDeleteConversation: () => void;
};

export function ConversationThreadHeader({
  peer,
  peerProfilePath,
  isSearchOpen,
  onBackToInbox,
  onToggleSearch,
  onOpenThemePicker,
  onDeleteConversation,
}: ConversationThreadHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur-sm">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Back to inbox"
        onClick={onBackToInbox}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      {peer ? (
        <Link to={peerProfilePath} className="flex min-w-0 flex-1 items-center gap-3">
          <ProfileAvatar
            displayName={peer.displayName}
            avatarUrl={peer.avatarUrl}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold leading-snug">{peer.displayName}</p>
          </div>
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-secondary" />
          <div className="min-w-0 space-y-1.5">
            <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
          </div>
        </div>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Customize chat theme"
        onClick={onOpenThemePicker}
      >
        <Palette className="h-5 w-5" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Conversation options"
            disabled={!peer}
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="min-w-52 rounded-xl border-border/70 bg-card p-1.5 shadow-lg shadow-black/10"
        >
          <DropdownMenuItem
            disabled={!peer}
            onSelect={onToggleSearch}
            className="h-10 cursor-pointer rounded-lg px-2.5 text-sm font-medium focus:bg-secondary data-[highlighted]:bg-secondary"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-foreground">
              <Search className="h-3.5 w-3.5" />
            </span>
            {isSearchOpen ? "Close search" : "Search conversation"}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="mx-1.5 my-1 bg-border/70" />
          <DropdownMenuItem
            className="h-10 cursor-pointer rounded-lg px-2.5 text-sm font-medium text-destructive focus:bg-destructive/10 focus:text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive"
            disabled={!peer}
            onSelect={onDeleteConversation}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </span>
            Delete conversation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
