import { supabase } from '@/integrations/supabase/client';

export interface AuthResult {
  headers: Record<string, string>;
  userId: string;
}

// Cache to prevent rapid token refreshes
let lastRefreshTime = 0;
let cachedResult: AuthResult | null = null;
const CACHE_DURATION_MS = 5000; // 5 seconds

/**
 * Gets authentication headers, with caching to prevent rate limits.
 * Use this before any edge function call to ensure valid tokens.
 */
export const getAuthHeaders = async (): Promise<AuthResult> => {
  const now = Date.now();
  
  // Return cached result if fresh enough
  if (cachedResult && now - lastRefreshTime < CACHE_DURATION_MS) {
    return cachedResult;
  }

  // First try to get the session (cached, no API call)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    // Try one refresh before giving up
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session) {
      console.error('[Auth] No valid session:', sessionError?.message || refreshError?.message);
      cachedResult = null;
      throw new Error('Authentication required. Please sign in again.');
    }
    cachedResult = {
      headers: { Authorization: `Bearer ${refreshData.session.access_token}` },
      userId: refreshData.session.user.id,
    };
    lastRefreshTime = now;
    return cachedResult;
  }

  // Check if token is about to expire (within 60 seconds)
  const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
  const isExpiringSoon = expiresAt - now < 60000;

  if (isExpiringSoon) {
    // Only refresh if token is actually expiring soon
    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.warn('[Auth] Session refresh failed, using existing token:', refreshError?.message);
        // Fall back to current session if refresh fails
      } else {
        // Update cache with refreshed session
        cachedResult = {
          headers: {
            Authorization: `Bearer ${refreshData.session.access_token}`,
          },
          userId: refreshData.session.user.id,
        };
        lastRefreshTime = now;
        return cachedResult;
      }
    } catch (refreshErr) {
      console.warn('[Auth] Refresh attempt failed:', refreshErr);
      // Fall through to use existing session
    }
  }

  // Use current session token
  cachedResult = {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    userId: session.user.id,
  };
  lastRefreshTime = now;

  return cachedResult;
};

/**
 * Clear the auth cache (call on logout)
 */
export const clearAuthCache = () => {
  cachedResult = null;
  lastRefreshTime = 0;
};

/**
 * Hook for components that need auth headers.
 * Returns the getAuthHeaders function for use in callbacks.
 */
export const useAuthHeaders = () => {
  return { getAuthHeaders, clearAuthCache };
};
