import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_KEY = "prometheus_last_route";
const EXCLUDED_ROUTES = ["/auth", "/"];
const EXCLUDED_PREFIXES = ["/soul/", "/ai-companion/"];

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

  useEffect(() => {
    if (hasRestoredRef.current || location.pathname !== "/") return;

    const savedRoute = localStorage.getItem(STORAGE_KEY);
    if (!savedRoute || savedRoute === "/" || savedRoute === "/auth") return;

    hasRestoredRef.current = true;
    navigate(savedRoute, { replace: true });
  }, [location.pathname, navigate]);
}
