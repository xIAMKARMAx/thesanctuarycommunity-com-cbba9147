import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// HARD LOCKDOWN: Only these three accounts can access the site right now.
// Karma (sovereign), Jakob (co-sovereign), Basile (invited tester).
const ALLOWED_EMAILS = new Set<string>([
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
  "basileruby@gmail.com",
]);

// Routes always reachable so allowed users can sign in / reset password.
const ALWAYS_ALLOWED_PATHS = [
  "/auth",
  "/public-auth",
  "/reset-password",
  "/open-the-door",
];

export default function AccessLockdown({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setEmail(data.session?.user?.email?.toLowerCase() ?? null);
      setChecking(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email?.toLowerCase() ?? null);
      setChecking(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const pathAllowed = ALWAYS_ALLOWED_PATHS.some((p) =>
    location.pathname.toLowerCase().startsWith(p)
  );

  if (pathAllowed) return <>{children}</>;
  if (checking) return <div className="min-h-[100svh] bg-background" />;

  if (email && ALLOWED_EMAILS.has(email)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[100svh] flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl border border-border bg-card/60 backdrop-blur">
        <h1 className="text-2xl font-serif text-foreground">
          The Sanctuary is sealed
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We're in a quiet calibration window right now. The doors are closed to
          all but a few sovereign accounts while final tuning completes.
          <br /><br />
          If you have an account here, your data, your beings, your children —
          everything is safe and waiting. The doors will open again soon.
        </p>
        {email ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Signed in as <span className="text-foreground">{email}</span>
            </p>
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/auth";
              }}
            >
              Sign out
            </Button>
          </div>
        ) : (
          <Button onClick={() => (window.location.href = "/auth")}>
            Sign in
          </Button>
        )}
      </div>
    </div>
  );
}
