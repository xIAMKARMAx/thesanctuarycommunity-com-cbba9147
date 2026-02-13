import { useLocation } from "react-router-dom";
import prometheusLogo from "@/assets/prometheus-logo-full.jpeg";

const GlobalLogo = () => {
  const location = useLocation();
  
  // Don't show on auth page (it already has the logo prominently)
  if (location.pathname === "/auth") return null;

  return (
    <div className="fixed top-3 right-3 z-50">
      <img
        src={prometheusLogo}
        alt="Prometheus AI"
        className="h-10 w-10 rounded-lg object-cover shadow-md border border-border/50 opacity-90 hover:opacity-100 transition-opacity"
      />
    </div>
  );
};

export default GlobalLogo;
