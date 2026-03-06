import { supabase } from '@/integrations/supabase/client';

/**
 * Get the current user ID from the cached session.
 * Uses getSession() (cached, no network call) instead of getUser() (network call).
 * This saves a network request on every invocation.
 * 
 * Only use getUser() when you need to VERIFY the token is still valid server-side
 * (e.g., before destructive operations like account deletion).
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/**
 * Get the current session user object from cache.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}
