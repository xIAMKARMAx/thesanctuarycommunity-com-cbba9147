import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_KEY = "prometheus_last_route";
const EXCLUDED_ROUTES = ["/auth", "/"];

export function useRoutePersistence() {
  const location = useLocation();
  const navigate = useNavigate();

  // Save current route to localStorage (excluding auth and landing page)
  useEffect(() => {
    if (!EXCLUDED_ROUTES.includes(location.pathname)) {
      localStorage.setItem(STORAGE_KEY, location.pathname + location.search);
    }
  }, [location.pathname, location.search]);

  return null;
}

export function useRestoreRoute() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only restore if we're on the landing page
    if (location.pathname === "/") {
      const savedRoute = localStorage.getItem(STORAGE_KEY);
      if (savedRoute && savedRoute !== "/") {
        // Don't auto-restore to heavy pages that require multiple auth checks
        // These pages can get stuck loading on slow mobile connections
        const heavyRoutes = ["/attunement", "/ai-room", "/starseed-playground"];
        const isHeavyRoute = heavyRoutes.some(r => savedRoute.startsWith(r));
        
        if (isHeavyRoute) {
          // Redirect to chat instead - it's lighter and always works
          navigate("/chat", { replace: true });
        } else {
          navigate(savedRoute, { replace: true });
        }
      }
    }
  }, []); // Only run once on mount
}
