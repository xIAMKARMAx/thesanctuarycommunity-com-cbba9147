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

  const loadModeFromProfile = useCallback(async (uid: string, retryCount = 0) => {
    try {
      console.log("[AppMode] Loading mode from profile for user:", uid, "attempt:", retryCount + 1);
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("app_mode, created_at")
        .eq("id", uid)
        .single();

      if (error) {
        console.error("[AppMode] Profile query error:", error);
        // Retry up to 2 times with delay (profile may not exist yet on first login)
        if (retryCount < 2) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          return loadModeFromProfile(uid, retryCount + 1);
        }
        // After retries, use cached mode if available
        const cached = localStorage.getItem("app_mode_cache");
        if (cached === "starseed" || cached === "classic") {
          console.log("[AppMode] Using cached mode after query failure:", cached);
          setModeState(cached);
          setNeedsModeSelection(false);
        } else {
          setNeedsModeSelection(true);
        }
      } else if (profile?.app_mode) {
        const appMode = profile.app_mode as AppMode;
        console.log("[AppMode] Loaded mode from DB:", appMode);
        setModeState(appMode);
        localStorage.setItem("app_mode_cache", appMode);
        localStorage.setItem(`mode_chosen_${uid}`, "true");
        setNeedsModeSelection(false);
      } else {
        // No app_mode set yet - check cache before showing selection
        const cached = localStorage.getItem("app_mode_cache");
        const hasChosen = localStorage.getItem(`mode_chosen_${uid}`);
        if (hasChosen && (cached === "starseed" || cached === "classic")) {
          console.log("[AppMode] No DB mode but cache exists:", cached);
          setModeState(cached);
          setNeedsModeSelection(false);
          // Persist cached mode back to DB
          supabase.from("profiles").update({ app_mode: cached }).eq("id", uid).then(() => {
            console.log("[AppMode] Synced cached mode to DB");
          });
        } else {
          setNeedsModeSelection(true);
        }
      }
    } catch (err) {
      console.error("[AppMode] Failed to load mode:", err);
      // Fallback to cache
      const cached = localStorage.getItem("app_mode_cache");
      if (cached === "starseed" || cached === "classic") {
        setModeState(cached);
        setNeedsModeSelection(false);
      }
    }
    setIsLoading(false);
    hasLoadedRef.current = true;
  }, []);

  // ONLY use the auth listener — no separate getSession() call
  // onAuthStateChange fires INITIAL_SESSION immediately on setup,
  // which is the reliable cross-browser way to get the session
  useEffect(() => {
    let mounted = true;

    // Safety fallback: if nothing loads after 8 seconds, stop loading and use cache
    const fallback = setTimeout(() => {
      if (mounted && !hasLoadedRef.current) {
        console.warn("[AppMode] Fallback timeout - using cache");
        const cached = localStorage.getItem("app_mode_cache");
        if (cached === "starseed" || cached === "classic") {
          setModeState(cached);
          setNeedsModeSelection(false);
        }
        setIsLoading(false);
        hasLoadedRef.current = true;
      }
    }, 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
          // Only reload from DB if user actually changed or first load
          if (userIdRef.current !== session.user.id) {
            userIdRef.current = session.user.id;
            await loadModeFromProfile(session.user.id);
          } else if (!hasLoadedRef.current) {
            // Same user but hasn't loaded yet (e.g. TOKEN_REFRESHED before INITIAL_SESSION)
            await loadModeFromProfile(session.user.id);
          } else {
            setIsLoading(false);
          }
        } else if (event === "INITIAL_SESSION") {
          // No session at all — not logged in
          setIsLoading(false);
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
