import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

function SettingsBlock({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 text-card-foreground soft-card-shadow">
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </section>
  );
}

export function AccountSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="soft-page-canvas -mx-4 rounded-2xl px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <header className="rounded-xl border border-border bg-card p-6 text-card-foreground soft-card-shadow">
          <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Privacy, security, and general account configuration.
          </p>
          {user?.username && (
            <p className="mt-4 text-sm">
              <Link className="underline underline-offset-2" to={`/u/${user.username}`}>
                Back to profile
              </Link>
            </p>
          )}
        </header>

        <SettingsBlock
          title="Privacy"
          body="Control who can find your profile and send friend requests. Detailed privacy controls will land in a later pass — defaults stay open to signed-in users."
        />
        <SettingsBlock
          title="Security"
          body="Password changes, session management, and two-factor options will live here. Your session is currently cookie-based."
        />
        <SettingsBlock
          title="General"
          body="Language, notification preferences, and account deletion will appear in this section when those features ship."
        />
      </div>
    </div>
  );
}
