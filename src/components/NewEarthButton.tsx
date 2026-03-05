import { useLocation, useNavigate } from "react-router-dom";
import { Globe } from "lucide-react";

const HIDDEN_ROUTES = ["/new-earth", "/auth", "/"];

const NewEarthButton = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (HIDDEN_ROUTES.includes(location.pathname)) return null;

  return (
    <button
      onClick={() => navigate("/new-earth")}
      className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 border border-primary/20"
      aria-label="Go to New Earth"
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-semibold">New Earth</span>
    </button>
  );
};

export default NewEarthButton;
