import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationSoundsSettings } from "@/components/NotificationSoundsSettings";

function SettingsBlock({ title, body }: { title: string; body: string }) {
  return (
    <section className="feed-card p-5 text-card-foreground">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </section>
  );
}

export function AccountSettingsPage() {
  const { user } = useAuth();

  return (
    <section className="space-y-4">
      <div className="px-1">
        <h1 className="text-2xl font-semibold tracking-tight">Account Settings</h1>
        <p className="text-sm text-muted-foreground">
          Privacy, security, and notification preferences.
        </p>
        {user?.username && (
          <p className="mt-2 text-sm">
            <Link className="underline underline-offset-2" to={`/u/${user.username}`}>
              Back to profile
            </Link>
          </p>
        )}
      </div>

      <NotificationSoundsSettings />

      <SettingsBlock
        title="Privacy"
        body="Control who can find your profile and send friend requests. Detailed privacy controls will land in a later pass — defaults stay open to signed-in users."
      />

      <SettingsBlock
        title="Security"
        body="Password changes, session management, and two-factor options will live here. Your session is currently cookie-based."
      />

      <SettingsBlock
        title="More settings"
        body="Language and account deletion will appear in a later pass when those features ship."
      />
    </section>
  );
}
