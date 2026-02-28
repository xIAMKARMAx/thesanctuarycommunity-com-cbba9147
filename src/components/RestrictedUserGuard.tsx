import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Global guard that checks if the logged-in user is restricted/banned.
 * If so, signs them out immediately and shows a message.
 */
const RestrictedUserGuard = () => {
  useEffect(() => {
    const checkRestriction = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('is_restricted')
        .eq('id', userId)
        .single();

      if ((data as any)?.is_restricted) {
        toast.error('Your account has been suspended. Contact support if you believe this is an error.');
        await supabase.auth.signOut();
      }
    };

    // Check on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        checkRestriction(session.user.id);
      }
    });

    // Check on every auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.id) {
        checkRestriction(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
};

export default RestrictedUserGuard;
