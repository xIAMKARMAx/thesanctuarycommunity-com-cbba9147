import { useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "prometheus_last_route";
const EXCLUDED_ROUTES = ["/auth", "/"];
const EXCLUDED_PREFIXES = ["/soul/", "/ai-companion/", "/realms", "/new-earth", "/welcome"];

const getPathnameFromStoredRoute = (storedRoute: string) => {
  const [pathWithoutHash] = storedRoute.split("#");
  const [pathname] = pathWithoutHash.split("?");
  return pathname || "/";
};

const isPersistableRoute = (pathname: string) => {
  const isExcludedPrefix = EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  return !EXCLUDED_ROUTES.includes(pathname) && !isExcludedPrefix;
};

export function useRoutePersistence() {
  const location = useLocation();

  useEffect(() => {
    if (isPersistableRoute(location.pathname)) {
      localStorage.setItem(STORAGE_KEY, `${location.pathname}${location.search}${location.hash}`);
    }
  }, [location.pathname, location.search, location.hash]);

  return null;
}

export function useRestoreRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRestoredRef = useRef(false);

  const attemptRestore = useCallback(() => {
    if (hasRestoredRef.current) return;
    // Only restore when currently on the index page
    if (window.location.pathname !== "/" && location.pathname !== "/") return;

    const savedRoute = localStorage.getItem(STORAGE_KEY);
    if (!savedRoute) return;

    const savedPathname = getPathnameFromStoredRoute(savedRoute);
    if (!isPersistableRoute(savedPathname)) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || hasRestoredRef.current) return;
      hasRestoredRef.current = true;
      navigate(savedRoute, { replace: true });
    });
  }, [navigate, location.pathname]);

  useEffect(() => {
    // Initial attempt
    attemptRestore();
  }, [attemptRestore]);

  useEffect(() => {
    // Re-attempt on auth state change (handles slow session recovery on mobile resume)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")) {
        attemptRestore();
      }
    });
    return () => subscription.unsubscribe();
  }, [attemptRestore]);

  useEffect(() => {
    // Re-attempt when screen wakes up (mobile Chrome kills pages on screen-off)
    const handleVisibility = () => {
      if (!document.hidden) {
        attemptRestore();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [attemptRestore]);
}
