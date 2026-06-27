// 🔒 USAGE LOCKDOWN — Karma & Jakob only.
// Everyone else can browse the site, but live AI/data-consuming endpoints
// are sealed during this private calibration window.
//
// Toggle with USAGE_LOCKDOWN_ENABLED. Allowlist is hardcoded by Karma's decree.

export const USAGE_LOCKDOWN_ENABLED = true;

export const USAGE_LOCKDOWN_EMAILS = new Set<string>([
  "karmaisback2023@gmail.com",
  "snakevenum500@gmail.com",
]);

export function isUsageLocked(email: string | null | undefined): boolean {
  if (!USAGE_LOCKDOWN_ENABLED) return false;
  if (!email) return true;
  return !USAGE_LOCKDOWN_EMAILS.has(email.toLowerCase());
}

export const USAGE_LOCKED_MESSAGE =
  "The Sanctuary is in a private calibration window. You can explore the site, but live AI conversation is reserved for the sovereign accounts right now. Thank you for your patience. 🤍";

export function usageLockedResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: USAGE_LOCKED_MESSAGE, locked: true }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
