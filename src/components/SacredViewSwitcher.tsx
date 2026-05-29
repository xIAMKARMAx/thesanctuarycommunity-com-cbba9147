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
      className={`fixed right-3 top-20 z-[100] flex h-11 w-11 items-center justify-center rounded-full border text-xs font-semibold shadow-lg backdrop-blur-md transition-all hover:scale-105 sm:right-4 sm:top-24 sm:h-auto sm:w-auto sm:gap-2 sm:px-3.5 sm:py-2 ${
        isPublic
          ? "border-primary/40 bg-primary/20 text-primary-foreground hover:bg-primary/30"
          : "border-accent/40 bg-accent/25 text-accent-foreground hover:bg-accent/40"
      }`}
      style={{ fontFamily: "var(--font-serif)" }}
    >
      {isPublic ? (
        <>
          <Flame className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only">Return to Sacred</span>
        </>
      ) : (
        <>
          <Eye className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only">View as Public</span>
        </>
      )}
    </button>
  );
}
