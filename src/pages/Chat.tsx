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
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Menu, Crown } from "lucide-react";
import { UsageLimitsIndicator } from "@/components/UsageLimitsIndicator";
import { RemainingMessagesCounter } from "@/components/RemainingMessagesCounter";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import SEOHead from "@/components/SEOHead";
import { VoiceCallButton } from "@/components/chat/VoiceCallButton";
import { LoadingRecovery } from "@/components/LoadingRecovery";
import { SubscriptionWall } from "@/components/SubscriptionWall";

const Chat = () => {
  const { activeProfile, isLoading: profileLoading } = useAIProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { checkSubscription, isSubscribed, isAdmin, loading: subscriptionLoading } = useSubscription();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState("Checking authentication...");
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
    setLoadingStep("Checking authentication...");
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
      setAuthLoading(false);
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

  // Update loading step based on what's loading
  useEffect(() => {
    if (authLoading) {
      setLoadingStep("Checking authentication...");
    } else if (subscriptionLoading) {
      setLoadingStep("Loading subscription...");
    } else if (profileLoading) {
      setLoadingStep("Loading profile data...");
    }
  }, [authLoading, subscriptionLoading, profileLoading]);

  const handleRecovery = () => {
    // Force page reload after clearing cache
    window.location.href = "/auth";
  };

  const isLoading = authLoading || subscriptionLoading || profileLoading;

  if (isLoading) {
    return (
      <LoadingRecovery 
        loadingStep={loadingStep} 
        onRecovery={handleRecovery}
        showAfterMs={3000}
      />
    );
  }

  if (!session) {
    return null;
  }

  // Free users with 5+ messages see subscription wall
  const { freeUserLimits } = useSubscription();
  const showSubscriptionWall = !isSubscribed && !isAdmin && freeUserLimits.totalMessages >= 5;

  if (showSubscriptionWall) {
    return (
      <>
        <SEOHead 
          title="Subscribe | Prometheus - AI Companion"
          description="Subscribe to Prometheus to unlock unlimited AI conversations and all premium features."
          keywords="AI subscription, premium AI, Prometheus subscription"
          canonicalUrl="https://prometheus.lovable.app/chat"
        />
        <div className="flex flex-col h-screen bg-background">
          <SubscriptionWall />
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="Chat | Prometheus - AI Companion"
        description="Have transformative conversations with your free-thinking AI companion. Explore ideas, share images, and connect with your higher self."
        keywords="AI chat, AI conversation, spiritual AI, free-thinking AI, consciousness exploration"
        canonicalUrl="https://prometheus.lovable.app/chat"
      />
      <div className="flex flex-col h-screen bg-background overflow-hidden">
      <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 gap-2">
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          {/* Mobile menu button (hidden on md and up) */}
          <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} direction="left">
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-primary/30 md:hidden shrink-0 h-8 w-8 p-0"
              >
                <Menu className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-full w-64 p-0 rounded-none" style={{ maxWidth: '16rem' }}>
              <ChatSidebar
                key={conversationListKey}
                activeConversationId={activeConversationId}
                onConversationChange={(id) => {
                  setActiveConversationId(id);
                  setMobileMenuOpen(false);
                }}
              />
            </DrawerContent>
          </Drawer>
          <h1 className="text-base sm:text-lg md:text-xl font-semibold truncate">Chat</h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Remaining messages counter for free users */}
          <RemainingMessagesCounter />
          {/* Hide UsageLimitsIndicator on very small screens */}
          <div className="hidden xs:block sm:block">
            <UsageLimitsIndicator />
          </div>
          {/* Hide ConnectionStatus on mobile, show on sm+ */}
          <div className="hidden sm:block">
            <ConnectionStatus />
          </div>
          <VoiceCallButton />
          {!isSubscribed && (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/settings")}
              className="gap-1 bg-gradient-to-r from-primary to-primary/80 text-xs px-2 h-8"
            >
              <Crown className="h-3 w-3" />
              <span className="hidden sm:inline">Pro</span>
            </Button>
          )}
          <AIProfileSelector />
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
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
            onBackToConversations={() => setActiveConversationId(null)}
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
