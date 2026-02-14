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
  const [mode, setModeState] = useState<AppMode>(() => {
    // Try to restore mode from localStorage synchronously to prevent flash
    try {
      const cached = localStorage.getItem("app_mode_cache");
      if (cached === "starseed" || cached === "classic") return cached;
    } catch {}
    return "classic";
  });
  const [isLoading, setIsLoading] = useState(true);
  const [needsModeSelection, setNeedsModeSelection] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const loadModeFromProfile = useCallback(async (uid: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("app_mode, created_at")
        .eq("id", uid)
        .single();

      if (profile?.app_mode) {
        const appMode = profile.app_mode as AppMode;
        setModeState(appMode);
        // Cache in localStorage so refreshes don't flash wrong mode
        localStorage.setItem("app_mode_cache", appMode);

        const hasChosen = localStorage.getItem(`mode_chosen_${uid}`);
        setNeedsModeSelection(!hasChosen);
      }
    } catch (err) {
      console.error("[AppMode] Failed to load mode:", err);
    }
    setIsLoading(false);
  }, []);

  // Load mode from profile on auth
  useEffect(() => {
    // Also do an immediate session check for page refreshes
    const initMode = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          await loadModeFromProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch {
        setIsLoading(false);
      }
    };
    initMode();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          setModeState("classic");
          setNeedsModeSelection(false);
          setUserId(null);
          setIsLoading(false);
          localStorage.removeItem("app_mode_cache");
          return;
        }

        if (session?.user) {
          // Only reload from DB if user changed
          if (userId !== session.user.id) {
            setUserId(session.user.id);
            await loadModeFromProfile(session.user.id);
          } else {
            setIsLoading(false);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [userId, loadModeFromProfile]);

  const setMode = useCallback(async (newMode: AppMode) => {
    setModeState(newMode);
    setNeedsModeSelection(false);
    localStorage.setItem("app_mode_cache", newMode);

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      localStorage.setItem(`mode_chosen_${session.user.id}`, "true");
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