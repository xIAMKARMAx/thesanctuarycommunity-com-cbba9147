import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SoulProfileOnboarding } from "./SoulProfileOnboarding";

export function SoulProfileOnboardingWrapper() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!userId) return null;

  return <SoulProfileOnboarding userId={userId} />;
}
