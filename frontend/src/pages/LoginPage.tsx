import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Placeholder until plan 03 auth lands. */
export function LoginPage() {
  return (
    <section className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Auth endpoints arrive in plan 03.</p>
      </div>
      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
        <Input type="email" placeholder="Email" disabled />
        <Input type="password" placeholder="Password" disabled />
        <Button type="submit" className="w-full" disabled>
          Sign in
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        No account yet? <Link className="underline" to="/register">Register</Link>
      </p>
    </section>
  );
}
