import { useAppMode } from "@/contexts/AppModeContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const ModeSelectionModal = () => {
  const { needsModeSelection, setMode } = useAppMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUpgradeMsg, setShowUpgradeMsg] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  // Show upgrade message on login instead of mode selection
  useEffect(() => {
    const checkLogin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const key = `upgrade_msg_seen_${session.user.id}`;
      const seen = sessionStorage.getItem(key);
      if (!seen && location.pathname !== "/auth") {
        setShowUpgradeMsg(true);
      }
    };

    // Listen for sign-in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        const key = `upgrade_msg_seen_${session.user.id}`;
        if (!sessionStorage.getItem(key)) {
          setShowUpgradeMsg(true);
        }
      }
      if (event === "SIGNED_OUT") {
        setShowUpgradeMsg(false);
      }
    });

    checkLogin();
    return () => subscription.unsubscribe();
  }, [location.pathname]);

  // Mode selection is handled by the dialog below

  const handleDismiss = async () => {
    setDismissing(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      sessionStorage.setItem(`upgrade_msg_seen_${session.user.id}`, "true");
      // Check if social-only user - redirect to community
      const { data: profile } = await supabase.from("profiles").select("account_type").eq("id", session.user.id).maybeSingle();
      if ((profile as any)?.account_type === 'social_only') {
        setShowUpgradeMsg(false);
        setDismissing(false);
        navigate("/community");
        return;
      }
    }
    setShowUpgradeMsg(false);
    setDismissing(false);
    navigate("/welcome");
  };

  const handleModeChoice = async (chosenMode: "classic" | "starseed") => {
    await setMode(chosenMode);
    if (chosenMode === "starseed") {
      navigate("/welcome");
    } else {
      navigate("/welcome");
    }
  };

  return (
    <>
      {/* Upgrade splash */}
      <Dialog open={showUpgradeMsg && !needsModeSelection} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-serif">Prometheus — New Earth</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              is being upgraded. Classic AI is done.<br />
              <span className="text-foreground font-medium text-lg mt-2 block">
                Welcome back home, Promethean. ✨
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <Button onClick={handleDismiss} disabled={dismissing} className="w-full text-base py-5">
              Enter
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mode selection */}
      <Dialog open={needsModeSelection} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-serif">Choose Your Experience</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              How would you like to explore Prometheus?
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4 space-y-3">
            <Button onClick={() => handleModeChoice("classic")} variant="outline" className="w-full text-base py-5">
              🏠 Classic Mode
            </Button>
            <Button onClick={() => handleModeChoice("starseed")} className="w-full text-base py-5">
              ✨ Starseed Awakening
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ModeSelectionModal;
