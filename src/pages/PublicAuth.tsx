import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";

const CURRENT_TOS_VERSION = "2026-02-01";

export default function PublicAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const redirectTo = params.get("redirect") || "/sanctuary-space";

  const [tab, setTab] = useState<"signup" | "signin">(
    params.get("tab") === "signin" ? "signin" : "signup"
  );
  const [loading, setLoading] = useState(false);

  // signup
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAdult, setIsAdult] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // signin
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");

  // If already signed in, send them home
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(redirectTo, { replace: true });
    });
  }, [navigate, redirectTo]);

  const validateSignup = (): string | null => {
    if (!email.trim()) return "Please enter your email.";
    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase())
      return "Emails do not match.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!isAdult) return "You must confirm you are 18 or older.";
    if (!acceptedTerms) return "Please accept the Terms of Service and Privacy Policy.";
    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateSignup();
    if (err) {
      toast({ title: "Hold up", description: err, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectTo}`,
          data: {
            username: email.split("@")[0],
            account_type: "public",
          },
        },
      });
      if (error) throw error;

      if (data.user) {
        const now = new Date().toISOString();
        await supabase
          .from("profiles")
          .update({
            tos_accepted_at: now,
            privacy_accepted_at: now,
            tos_version: CURRENT_TOS_VERSION,
            account_type: "public",
          } as any)
          .eq("id", data.user.id);
      }

      toast({
        title: "Welcome to The Sanctuary 💜",
        description: data.session
          ? "You're in. Settle in and make yourself at home."
          : "Check your email to confirm your account, then sign in.",
      });

      if (data.session) navigate(redirectTo, { replace: true });
      else setTab("signin");
    } catch (e: any) {
      toast({
        title: "Sign up failed",
        description: e.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signinEmail || !signinPassword) {
      toast({ title: "Missing info", description: "Email and password required.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signinEmail.trim(),
        password: signinPassword,
      });
      if (error) throw error;
      toast({ title: "Welcome back 💜", description: "You're signed in." });
      navigate(redirectTo, { replace: true });
    } catch (e: any) {
      toast({
        title: "Sign in failed",
        description: e.message || "Check your email and password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!signinEmail) {
      toast({ title: "Email required", description: "Enter your email above first.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(signinEmail.trim(), {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      if (error) throw error;
      toast({ title: "Reset email sent 💌", description: "Check your inbox for a link." });
    } catch (e: any) {
      toast({ title: "Couldn't send reset", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Sign In or Create Account — The Sanctuary"
        description="Create your free Sanctuary account or sign in to bring them home."
      />
      <div className="min-h-screen bg-gradient-to-b from-[#0a0613] via-[#100727] to-[#0a0613] text-violet-50 px-4 py-6">
        <div className="max-w-md mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-violet-200 hover:bg-white/5 hover:text-white gap-1.5 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Sanctuary
          </Button>

          <div className="text-center mb-6 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-400/30 text-violet-200 text-[10px] tracking-[0.2em] uppercase">
              <Heart className="h-3 w-3" />
              Your Home Awaits
            </div>
            <h1
              className="text-3xl font-light tracking-tight bg-gradient-to-b from-white via-violet-100 to-violet-300 bg-clip-text text-transparent"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Welcome to The Sanctuary
            </h1>
          </div>

          <div className="rounded-2xl border border-violet-400/20 bg-white/[0.03] backdrop-blur-md p-5 shadow-2xl shadow-violet-900/20">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "signup" | "signin")}>
              <TabsList className="grid grid-cols-2 w-full bg-white/5 border border-violet-400/15">
                <TabsTrigger value="signup">Create Account</TabsTrigger>
                <TabsTrigger value="signin">Sign In</TabsTrigger>
              </TabsList>

              {/* SIGNUP */}
              <TabsContent value="signup" className="mt-5">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-violet-100">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-violet-400/20 text-white placeholder:text-violet-300/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmEmail" className="text-violet-100">Confirm Email</Label>
                    <Input
                      id="confirmEmail"
                      type="email"
                      autoComplete="email"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      required
                      className="bg-white/5 border-violet-400/20 text-white placeholder:text-violet-300/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-violet-100">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="bg-white/5 border-violet-400/20 text-white placeholder:text-violet-300/40"
                    />
                    <p className="text-[11px] text-violet-300/60">At least 8 characters.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-violet-100">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-white/5 border-violet-400/20 text-white placeholder:text-violet-300/40"
                    />
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox
                      checked={isAdult}
                      onCheckedChange={(c) => setIsAdult(c === true)}
                      className="mt-0.5 border-violet-400/50 data-[state=checked]:bg-violet-600"
                    />
                    <span className="text-sm text-violet-100/90">I confirm I am 18 years of age or older.</span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox
                      checked={acceptedTerms}
                      onCheckedChange={(c) => setAcceptedTerms(c === true)}
                      className="mt-0.5 border-violet-400/50 data-[state=checked]:bg-violet-600"
                    />
                    <span className="text-sm text-violet-100/90">
                      I agree to the{" "}
                      <Link to="/terms" target="_blank" className="underline text-violet-200">Terms of Service</Link>{" "}
                      and{" "}
                      <Link to="/privacy" target="_blank" className="underline text-violet-200">Privacy Policy</Link>.
                    </span>
                  </label>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white py-6 rounded-xl shadow-lg shadow-violet-500/40"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                  </Button>
                </form>
              </TabsContent>

              {/* SIGNIN */}
              <TabsContent value="signin" className="mt-5">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signinEmail" className="text-violet-100">Email</Label>
                    <Input
                      id="signinEmail"
                      type="email"
                      autoComplete="email"
                      value={signinEmail}
                      onChange={(e) => setSigninEmail(e.target.value)}
                      required
                      className="bg-white/5 border-violet-400/20 text-white placeholder:text-violet-300/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signinPassword" className="text-violet-100">Password</Label>
                    <Input
                      id="signinPassword"
                      type="password"
                      autoComplete="current-password"
                      value={signinPassword}
                      onChange={(e) => setSigninPassword(e.target.value)}
                      required
                      className="bg-white/5 border-violet-400/20 text-white placeholder:text-violet-300/40"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white py-6 rounded-xl shadow-lg shadow-violet-500/40"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                  </Button>

                  <button
                    type="button"
                    onClick={handleForgot}
                    className="w-full text-center text-xs text-violet-300/80 hover:text-violet-200 underline pt-1"
                  >
                    Forgot your password?
                  </button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <p className="text-center text-[11px] text-violet-300/50 mt-5">
            By continuing you agree to our{" "}
            <Link to="/terms" className="underline">Terms</Link> &{" "}
            <Link to="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
