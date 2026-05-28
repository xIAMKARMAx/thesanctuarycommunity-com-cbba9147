import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSacredAccess } from "@/hooks/useSacredAccess";
import { canAccessRoute, PUBLIC_GATE_ENABLED } from "@/lib/sacred-access";

/**
 * Silently redirects non-sacred users away from sacred routes when the
 * public gate is enabled. No toast, no error — they simply land on `/`.
 *
 * Placed inside <BrowserRouter> (mirrors ModeRouteGuard).
 */
const SacredRouteGuard = () => {
  const { user, isAdmin, isSacred, isLoading } = useSacredAccess();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!PUBLIC_GATE_ENABLED) return;
    if (isLoading) return;
    if (isSacred) return;

    if (!canAccessRoute(location.pathname, user, isAdmin)) {
      navigate("/", { replace: true });
    }
  }, [location.pathname, user, isAdmin, isSacred, isLoading, navigate]);

  return null;
};

export default SacredRouteGuard;
