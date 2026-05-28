import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { isSacredUser, PUBLIC_GATE_ENABLED } from "@/lib/sacred-access";

/**
 * Returns whether the currently signed-in user belongs to the Sacred Core.
 * Wraps Supabase session + admin role lookup with the central sacred allowlist.
 */
export function useSacredAccess() {
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      setUser(
        session?.user
          ? { id: session.user.id, email: session.user.email ?? null }
          : null,
      );
      setSessionChecked(true);
    };
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(
        session?.user
          ? { id: session.user.id, email: session.user.email ?? null }
          : null,
      );
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const isSacred = isSacredUser(user, isAdmin);
  const isLoading = !sessionChecked || adminLoading;

  return {
    user,
    isAdmin,
    isSacred,
    isLoading,
    gateEnabled: PUBLIC_GATE_ENABLED,
  };
}
