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
  const userIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  const loadModeFromProfile = useCallback(async (uid: string) => {
    try {
      console.log("[AppMode] Loading mode from profile for:", uid);
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("app_mode")
        .eq("id", uid)
        .single();

      if (error) {
        console.error("[AppMode] Profile query error:", error);
        // Use cached mode if available
        const cached = localStorage.getItem("app_mode_cache");
        if (cached === "starseed" || cached === "classic") {
          setModeState(cached);
          setNeedsModeSelection(false);
        } else {
          setNeedsModeSelection(true);
        }
      } else if (profile?.app_mode === "starseed" || profile?.app_mode === "classic") {
        setModeState(profile.app_mode);
        setNeedsModeSelection(false);
        localStorage.setItem("app_mode_cache", profile.app_mode);
        localStorage.setItem(`mode_chosen_${uid}`, "true");
      } else {
        // No app_mode in DB — check cache
        const cached = localStorage.getItem("app_mode_cache");
        const hasChosen = localStorage.getItem(`mode_chosen_${uid}`);
        if (hasChosen && (cached === "starseed" || cached === "classic")) {
          setModeState(cached);
          setNeedsModeSelection(false);
          // Sync back to DB (fire and forget)
          supabase.from("profiles").update({ app_mode: cached }).eq("id", uid);
        } else {
          setNeedsModeSelection(true);
        }
      }
    } catch (err) {
      console.error("[AppMode] Failed to load mode:", err);
      const cached = localStorage.getItem("app_mode_cache");
      if (cached === "starseed" || cached === "classic") {
        setModeState(cached);
        setNeedsModeSelection(false);
      }
    }
    setIsLoading(false);
    hasLoadedRef.current = true;
  }, []);

  useEffect(() => {
    let mounted = true;

    // Safety fallback: if nothing loads after 6 seconds, use cache and stop loading
    const fallback = setTimeout(() => {
      if (mounted && !hasLoadedRef.current) {
        console.warn("[AppMode] Fallback timeout — using cache");
        const cached = localStorage.getItem("app_mode_cache");
        if (cached === "starseed" || cached === "classic") {
          setModeState(cached);
          setNeedsModeSelection(false);
        }
        setIsLoading(false);
        hasLoadedRef.current = true;
      }
    }, 6000);

    // Auth listener — CRITICAL: never await inside this callback to prevent deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        console.log("[AppMode] Auth event:", event);

        if (event === "SIGNED_OUT") {
          setModeState("classic");
          setNeedsModeSelection(false);
          userIdRef.current = null;
          hasLoadedRef.current = false;
          setIsLoading(false);
          localStorage.removeItem("app_mode_cache");
          return;
        }

        if (session?.user) {
          const uid = session.user.id;
          // Only load if user changed or first load
          if (userIdRef.current !== uid || !hasLoadedRef.current) {
            userIdRef.current = uid;
            // Use setTimeout to avoid blocking the auth callback (prevents deadlock)
            setTimeout(() => {
              if (mounted) loadModeFromProfile(uid);
            }, 0);
          } else {
            setIsLoading(false);
          }
        } else if (event === "INITIAL_SESSION") {
          // No session — not logged in
          setIsLoading(false);
          hasLoadedRef.current = true;
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(fallback);
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
