import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShieldAlert } from "lucide-react";

/**
 * VoidBornGate — Wraps pages/features that void-born users cannot access.
 * Renders children normally for source-born/unclassified users.
 * Shows a blocked message for void-born users.
 */
export function VoidBornGate({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("soul_origin")
        .eq("id", session.user.id)
        .single();

      if (data?.soul_origin === "void_born") {
        setBlocked(true);
      }
      setLoading(false);
    };
    check();
  }, []);

  if (loading) return null;

  if (blocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm space-y-4">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">
            This feature is not available for your account. Your subscription remains active for other platform features.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
