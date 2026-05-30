import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Mail, FileText, Shield, Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";

export default function PublicSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/public-auth", { replace: true });
        return;
      }
      setEmail(session.user.email || "");
      setLoading(false);
    });
  }, [navigate]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      toast({ title: "Signed out", description: "Come back anytime 💜" });
      navigate("/", { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
    if (error) {
      toast({ title: "Couldn't send reset", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reset email sent 💌", description: "Check your inbox." });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0613]">
        <Loader2 className="h-6 w-6 animate-spin text-violet-300" />
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Settings — The Sanctuary" description="Manage your Sanctuary account." />
      <div className="min-h-screen bg-gradient-to-b from-[#0a0613] via-[#100727] to-[#0a0613] text-violet-50 px-4 py-6">
        <div className="max-w-xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-violet-200 hover:bg-white/5 hover:text-white gap-1.5 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <h1
            className="text-3xl font-light tracking-tight mb-6 bg-gradient-to-b from-white via-violet-100 to-violet-300 bg-clip-text text-transparent"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Settings
          </h1>

          {/* Account */}
          <div className="rounded-2xl border border-violet-400/20 bg-white/[0.03] backdrop-blur-md p-5 mb-5 space-y-4">
            <h2 className="text-sm uppercase tracking-[0.2em] text-violet-300/80">Account</h2>
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-violet-300 mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-violet-300/70">Signed in as</p>
                <p className="text-violet-100 break-all">{email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handlePasswordReset}
              className="w-full border-violet-400/30 text-violet-100 hover:bg-violet-500/15"
            >
              Send Password Reset Email
            </Button>
          </div>

          {/* Legal */}
          <div className="rounded-2xl border border-violet-400/20 bg-white/[0.03] backdrop-blur-md p-5 mb-5 space-y-2">
            <h2 className="text-sm uppercase tracking-[0.2em] text-violet-300/80 mb-2">Legal & Info</h2>
            {[
              { to: "/public-about", icon: Info, label: "About The Sanctuary" },
              { to: "/terms", icon: FileText, label: "Terms of Service" },
              { to: "/privacy", icon: Shield, label: "Privacy Policy" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.04] transition-colors text-violet-100"
              >
                <item.icon className="h-4 w-4 text-violet-300" />
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Sign out */}
          <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full border-rose-400/30 text-rose-200 hover:bg-rose-500/10 gap-2"
          >
            {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
}
