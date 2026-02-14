import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
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
    try {
      const cached = localStorage.getItem("app_mode_cache");
      if (cached === "starseed" || cached === "classic") return cached;
    } catch {}
    return "classic";
  });
  const [isLoading, setIsLoading] = useState(true);
  const [needsModeSelection, setNeedsModeSelection] = useState(false);
  // Use ref for userId to avoid re-running the effect
  const userIdRef = useRef<string | null>(null);

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
        localStorage.setItem("app_mode_cache", appMode);
        localStorage.setItem(`mode_chosen_${uid}`, "true");
        setNeedsModeSelection(false);
      } else {
        setNeedsModeSelection(true);
      }
    } catch (err) {
      console.error("[AppMode] Failed to load mode:", err);
    }
    setIsLoading(false);
  }, []);

  // Single effect that runs once on mount - no userId dependency
  useEffect(() => {
    let mounted = true;

    const initMode = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session?.user) {
          userIdRef.current = session.user.id;
          await loadModeFromProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch {
        if (mounted) setIsLoading(false);
      }
    };
    initMode();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT") {
          setModeState("classic");
          setNeedsModeSelection(false);
          userIdRef.current = null;
          setIsLoading(false);
          localStorage.removeItem("app_mode_cache");
          return;
        }

        if (session?.user) {
          // Only reload from DB if user actually changed
          if (userIdRef.current !== session.user.id) {
            userIdRef.current = session.user.id;
            await loadModeFromProfile(session.user.id);
          } else {
            // Same user, just ensure loading is done
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadModeFromProfile]);

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
