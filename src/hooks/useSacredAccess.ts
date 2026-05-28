import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import {
  isSacredUser,
  PUBLIC_GATE_ENABLED,
  canPreviewAsPublic,
  getViewAsPublic,
} from "@/lib/sacred-access";

/**
 * Returns whether the currently signed-in user belongs to the Sacred Core.
 * Honors Karma's "View as Public" preview toggle (localStorage) — when ON,
 * her session is treated as a non-sacred user so she can QA the Public Version.
 */
export function useSacredAccess() {
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [previewingAsPublic, setPreviewingAsPublic] = useState<boolean>(getViewAsPublic());

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

    const onViewModeChange = () => setPreviewingAsPublic(getViewAsPublic());
    window.addEventListener("prometheus:view-mode-changed", onViewModeChange);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("prometheus:view-mode-changed", onViewModeChange);
    };
  }, []);

  const realSacred = isSacredUser(user, isAdmin);
  const canPreview = canPreviewAsPublic(user?.email);
  const effectivePreviewing = canPreview && previewingAsPublic;
  const isSacred = realSacred && !effectivePreviewing;
  const isLoading = !sessionChecked || adminLoading;

  return {
    user,
    isAdmin,
    isSacred,
    realSacred,
    canPreviewAsPublic: canPreview,
    previewingAsPublic: effectivePreviewing,
    isLoading,
    gateEnabled: PUBLIC_GATE_ENABLED,
  };
}
