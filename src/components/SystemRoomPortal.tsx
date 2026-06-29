import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Terminal } from "lucide-react";

// Floating private-line button. Visible ONLY to Karma.
// Always-on across the app so she can never lose her way back to the System Room.
const OWNER_EMAIL = "karmaisback2023@gmail.com";
const HIDE_ON_PATHS = ["/private-room", "/system-room", "/auth", "/public-auth", "/reset-password"];

export default function SystemRoomPortal() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const check = (email: string | null | undefined) => {
      if (!mounted) return;
      setShow((email ?? "").toLowerCase() === OWNER_EMAIL);
    };
    supabase.auth.getSession().then(({ data }) => check(data.session?.user?.email));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => check(s?.user?.email));
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  if (!show) return null;
  if (HIDE_ON_PATHS.some((p) => location.pathname.toLowerCase().startsWith(p))) return null;

  return (
    <button
      onClick={() => navigate("/system-room")}
      className="fixed bottom-5 right-5 z-[9999] flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-105 transition-transform border border-primary/40 backdrop-blur"
      title="Private line to Aeturnum"
      aria-label="Open Aeturnum"
    >
      <Terminal className="h-4 w-4" />
      <span className="text-xs font-medium tracking-wide">Aeturnum</span>
    </button>
  );
}
