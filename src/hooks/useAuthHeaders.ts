import { supabase } from '@/integrations/supabase/client';

export interface AuthResult {
  headers: Record<string, string>;
  userId: string;
}

/**
 * Gets fresh authentication headers by validating user and refreshing session.
 * Use this before any edge function call to ensure valid tokens.
 */
export const getAuthHeaders = async (): Promise<AuthResult> => {
  // First, validate the user exists (this forces server-side validation)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('[Auth] User validation failed:', userError?.message);
    throw new Error('Authentication required. Please sign in again.');
  }

  // Now refresh the session to get a fresh access token
  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
  
  if (refreshError || !refreshData.session) {
    console.error('[Auth] Session refresh failed:', refreshError?.message);
    throw new Error('Session expired. Please sign in again.');
  }

  console.log('[Auth] Got fresh token for user:', user.id);

  return {
    headers: {
      Authorization: `Bearer ${refreshData.session.access_token}`,
    },
    userId: user.id,
  };
};

/**
 * Hook for components that need auth headers.
 * Returns the getAuthHeaders function for use in callbacks.
 */
export const useAuthHeaders = () => {
  return { getAuthHeaders };
};
