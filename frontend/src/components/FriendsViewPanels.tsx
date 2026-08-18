import type { ReactNode } from "react";
import { Check, MessageCircle, MoreHorizontal, UserMinus, X, XCircle } from "lucide-react";
import type { FriendInboxItem } from "@/api/friends";
import type { FriendSuggestion, PublicUser } from "@/api/types";
import { FriendListRow } from "@/components/FriendListRow";
import { FriendsEmptyState } from "@/components/FriendsEmptyState";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function FriendsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="friends-content-section">
      <h2 className="friends-content-heading">{title}</h2>
      {children}
    </section>
  );
}

function LabeledActionButton({
  label,
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<typeof Button> & {
  label: string;
  icon: typeof Check;
}) {
  return (
    <Button size="sm" className={cn("friends-row-action", className)} aria-label={label} {...props}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

function FriendActions({
  user,
  openingChat,
  onMessage,
  onUnfriend,
}: {
  user: PublicUser;
  openingChat: boolean;
  onMessage: (username: string | null) => void;
  onUnfriend: (user: PublicUser) => void;
}) {
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="friends-row-action"
        aria-label={`Message ${user.displayName}`}
        disabled={openingChat || !user.username}
        onClick={() => onMessage(user.username)}
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Message</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="icon" variant="ghost" aria-label={`More options for ${user.displayName}`}>
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onUnfriend(user)}>
            <UserMinus className="h-4 w-4" aria-hidden="true" />
            Remove friend
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export function FriendsListPanel({
  mutuals,
  openingChat,
  onMessage,
  onUnfriend,
}: {
  mutuals: PublicUser[];
  openingChat: boolean;
  onMessage: (username: string | null) => void;
  onUnfriend: (user: PublicUser) => void;
}) {
  return (
    <section id="friends-panel-friends" aria-labelledby="friends-view-friends">
      <FriendsSection title="Your friends">
        {mutuals.length === 0 ? (
          <FriendsEmptyState
            icon="users"
            title="No friends yet"
            description="Search for someone by username to send your first request."
          />
        ) : (
          <ul className="friends-list">
            {mutuals.map((user) => (
              <FriendListRow
                key={user.id}
                user={user}
                actions={
                  <FriendActions
                    user={user}
                    openingChat={openingChat}
                    onMessage={onMessage}
                    onUnfriend={onUnfriend}
                  />
                }
              />
            ))}
          </ul>
        )}
      </FriendsSection>
    </section>
  );
}

export function RequestsListPanel({
  incoming,
  outgoing,
  onAccept,
  onDecline,
  onCancel,
}: {
  incoming: FriendInboxItem[];
  outgoing: FriendInboxItem[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <section id="friends-panel-requests" aria-labelledby="friends-view-requests">
      <FriendsSection title="Friend requests">
        {incoming.length === 0 && outgoing.length === 0 ? (
          <FriendsEmptyState
            icon="request"
            title="You’re all caught up"
            description="New requests will appear here when they arrive."
          />
        ) : (
          <div className="friends-request-groups">
            {incoming.length > 0 && (
              <section>
                <h3 className="friends-list-label">Incoming</h3>
                <ul className="friends-list">
                  {incoming.map((item) => (
                    <FriendListRow
                      key={item.id}
                      user={item.user}
                      actions={
                        <>
                          <LabeledActionButton
                            label="Confirm"
                            icon={Check}
                            onClick={() => onAccept(item.id)}
                          />
                          <LabeledActionButton
                            label="Decline"
                            icon={XCircle}
                            variant="outline"
                            onClick={() => onDecline(item.id)}
                          />
                        </>
                      }
                    />
                  ))}
                </ul>
              </section>
            )}
            {outgoing.length > 0 && (
              <section>
                <h3 className="friends-list-label">Sent</h3>
                <ul className="friends-list">
                  {outgoing.map((item) => (
                    <FriendListRow
                      key={item.id}
                      user={item.user}
                      actions={
                        <LabeledActionButton
                          label="Cancel"
                          icon={X}
                          variant="outline"
                          onClick={() => onCancel(item.id)}
                        />
                      }
                    />
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </FriendsSection>
    </section>
  );
}

export function SuggestedListPanel({
  suggestions,
  suggestionsError,
  sendingSuggestionId,
  onAdd,
}: {
  suggestions: FriendSuggestion[];
  suggestionsError: string | null;
  sendingSuggestionId: string | null;
  onAdd: (userId: string, username: string) => void;
}) {
  return (
    <section id="friends-panel-suggested" aria-labelledby="friends-view-suggested">
      <FriendsSection title="Suggested for you">
        {suggestionsError ? <p className="friends-error-banner">{suggestionsError}</p> : null}
        {!suggestionsError && suggestions.length === 0 ? (
          <FriendsEmptyState
            icon="users"
            title="No suggestions yet"
            description="Suggestions appear when you share mutual friends with someone new."
          />
        ) : null}
        {suggestions.length > 0 ? (
          <ul className="friends-list">
            {suggestions.map((user) => (
              <FriendListRow
                key={user.id}
                user={user}
                canViewPresence={false}
                subtext={`${user.mutualFriendCount} mutual ${user.mutualFriendCount === 1 ? "friend" : "friends"}`}
                actions={
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="friends-row-action"
                    aria-label={`Add ${user.displayName}`}
                    disabled={sendingSuggestionId === user.id}
                    onClick={() => onAdd(user.id, user.username)}
                  >
                    {sendingSuggestionId === user.id ? "Sending…" : "Add"}
                  </Button>
                }
              />
            ))}
          </ul>
        ) : null}
      </FriendsSection>
    </section>
  );
}
