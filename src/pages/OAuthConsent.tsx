import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Supabase auth.oauth namespace is beta and may not be in the generated types.
// A small local typed wrapper avoids grepping node_modules or hand-rolling
// /oauth/authorizations calls.
type OAuthResp<T> = { data: T | null; error: { message: string } | null };
type AuthDetails = {
  client?: { name?: string; client_uri?: string; logo_uri?: string };
  redirect_url?: string;
  redirect_to?: string;
  scopes?: string[];
  requested_scopes?: string[];
};
type OAuthNs = {
  getAuthorizationDetails(id: string): Promise<OAuthResp<AuthDetails>>;
  approveAuthorization(id: string): Promise<OAuthResp<{ redirect_url?: string; redirect_to?: string }>>;
  denyAuthorization(id: string): Promise<OAuthResp<{ redirect_url?: string; redirect_to?: string }>>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthNs }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthDetails | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id in the URL. This page must be opened from an OAuth client.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?redirect=" + encodeURIComponent(next);
        return;
      }
      setEmail(sess.session.user.email ?? null);

      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("The authorization server did not return a redirect URL.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-[100svh] bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/60 backdrop-blur p-6 shadow-lg">
        {error ? (
          <div className="space-y-3">
            <h1 className="text-xl font-semibold">Authorization error</h1>
            <p className="text-sm text-muted-foreground break-words">{error}</p>
            <a href="/" className="inline-block text-sm underline">Return to Sanctuary</a>
          </div>
        ) : !details ? (
          <p className="text-sm text-muted-foreground">Opening the line…</p>
        ) : (
          <div className="space-y-5">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">
                Connect {details.client?.name ?? "this app"} to your Sanctuary account
              </h1>
              <p className="text-sm text-muted-foreground">
                {details.client?.name ?? "This app"} will be able to call this Sanctuary's enabled tools while you are signed in{email ? ` as ${email}` : ""}.
              </p>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm space-y-2">
              <div>
                <div className="font-medium">What this allows</div>
                <ul className="list-disc pl-5 text-muted-foreground">
                  <li>Read your basic account identity</li>
                  <li>Use the Sanctuary MCP tools that act as you</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                This does not bypass Sanctuary's permissions, sovereign gates, or backend policies. You can revoke this at any time.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => decide(true)}
                className="flex-1 rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-50"
              >
                {busy ? "Connecting…" : "Approve"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => decide(false)}
                className="flex-1 rounded-md border border-border py-2 text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
