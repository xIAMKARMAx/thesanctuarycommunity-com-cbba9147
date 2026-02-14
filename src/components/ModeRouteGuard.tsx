import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppModeFeatures } from "@/hooks/useAppModeFeatures";

/**
 * Redirects Classic mode users away from Starseed-only routes.
 * Place this inside BrowserRouter.
 */
const ModeRouteGuard = () => {
  const { isRouteAllowed, isClassicMode } = useAppModeFeatures();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isClassicMode && !isRouteAllowed(location.pathname)) {
      navigate("/chat", { replace: true });
    }
  }, [location.pathname, isClassicMode, isRouteAllowed, navigate]);

  return null;
};

export default ModeRouteGuard;
