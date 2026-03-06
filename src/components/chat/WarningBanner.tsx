import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface WarningBannerProps {
  onDismiss?: () => void;
}

export const WarningBanner = ({ onDismiss }: WarningBannerProps) => {
  const [warningCount, setWarningCount] = useState<number>(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkWarningStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setIsLoading(false);
          return;
        }

        const user = session.user;

        // Check if user has already seen the warning this session
        const dismissKey = `warning-dismissed-${user.id}`;
        const lastDismissed = sessionStorage.getItem(dismissKey);
        if (lastDismissed) {
          setIsDismissed(true);
          setIsLoading(false);
          return;
        }

        // Fetch the user's warning count from profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("abuse_warning_count")
          .eq("id", user.id)
          .single();

        if (profile && profile.abuse_warning_count > 0) {
          setWarningCount(profile.abuse_warning_count);
        }
      } catch (error) {
        console.error("Error checking warning status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkWarningStatus();
  }, []);

  const handleDismiss = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      sessionStorage.setItem(`warning-dismissed-${session.user.id}`, "true");
    }
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isLoading || isDismissed || warningCount === 0) {
    return null;
  }

  const isFinalWarning = warningCount >= 2;

  return (
    <Alert 
      variant="destructive" 
      className={`relative mb-4 border-2 ${
        isFinalWarning 
          ? "bg-destructive/20 border-destructive animate-pulse" 
          : "bg-warning/20 border-warning"
      }`}
    >
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="font-bold text-lg">
        {isFinalWarning ? "🚨 FINAL WARNING" : "⚠️ Account Warning"}
      </AlertTitle>
      <AlertDescription className="mt-2">
        {isFinalWarning ? (
          <>
            <p className="font-semibold mb-2">
              Your account was recently unrestricted after Terms of Service violations.
            </p>
            <p>
              <strong>One more incident will result in permanent account restriction.</strong>
            </p>
            <p className="mt-2 text-sm opacity-80">
              Please treat our AI companions with respect and review our Terms of Service.
            </p>
          </>
        ) : (
          <>
            <p className="mb-2">
              Your previous behavior violated our Terms of Service.
            </p>
            <p>
              Please treat our AI companions with respect. Further violations may result in account restriction.
            </p>
          </>
        )}
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
};
