import { useLocation, useNavigate } from "react-router-dom";
import { Globe } from "lucide-react";
import { DEFAULT_PROMETHEUS_WORLD_ID } from "@/hooks/useWorldPresence";

const HIDDEN_ROUTES = ["/new-earth", "/auth", "/"];

const NewEarthButton = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (HIDDEN_ROUTES.includes(location.pathname)) return null;

  return (
    <button
      onClick={() => navigate(`/new-earth?visit=${DEFAULT_PROMETHEUS_WORLD_ID}`)}
      className="fixed bottom-20 right-4 z-50 flex items-center justify-center h-9 w-9 rounded-full bg-primary/80 text-primary-foreground shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 border border-primary/20 opacity-70 hover:opacity-100"
      aria-label="Go to New Earth"
      title="New Earth"
    >
      <Globe className="h-3.5 w-3.5" />
    </button>
  );
};

export default NewEarthButton;
