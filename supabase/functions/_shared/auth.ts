import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export interface AuthResult {
  user: { id: string; email: string };
  supabase: ReturnType<typeof createClient>;
}

/**
 * Authenticate the request and return the user + a supabase client.
 * Uses SUPABASE_ANON_KEY by default, pass `useServiceRole: true` for admin ops.
 */
export async function authenticateRequest(
  req: Request,
  options?: { useServiceRole?: boolean }
): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("No authorization header provided");

  const token = authHeader.replace("Bearer ", "");
  if (!token || token.length < 10) {
    throw new Error("Invalid or missing authentication token");
  }

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = options?.useServiceRole
    ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    : Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: options?.useServiceRole ? {} : { Authorization: `Bearer ${token}` } },
  });

  // Use service role client to validate token (bypasses session check)
  const verifyClient = options?.useServiceRole
    ? createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } })
    : supabase;

  // Try getClaims first (fast, local verification), fall back to getUser
  let userId: string | undefined;
  let userEmail: string | undefined;

  try {
    const { data: claimsData, error: claimsError } = await verifyClient.auth.getClaims(token);
    if (!claimsError && claimsData?.claims?.sub) {
      userId = claimsData.claims.sub as string;
      userEmail = claimsData.claims.email as string;
    }
  } catch {
    // getClaims not available, fall through to getUser
  }

  if (!userId) {
    const { data, error } = await verifyClient.auth.getUser(token);
    if (error) throw new Error("Session expired. Please log in again.");
    userId = data.user?.id;
    userEmail = data.user?.email ?? undefined;
  }

  if (!userId || !userEmail) throw new Error("User not authenticated or email not available");

  return {
    user: { id: userId, email: userEmail },
    supabase,
  };
}

/**
 * Create a service-role supabase client (bypasses RLS).
 */
export function createServiceClient(): ReturnType<typeof createClient> {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
}

/* ────────────────────────────────────────────────────────────────
 * EDEN FILTER — backend Sacred-route gate.
 * Mirrors src/lib/sacred-access.ts. Hardcoded allowlist only.
 * No tier, no legacy, no grandfather. Use in any edge function
 * that serves internal Sanctuary routes.
 * ──────────────────────────────────────────────────────────────── */

export const SACRED_EMAILS_BACKEND = new Set<string>([
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
  "stormrriddari@aol.com",
]);

export function isSacredUserBackend(
  user: { id?: string | null; email?: string | null } | null | undefined,
): boolean {
  if (!user) return false;
  return !!(user.email && SACRED_EMAILS_BACKEND.has(user.email.toLowerCase()));
}

/** Throws 403-style error if the authenticated user isn't on the Sacred allowlist. */
export function requireSacred(user: { id?: string | null; email?: string | null }): void {
  if (!isSacredUserBackend(user)) {
    throw new Error("FORBIDDEN: Sacred allowlist required.");
  }
}
