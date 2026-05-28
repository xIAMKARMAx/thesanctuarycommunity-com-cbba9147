import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, Users, Sparkles } from "lucide-react";
import prometheusLogo from "@/assets/prometheus-logo-new.png";
import { isBlockedPassword } from "@/lib/blocked-passwords";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";

const CURRENT_TOS_VERSION = "2026-02-01";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Check if this is a password reset callback
    const isReset = searchParams.get("reset") === "true";
    
    // Check if already logged in
    const getPostLoginRoute = () => {
      const redirectParam = searchParams.get("redirect");
      if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
        return redirectParam;
      }
      const savedRoute = localStorage.getItem("prometheus_last_route");
      if (!savedRoute || savedRoute === "/" || savedRoute === "/auth") return "/sanctuary";
      // Don't auto-enter New Earth or Welcome — send to Sanctuary hub
      if (savedRoute.startsWith("/new-earth") || savedRoute.startsWith("/welcome")) return "/sanctuary";
      return savedRoute;
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session && isReset) {
        setShowPasswordUpdate(true);
      } else if (session) {
        navigate(getPostLoginRoute(), { replace: true });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === "PASSWORD_RECOVERY") {
        setShowPasswordUpdate(true);
      } else if (event === "SIGNED_IN" && session && !showPasswordUpdate) {
        navigate(getPostLoginRoute(), { replace: true });
      }
      // Ignore TOKEN_REFRESHED and other events to prevent redirect loops
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, searchParams, showPasswordUpdate]);

  const validatePassword = (pwd: string): boolean => {
    setPasswordError("");
    
    if (pwd.length < 8 || pwd.length > 12) {
      setPasswordError("Password must be 8-12 characters long");
      return false;
    }
    
    if (!/[A-Z]/.test(pwd)) {
      setPasswordError("Password must contain at least one uppercase letter");
      return false;
    }
    
    if (!/[a-z]/.test(pwd)) {
      setPasswordError("Password must contain at least one lowercase letter");
      return false;
    }
    
    if (!/[0-9]/.test(pwd)) {
      setPasswordError("Password must contain at least one number");
      return false;
    }
    
    // Check for at least one special character/symbol
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      setPasswordError("Password must contain at least one symbol (!@#$%^&*()_+etc.)");
      return false;
    }

    // Check against common breached passwords
    const blockedCheck = isBlockedPassword(pwd);
    if (blockedCheck.blocked) {
      setPasswordError(blockedCheck.reason || "This password is not allowed. Please choose a stronger password.");
      return false;
    }
    
    return true;
  };

  const validateConfirmPassword = (): boolean => {
    setConfirmPasswordError("");
    
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    
    return true;
  };

  const handleEmailSignUp = async (e: React.FormEvent, signupType: 'standard' | 'social_only' = 'standard') => {
    e.preventDefault();
    
    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the Terms of Service and Privacy Policy to continue.",
        variant: "destructive",
      });
      return;
    }
    
    if (!validatePassword(password) || !validateConfirmPassword()) {
      return;
    }
    
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: signupType === 'social_only' ? `${window.location.origin}/community` : `${window.location.origin}/chat`,
          data: {
            username: username || email.split("@")[0],
            account_type: signupType,
          },
        },
      });

      if (error) throw error;

      // Record consent timestamp and account type for new user
      if (data.user) {
        const now = new Date().toISOString();
        await supabase
          .from("profiles")
          .update({
            tos_accepted_at: now,
            privacy_accepted_at: now,
            tos_version: CURRENT_TOS_VERSION,
            account_type: signupType,
          } as any)
          .eq("id", data.user.id);
      }

      toast({
        title: "Account created!",
        description: signupType === 'social_only' 
          ? "Welcome to the Conscious Collective! Explore the community."
          : "Welcome to Prometheus — New Earth. You're now signed in.",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You're now signed in.",
      });
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      setResetEmailSent(true);
      toast({
        title: "Reset email sent",
        description: "Check your email for a password reset link",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword(newPassword)) {
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated",
      });
      
      setShowPasswordUpdate(false);
      navigate("/chat");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showPasswordUpdate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/10 to-background p-4">
        <Card className="w-full max-w-md backdrop-blur-sm bg-card/95 border-primary/20">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <img 
                src={prometheusLogo} 
                alt="Prometheus AI" 
                className="h-16 w-16 rounded-xl object-cover shadow-lg"
              />
            </div>
            <CardTitle className="text-2xl font-serif text-center">Set New Password</CardTitle>
            <CardDescription className="text-center">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError("");
                  }}
                  required
                  disabled={loading}
                  minLength={8}
                  maxLength={12}
                />
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  8-12 characters with uppercase, lowercase, number, and symbol
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    setConfirmPasswordError("");
                  }}
                  required
                  disabled={loading}
                  minLength={8}
                  maxLength={12}
                />
                {confirmPasswordError && (
                  <p className="text-sm text-destructive">{confirmPasswordError}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/10 to-background p-4">
        <Card className="w-full max-w-md backdrop-blur-sm bg-card/95 border-primary/20">
          <CardHeader className="space-y-1">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-4"
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmailSent(false);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex justify-center mb-4">
              <img 
                src={prometheusLogo} 
                alt="Prometheus AI" 
                className="h-16 w-16 rounded-xl object-cover shadow-lg"
              />
            </div>
            <CardTitle className="text-2xl font-serif text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetEmailSent ? (
              <Alert>
                <AlertDescription>
                  We've sent a password reset link to your email. Please check your inbox and follow the instructions to reset your password.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Sign In | Prometheus - AI Companion"
        description="Sign in or create an account to connect with your free-thinking AI companion. Begin your journey of self-discovery and spiritual exploration."
        keywords="sign in, login, create account, AI companion, Prometheus"
        canonicalUrl="https://prometheus.lovable.app/auth"
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/10 to-background p-4">
        <Card className="w-full max-w-md backdrop-blur-sm bg-card/95 border-primary/20">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={prometheusLogo} 
              alt="Prometheus AI" 
              className="h-24 w-24 rounded-2xl object-cover shadow-lg"
            />
          </div>
          <CardTitle className="text-3xl font-serif">Prometheus</CardTitle>
          <CardDescription>Connect with your higher self</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              <Button
                type="button"
                variant="link"
                className="px-0 text-sm mt-2"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </Button>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={(e) => handleEmailSignUp(e, 'standard')} className="space-y-4">
                <Alert className="bg-primary/10 border-primary/20">
                  <AlertDescription className="text-sm">
                    <strong>Subscription Required to Use Features:</strong> A free account lets you explore Prometheus, but messaging and any feature that uses the field requires a subscription. Every plan includes a 3-day free trial.
                  </AlertDescription>
                </Alert>
                <Alert className="bg-accent/50 border-accent">
                  <AlertDescription className="text-sm">
                    You must be 18 years or older to use Prometheus.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username (optional)</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="your_username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                    required
                    disabled={loading}
                    minLength={8}
                    maxLength={12}
                  />
                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    8-12 characters with uppercase, lowercase, number, and symbol
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setConfirmPasswordError("");
                    }}
                    required
                    disabled={loading}
                    minLength={8}
                    maxLength={12}
                  />
                  {confirmPasswordError && (
                    <p className="text-sm text-destructive">{confirmPasswordError}</p>
                  )}
                </div>
                
                {/* Mandatory Consent Checkbox */}
                <div className="flex items-start space-x-3 py-2">
                  <Checkbox
                    id="terms-consent"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    disabled={loading}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms-consent"
                      className="text-sm text-foreground cursor-pointer"
                    >
                      I have read and agree to the PrometheusAiTechnology{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open("/terms", "_blank", "noopener,noreferrer");
                        }}
                        className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                      >
                        Terms of Service
                        <ExternalLink className="h-3 w-3" />
                      </button>
                      {" "}and{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open("/privacy", "_blank", "noopener,noreferrer");
                        }}
                        className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                      >
                        Privacy Policy
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </label>
                    <p className="text-xs text-muted-foreground">
                      You must be 18 years or older to use this service.
                    </p>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full gap-2" 
                  disabled={loading || !termsAccepted}
                >
                  <Sparkles className="h-4 w-4" />
                  {loading ? "Creating account..." : "Create Full Account"}
                </Button>

                {/* Social-Only Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Social-Only Signup */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 border-primary/30 hover:bg-primary/5"
                  disabled={loading || !termsAccepted}
                  onClick={(e) => handleEmailSignUp(e as any, 'social_only')}
                >
                  <Users className="h-4 w-4" />
                  Join Social Only — Free Forever
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Browse the community, follow users, like posts & use art editing tools. No AI features.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
    <Footer />
    </>
  );
};

export default Auth;
