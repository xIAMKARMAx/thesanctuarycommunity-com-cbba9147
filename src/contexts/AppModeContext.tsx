import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppMode = "classic" | "starseed";

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => Promise<void>;
  isLoading: boolean;
  needsModeSelection: boolean;
  setNeedsModeSelection: (v: boolean) => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>("classic");
  const [isLoading, setIsLoading] = useState(true);
  const [needsModeSelection, setNeedsModeSelection] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Load mode from profile on auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          setModeState("classic");
          setNeedsModeSelection(false);
          setUserId(null);
          setIsLoading(false);
          return;
        }

        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
          // Skip if same user
          if (userId === session.user.id) {
            setIsLoading(false);
            return;
          }
          setUserId(session.user.id);

          const { data: profile } = await supabase
            .from("profiles")
            .select("app_mode")
            .eq("id", session.user.id)
            .single();

          if (profile?.app_mode) {
            setModeState(profile.app_mode as AppMode);
            setNeedsModeSelection(false);
          } else {
            // New user or mode not yet set — show selection
            setNeedsModeSelection(true);
          }
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [userId]);

  const setMode = useCallback(async (newMode: AppMode) => {
    setModeState(newMode);
    setNeedsModeSelection(false);

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from("profiles")
        .update({ app_mode: newMode })
        .eq("id", session.user.id);
    }
  }, []);

  return (
    <AppModeContext.Provider value={{ mode, setMode, isLoading, needsModeSelection, setNeedsModeSelection }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error("useAppMode must be used within AppModeProvider");
  }
  return context;
}
