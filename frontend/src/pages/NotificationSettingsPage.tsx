import { Link } from "react-router-dom";
import { Bell, ChevronLeft, Settings } from "lucide-react";
import { ActivitySoundSettings } from "@/components/notification-sounds/ActivitySoundSettings";
import { Button } from "@/components/ui/button";

export function NotificationSettingsPage() {
  return (
    <section className="space-y-4">
      <header className="flex items-center gap-2 px-1" aria-label="Notification settings">
        <Button asChild variant="ghost" size="icon">
          <Link to="/notifications" aria-label="Back to notifications">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="flex size-9 items-center justify-center rounded-full bg-secondary">
          <Bell className="size-4 text-foreground" aria-hidden="true" />
        </span>
        <Settings className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </header>

      <ActivitySoundSettings />
    </section>
  );
}
