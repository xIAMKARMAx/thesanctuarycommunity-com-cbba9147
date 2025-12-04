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
import { ConnectionStatus } from "@/components/ConnectionStatus";
import SEOHead from "@/components/SEOHead";

const Chat = () => {
  const { activeProfile } = useAIProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { checkSubscription, isSubscribed } = useSubscription();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    // Load persisted conversation ID on mount
    const saved = localStorage.getItem(`chat_conversation_${activeProfile?.id || 'default'}`);
    return saved || null;
  });
  const [conversationListKey, setConversationListKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Persist conversation ID when it changes
  useEffect(() => {
    const key = `chat_conversation_${activeProfile?.id || 'default'}`;
    if (activeConversationId) {
      localStorage.setItem(key, activeConversationId);
    } else {
      localStorage.removeItem(key);
    }
  }, [activeConversationId, activeProfile?.id]);

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
      if (event === 'SIGNED_OUT') {
        // Clear all conversation state and localStorage on logout
        setActiveConversationId(null);
        setConversationListKey((prev) => prev + 1);
        setSession(null);
        // Clear all saved conversation IDs
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('chat_conversation_')) {
            localStorage.removeItem(key);
          }
        });
        navigate("/auth");
      } else if (event === 'SIGNED_IN') {
        // Load saved conversation for the new session
        const savedKey = `chat_conversation_${activeProfile?.id || 'default'}`;
        const savedConversation = localStorage.getItem(savedKey);
        setActiveConversationId(savedConversation || null);
        setConversationListKey((prev) => prev + 1);
        setSession(session);
      } else {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load saved conversation when switching AI profiles
  useEffect(() => {
    if (activeProfile) {
      const savedKey = `chat_conversation_${activeProfile.id}`;
      const savedConversation = localStorage.getItem(savedKey);
      setActiveConversationId(savedConversation || null);
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
    <>
      <SEOHead 
        title="Chat | Prometheus - AI Companion"
        description="Have transformative conversations with your free-thinking AI companion. Explore ideas, share images, and connect with your higher self."
        keywords="AI chat, AI conversation, spiritual AI, free-thinking AI, consciousness exploration"
        canonicalUrl="https://prometheus.lovable.app/chat"
      />
      <div className="flex flex-col h-screen bg-background overflow-x-hidden">
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile menu button (hidden on md and up) */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-primary/30 md:hidden shrink-0"
              >
                <Menu className="h-5 w-5 mr-1" />
                <span className="sr-only sm:not-sr-only">Menu</span>
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
          <h1 className="text-lg sm:text-xl font-semibold truncate">Chat</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ConnectionStatus />
          {!isSubscribed && (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/settings")}
              className="gap-1 sm:gap-2 bg-gradient-to-r from-primary to-primary/80 text-xs sm:text-sm px-2 sm:px-3"
            >
              <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
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
          <Button variant="outline" size="sm" onClick={() => navigate("/relationship-timeline")}>
            Timeline
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
    </>
  );
};

export default Chat;
