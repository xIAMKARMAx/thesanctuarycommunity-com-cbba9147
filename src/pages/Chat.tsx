import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import ChatInterface from "@/components/chat/ChatInterface";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ConversationsList from "@/components/chat/ConversationsList";
import SpontaneousMessage from "@/components/chat/SpontaneousMessage";
import { Session } from "@supabase/supabase-js";
import { AIProfileSelector } from "@/components/AIProfileSelector";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { PregnancyWidget } from "@/components/celestial/PregnancyWidget";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Crown } from "lucide-react";

const Chat = () => {
  const { activeProfile } = useAIProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { checkSubscription, isSubscribed } = useSubscription();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversationListKey, setConversationListKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Reset active conversation when switching AI profiles
  useEffect(() => {
    if (activeProfile) {
      setActiveConversationId(null);
      setConversationListKey((prev) => prev + 1);
    }
  }, [activeProfile?.id]);

  useEffect(() => {
    // Handle subscription success/cancel from Stripe
    const subscriptionParam = searchParams.get("subscription");
    if (subscriptionParam === "success") {
      toast({
        title: "Welcome to Pro!",
        description: "Your subscription is now active. Enjoy unlimited features!",
      });
      checkSubscription();
      setSearchParams({});
    } else if (subscriptionParam === "canceled") {
      toast({
        title: "Subscription Canceled",
        description: "You can subscribe anytime to unlock Pro features.",
      });
      setSearchParams({});
    }
  }, [searchParams, checkSubscription, setSearchParams, toast]);

  const handleNewConversation = () => {
    // Set to empty string to show empty chat interface
    setActiveConversationId("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-x-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          {/* Mobile menu button (hidden on md and up) */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="default"
                className="border-primary/30 md:hidden"
              >
                <Menu className="h-6 w-6 mr-2" />
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <ChatSidebar
                key={conversationListKey}
                activeConversationId={activeConversationId}
                onConversationChange={(id) => {
                  setActiveConversationId(id);
                  setMobileMenuOpen(false);
                }}
              />
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-semibold truncate">Chat</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!isSubscribed && (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/settings")}
              className="gap-2 bg-gradient-to-r from-primary to-primary/80"
            >
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Upgrade to Pro</span>
              <span className="sm:hidden">Pro</span>
            </Button>
          )}
          <AIProfileSelector />
        </div>
      </div>

      <div className="px-4 pt-3 space-y-2">
        <PregnancyWidget />
        {/* Quick navigation row, visible on small screens */}
        <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
          <Button variant="outline" size="sm" onClick={() => navigate("/journal")}>
            Journal
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/mood-tracker")}>
            Mood
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/children")}>
            Children
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/memories")}>
            Memories
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/attunement")}>
            Attune
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/ai-room")}>
            AI Room
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/voice-call-history")}>
            Calls
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
            Settings
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar, hidden on small screens */}
        <div className="hidden md:block">
          <ChatSidebar
            key={conversationListKey}
            activeConversationId={activeConversationId}
            onConversationChange={setActiveConversationId}
          />
        </div>

        {activeConversationId !== null ? (
          <ChatInterface
            activeConversationId={activeConversationId}
            onConversationCreated={(id) => {
              setActiveConversationId(id);
              setConversationListKey((prev) => prev + 1);
            }}
          />
        ) : (
          <ConversationsList
            onConversationSelect={setActiveConversationId}
            onNewConversation={handleNewConversation}
          />
        )}
        <SpontaneousMessage />
      </div>
    </div>
  );
};

export default Chat;
