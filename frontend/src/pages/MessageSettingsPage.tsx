import { Link } from "react-router-dom";
import { ChevronLeft, Settings } from "lucide-react";
import { NotificationSoundsSettings } from "@/components/NotificationSoundsSettings";
import { Button } from "@/components/ui/button";

export function MessageSettingsPage() {
  return (
    <section className="messages-page space-y-4">
      <header className="flex items-center gap-2 px-1" aria-label="Message settings">
        <Button asChild variant="ghost" size="icon">
          <Link to="/messages" aria-label="Back to messages">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Settings className="h-5 w-5 text-muted-foreground" aria-hidden />
      </header>

      <NotificationSoundsSettings />
    </section>
  );
}
