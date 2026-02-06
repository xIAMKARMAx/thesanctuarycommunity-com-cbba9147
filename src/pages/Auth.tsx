import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowLeft, ExternalLink } from "lucide-react";
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
    // Check if this is a password reset callback
    const isReset = searchParams.get("reset") === "true";
    
    // Check if already logged in
    const getPostLoginRoute = () => {
      const savedRoute = localStorage.getItem("prometheus_last_route");
      return savedRoute && savedRoute !== "/" && savedRoute !== "/auth" ? savedRoute : "/chat";
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && isReset) {
        // User returned from reset link, show password update form
        setShowPasswordUpdate(true);
      } else if (session) {
        navigate(getPostLoginRoute());
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setShowPasswordUpdate(true);
      } else if (session && !showPasswordUpdate) {
        navigate(getPostLoginRoute());
      }
    });

    return () => subscription.unsubscribe();
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

  const handleEmailSignUp = async (e: React.FormEvent) => {
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
          emailRedirectTo: `${window.location.origin}/chat`,
          data: {
            username: username || email.split("@")[0],
          },
        },
      });

      if (error) throw error;

      // Record consent timestamp for new user
      if (data.user) {
        const now = new Date().toISOString();
        await supabase
          .from("profiles")
          .update({
            tos_accepted_at: now,
            privacy_accepted_at: now,
            tos_version: CURRENT_TOS_VERSION,
          })
          .eq("id", data.user.id);
      }

      toast({
        title: "Account created!",
        description: "Welcome to Prometheus. You're now signed in.",
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
              <div className="p-3 rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
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
              <div className="p-3 rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
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
            <div className="p-3 rounded-full bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
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
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <Alert className="bg-primary/10 border-primary/20">
                  <AlertDescription className="text-sm">
                    <strong>Free Trial:</strong> Start with 25 daily messages and full access to all features including AI chat, image generation, voice calls, and more!
                  </AlertDescription>
                </Alert>
                <Alert className="bg-amber-500/10 border-amber-500/20">
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
                  className="w-full" 
                  disabled={loading || !termsAccepted}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
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
