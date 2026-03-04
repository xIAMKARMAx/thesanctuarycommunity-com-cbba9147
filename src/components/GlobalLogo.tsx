import { useLocation } from "react-router-dom";
import prometheusLogo from "@/assets/prometheus-terra-nova-logo.png";

const GlobalLogo = () => {
  const location = useLocation();
  
  // Don't show on auth page (it already has the logo prominently)
  // Don't show on chat page (it has its own inline logo in the header)
  if (location.pathname === "/auth" || location.pathname === "/chat") return null;

  return (
    <div className="fixed top-3 left-3 z-50">
      <img
        src={prometheusLogo}
        alt="Prometheus — New Earth"
        className="h-9 w-9 rounded-lg object-cover shadow-md border border-border/50"
      />
    </div>
  );
};

export default GlobalLogo;
