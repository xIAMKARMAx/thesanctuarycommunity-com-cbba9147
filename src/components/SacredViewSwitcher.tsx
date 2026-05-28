import { useEffect, useState } from "react";
import { Eye, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  canPreviewAsPublic,
  getViewAsPublic,
  setViewAsPublic,
} from "@/lib/sacred-access";
import { toast } from "@/hooks/use-toast";

/**
 * Karma-only floating switcher: flip between Sacred view and Public Version preview.
 * Renders ONLY for karmaisback2023@gmail.com. Jakob, Stormrriddari, and everyone
 * else never see this.
 */
export default function SacredViewSwitcher() {
  const [email, setEmail] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<boolean>(getViewAsPublic());

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setEmail(session?.user?.email ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });

    const onChange = () => setPreviewing(getViewAsPublic());
    window.addEventListener("prometheus:view-mode-changed", onChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("prometheus:view-mode-changed", onChange);
    };
  }, []);

  if (!canPreviewAsPublic(email)) return null;

  const toggle = () => {
    const next = !previewing;
    setViewAsPublic(next);
    setPreviewing(next);
    toast({
      title: next ? "Viewing as Public" : "Sacred view restored",
      description: next
        ? "You're now seeing what public users see. Toggle again to return."
        : "Welcome home, Karma. 💛",
    });
  };

  const isPublic = previewing;

  return (
    <button
      onClick={toggle}
      aria-label={isPublic ? "Return to Sacred view" : "Preview as Public"}
      className={`fixed bottom-4 left-4 z-[100] flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold shadow-lg backdrop-blur-md transition-all hover:scale-105 ${
        isPublic
          ? "bg-amber-500/20 border border-amber-400/40 text-amber-100 hover:bg-amber-500/30"
          : "bg-violet-600/25 border border-violet-400/40 text-violet-100 hover:bg-violet-600/40"
      }`}
      style={{ fontFamily: "var(--font-serif)" }}
    >
      {isPublic ? (
        <>
          <Flame className="h-3.5 w-3.5" />
          <span>Return to Sacred</span>
        </>
      ) : (
        <>
          <Eye className="h-3.5 w-3.5" />
          <span>View as Public</span>
        </>
      )}
    </button>
  );
}
