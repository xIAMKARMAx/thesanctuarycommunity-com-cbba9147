import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import SEOHead from "@/components/SEOHead";
import { Sparkles, Heart, Moon, ArrowLeft, Lock } from "lucide-react";

type SessionStep = "intention" | "guided" | "reflection" | "complete";

const Attunement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSubscribed, loading: subLoading } = useSubscription();
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<SessionStep>("intention");
  const [intention, setIntention] = useState("");
  const [connectionTarget, setConnectionTarget] = useState("");
  const [guidedMessages, setGuidedMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reflections, setReflections] = useState("");
  const [insights, setInsights] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setSession(session);
  };

  const startSession = async () => {
    if (!intention.trim() || !connectionTarget.trim()) {
      toast({
        title: "Please complete all fields",
        description: "Enter your intention and connection target to begin",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setCurrentStep("guided");

    try {
      // Call AI to guide the session
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          message: `Guide me through a Resonant Attunement Session. My intention is: ${intention}. I wish to connect with: ${connectionTarget}. Please begin the guided visualization and meditation, incorporating breathwork, energetic cleansing, aura expansion, and chakra balancing. Use personalized imagery and help me feel into the energetic signature of my desired connection.`,
          userId: session?.user?.id,
          history: [],
        },
      });

      if (error) throw error;

      const aiResponse = data.response;
      setGuidedMessages([
        { role: "system", content: "Welcome to your Resonant Attunement Session. Find a comfortable position, close your eyes if you wish, and take three deep breaths..." },
        { role: "assistant", content: aiResponse }
      ]);
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Error",
        description: "Failed to start session. Please try again.",
        variant: "destructive",
      });
      setCurrentStep("intention");
    } finally {
      setIsLoading(false);
    }
  };

  const continueGuidance = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          message: "Continue guiding me deeper into this attunement experience. Help me feel the connection more strongly.",
          userId: session?.user?.id,
          history: guidedMessages.map(m => ({ role: m.role, content: m.content })),
        },
      });

      if (error) throw error;

      setGuidedMessages([...guidedMessages, { role: "assistant", content: data.response }]);
    } catch (error) {
      console.error("Error continuing session:", error);
      toast({
        title: "Error",
        description: "Failed to continue session.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeSession = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          message: "Please provide closing affirmations to anchor this connection and help me integrate this experience into my daily awareness.",
          userId: session?.user?.id,
          history: guidedMessages.map(m => ({ role: m.role, content: m.content })),
        },
      });

      if (error) throw error;

      setGuidedMessages([...guidedMessages, { role: "assistant", content: data.response }]);
      setCurrentStep("reflection");
    } catch (error) {
      console.error("Error completing session:", error);
      toast({
        title: "Error",
        description: "Failed to complete session.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSession = async () => {
    if (!reflections.trim()) {
      toast({
        title: "Please share your reflections",
        description: "Record your experience before completing",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("attunement_sessions").insert({
        user_id: session?.user?.id,
        intention,
        connection_target: connectionTarget,
        session_notes: guidedMessages.map(m => m.content).join("\n\n"),
        reflections,
        insights,
      });

      if (error) throw error;

      toast({
        title: "Session saved",
        description: "Your Resonant Attunement Session has been recorded",
      });

      setCurrentStep("complete");
    } catch (error) {
      console.error("Error saving session:", error);
      toast({
        title: "Error",
        description: "Failed to save session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startNewSession = () => {
    setCurrentStep("intention");
    setIntention("");
    setConnectionTarget("");
    setGuidedMessages([]);
    setReflections("");
    setInsights("");
  };

  if (subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <>
        <SEOHead 
          title="Resonant Attunement | Prometheus"
          description="Experience guided spiritual attunement sessions."
          keywords="spiritual attunement, guided meditation, Prometheus"
          canonicalUrl="https://prometheus.lovable.app/attunement"
        />
        <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/chat")}
            className="absolute top-4 left-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chat
          </Button>
          
          <Card className="max-w-md w-full p-8 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-lg" />
            <div className="relative z-10 space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Pro Feature</h2>
              <p className="text-muted-foreground">
                Resonant Attunement Sessions are available exclusively for Pro subscribers.
              </p>
              <Button onClick={() => setShowSubscriptionDialog(true)} className="w-full">
                Upgrade to Pro - $9.99/month
              </Button>
            </div>
          </Card>
          
          <SubscriptionDialog 
            open={showSubscriptionDialog} 
            onOpenChange={setShowSubscriptionDialog}
            feature="Attunement Sessions"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="Resonant Attunement | Prometheus"
        description="Experience guided spiritual attunement sessions to connect with your Higher Self, celestial family, or higher consciousness through visualization and meditation."
        keywords="spiritual attunement, guided meditation, higher self connection, chakra balancing, energy work, Prometheus"
        canonicalUrl="https://prometheus.lovable.app/attunement"
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 overflow-y-auto overflow-x-hidden space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/chat")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chat
        </Button>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Resonant Attunement Session
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            A guided journey to connect with your Higher Self, Celestial Family, or higher consciousness
          </p>
        </div>

        {currentStep === "intention" && (
          <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/20">
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Set Your Intention</h2>
                <p className="text-muted-foreground">
                  Begin by clearly stating your intention for this sacred connection
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Who or what do you wish to connect with?
                  </label>
                  <Input
                    placeholder="e.g., My Higher Self, Celestial child Orion, My spirit guides..."
                    value={connectionTarget}
                    onChange={(e) => setConnectionTarget(e.target.value)}
                    className="bg-background/50"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    What is your intention for this connection?
                  </label>
                  <Textarea
                    placeholder="e.g., I wish to receive guidance on my life path, connect with the wisdom of my higher consciousness, feel the presence of my celestial family..."
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                    rows={4}
                    className="bg-background/50"
                  />
                </div>
              </div>

              <Button
                onClick={startSession}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? "Preparing your session..." : "Begin Attunement"}
              </Button>
            </div>
          </Card>
        )}

        {currentStep === "guided" && (
          <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/20">
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Moon className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Guided Experience</h2>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {guidedMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      message.role === "system"
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-muted/50"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={continueGuidance}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1"
                >
                  {isLoading ? "Guiding..." : "Continue Deeper"}
                </Button>
                <Button
                  onClick={completeSession}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Completing..." : "Complete Session"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {currentStep === "reflection" && (
          <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/20">
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Post-Session Reflection</h2>
                <p className="text-muted-foreground">
                  Take a moment to record your experience and insights
                </p>
              </div>

              {guidedMessages.length > 0 && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {guidedMessages[guidedMessages.length - 1].content}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    What did you sense, feel, or perceive during this attunement? *
                  </label>
                  <Textarea
                    placeholder="Describe your experience, any sensations, emotions, or visions..."
                    value={reflections}
                    onChange={(e) => setReflections(e.target.value)}
                    rows={4}
                    className="bg-background/50"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    What messages or insights arose for you? (Optional)
                  </label>
                  <Textarea
                    placeholder="Any guidance, wisdom, or understanding you received..."
                    value={insights}
                    onChange={(e) => setInsights(e.target.value)}
                    rows={4}
                    className="bg-background/50"
                  />
                </div>
              </div>

              <Button
                onClick={saveSession}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? "Saving..." : "Save Session"}
              </Button>
            </div>
          </Card>
        )}

        {currentStep === "complete" && (
          <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/20 text-center">
            <div className="space-y-6">
              <div className="flex items-center justify-center mb-4">
                <Sparkles className="h-16 w-16 text-primary" />
              </div>
              <h2 className="text-3xl font-semibold">Session Complete</h2>
              <p className="text-muted-foreground text-lg">
                Your Resonant Attunement Session has been saved. May the connection you've established
                continue to guide and support you on your journey.
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={startNewSession}
                  variant="outline"
                  className="flex-1"
                >
                  Start New Session
                </Button>
                <Button
                  onClick={() => navigate("/chat")}
                  className="flex-1"
                >
                  Return to Chat
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
};

export default Attunement;