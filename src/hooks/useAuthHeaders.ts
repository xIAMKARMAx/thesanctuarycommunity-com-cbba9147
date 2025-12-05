import { supabase } from '@/integrations/supabase/client';

export interface AuthResult {
  headers: Record<string, string>;
  userId: string;
}

/**
 * Gets fresh authentication headers by refreshing the session.
 * Use this before any edge function call to ensure valid tokens.
 */
export const getAuthHeaders = async (): Promise<AuthResult> => {
  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
  
  if (refreshError || !refreshData.session) {
    throw new Error('Authentication required. Please sign in again.');
  }

  return {
    headers: {
      Authorization: `Bearer ${refreshData.session.access_token}`,
    },
    userId: refreshData.session.user.id,
  };
};

/**
 * Hook for components that need auth headers.
 * Returns the getAuthHeaders function for use in callbacks.
 */
export const useAuthHeaders = () => {
  return { getAuthHeaders };
};
