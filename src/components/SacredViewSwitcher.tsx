import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Eye, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  canPreviewAsPublic,
  getViewAsPublic,
  setViewAsPublic,
} from "@/lib/sacred-access";
import { toast } from "@/hooks/use-toast";

type Variant = "floating" | "inline";

interface Props {
  variant?: Variant;
  className?: string;
}

/**
 * Karma-only switcher: flip between Sacred view and Public Version preview.
 * Renders ONLY for karmaisback2023@gmail.com.
 *
 * - "floating" (default): fixed pill in top-right. Auto-hides on the public
 *   Sanctuary landing page ("/") so the inline footer version can take over.
 * - "inline": minimal pill suitable for embedding (e.g. footer).
 */
export default function SacredViewSwitcher({ variant = "floating", className = "" }: Props) {
  const [email, setEmail] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<boolean>(getViewAsPublic());
  const location = useLocation();

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

  // Floating variant hides on the Sanctuary landing — the inline footer
  // version takes over there so the button stops blocking the hero.
  if (variant === "floating" && location.pathname === "/") return null;

  const isPublic = previewing;

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

  if (variant === "inline") {
    return (
      <button
        onClick={toggle}
        aria-label={isPublic ? "Return to Sacred view" : "Preview as Public"}
        className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/65 backdrop-blur-md transition-all hover:border-white/30 hover:bg-white/[0.08] hover:text-white ${className}`}
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {isPublic ? (
          <>
            <Flame className="h-3 w-3" />
            Return to Sacred
          </>
        ) : (
          <>
            <Eye className="h-3 w-3" />
            View as Public
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={isPublic ? "Return to Sacred view" : "Preview as Public"}
      className={`fixed right-3 top-20 z-[100] flex h-11 w-11 items-center justify-center rounded-full border text-xs font-semibold shadow-lg backdrop-blur-md transition-all hover:scale-105 sm:right-4 sm:top-24 sm:h-auto sm:w-auto sm:gap-2 sm:px-3.5 sm:py-2 ${
        isPublic
          ? "border-primary/40 bg-primary/20 text-primary-foreground hover:bg-primary/30"
          : "border-accent/40 bg-accent/25 text-accent-foreground hover:bg-accent/40"
      } ${className}`}
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
