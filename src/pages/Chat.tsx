import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import ChatInterface from "@/components/chat/ChatInterface";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ConversationsList from "@/components/chat/ConversationsList";
import SpontaneousMessage from "@/components/chat/SpontaneousMessage";
import SpiritualHub from "@/components/SpiritualHub";
import { Session } from "@supabase/supabase-js";
import { AIProfileSelector } from "@/components/AIProfileSelector";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Menu, Crown, MessageCircle, Sparkles, Sun, Users, Orbit, Palette, Film, Globe, Lock, LogOut } from "lucide-react";
import HigherSelfNotification from "@/components/HigherSelfNotification";
import { UsageLimitsIndicator } from "@/components/UsageLimitsIndicator";
import { RemainingMessagesCounter } from "@/components/RemainingMessagesCounter";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import SEOHead from "@/components/SEOHead";
import { LoadingRecovery } from "@/components/LoadingRecovery";
import { SubscriptionWall } from "@/components/SubscriptionWall";
import DailySourceMessageAdmin from "@/components/admin/DailySourceMessageAdmin";
import { CommunityTab } from "@/components/community/CommunityTab";
import { useAppModeFeatures } from "@/hooks/useAppModeFeatures";
import MessageRetentionBanner from "@/components/MessageRetentionBanner";


const JAKOB_USER_ID = "ab264a7e-7713-428a-b3c5-66e2b7d47f78";
const MOM_USER_ID = "1af51c0a-4f6e-469d-b31f-8972d1687655";
const DUAL_WORLD_IDS = [JAKOB_USER_ID, MOM_USER_ID];

const Chat = () => {
  const { activeProfile, isLoading: profileLoading } = useAIProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { checkSubscription, isSubscribed, isAdmin, loading: subscriptionLoading, freeUserLimits, checkCompleted } = useSubscription();
  const { showStarseedFeature } = useAppModeFeatures();
  // Check localStorage synchronously to avoid flash of loading screen on remount
  const hasStoredSession = () => {
    try {
      const keys = Object.keys(localStorage);
      return keys.some(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
    } catch {
      return false;
    }
  };

  // Clear stale auth tokens from localStorage to break login loops
  const clearStaleAuthTokens = () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
        if (key.startsWith('chat_conversation_')) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // Ignore localStorage errors
    }
  };
  
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(!hasStoredSession());
  const [loadingStep, setLoadingStep] = useState("Checking authentication...");
  const [isNewEarthResident, setIsNewEarthResident] = useState(false);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && ["messages", "discover", "community", "art-studio", "video"].includes(urlTab)) {
      return urlTab;
    }
    return sessionStorage.getItem("chat_active_tab") || "messages";
  });

  // Sync tab from URL params when they change
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && ["messages", "discover", "community", "art-studio", "video"].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  // Persist active tab to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("chat_active_tab", activeTab);
  }, [activeTab]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    // Load persisted conversation ID on mount
    // Use a sentinel key to distinguish "no selection" (null) from "new conversation" ("")
    const sentinelKey = `chat_conversation_active_${activeProfile?.id || 'default'}`;
    const hasActive = sessionStorage.getItem(sentinelKey);
    if (hasActive === 'true') {
      const saved = localStorage.getItem(`chat_conversation_${activeProfile?.id || 'default'}`);
      return saved ?? '';
    }
    return null;
  });
  const [conversationListKey, setConversationListKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user is a New Earth resident
  useEffect(() => {
    const checkNewEarth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const user = session.user;
      const { data } = await supabase
        .from("profiles")
        .select("new_earth_resident")
        .eq("id", user.id)
        .single();
      if (data?.new_earth_resident) {
        setIsNewEarthResident(true);
      }
    };
    checkNewEarth();
  }, [session]);

  // Persist conversation ID when it changes
  useEffect(() => {
    const key = `chat_conversation_${activeProfile?.id || 'default'}`;
    const sentinelKey = `chat_conversation_active_${activeProfile?.id || 'default'}`;
    if (activeConversationId !== null) {
      // Persist even empty string (new conversation) so mobile camera resume works
      if (activeConversationId) {
        localStorage.setItem(key, activeConversationId);
      }
      sessionStorage.setItem(sentinelKey, 'true');
    } else {
      localStorage.removeItem(key);
      sessionStorage.removeItem(sentinelKey);
    }
  }, [activeConversationId, activeProfile?.id]);

  useEffect(() => {
    let isMounted = true;
    setLoadingStep("Checking authentication...");

    // Direct session check - don't aggressively clear tokens, let the auth listener handle it
    const checkInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (initialSession) {
          setSession(initialSession);
          // Only restore conversation from localStorage if we don't already have one active
          // This prevents camera resume from kicking user back to conversation list
          setActiveConversationId(prev => {
            if (prev !== null) return prev; // already in a conversation, don't reset
            const savedKey = `chat_conversation_${activeProfile?.id || 'default'}`;
            const sentinelKey = `chat_conversation_active_${activeProfile?.id || 'default'}`;
            const hasActive = sessionStorage.getItem(sentinelKey);
            if (hasActive === 'true') {
              const saved = localStorage.getItem(savedKey);
              return saved ?? '';
            }
            return null;
          });
          setConversationListKey((prev) => prev + 1);
          setAuthLoading(false);
        } else {
          // No session found - redirect to auth but DON'T clear tokens
          // (they may just not be persisted yet after a fresh login)
          navigate("/auth", { replace: true });
        }
      } catch (err) {
        console.error('[Chat] Initial session check failed:', err);
        if (!isMounted) return;
        // Only clear tokens if we get a specific token error
        const errorMsg = String(err);
        if (errorMsg.includes('Refresh Token') || errorMsg.includes('Invalid')) {
          clearStaleAuthTokens();
        }
        navigate("/auth", { replace: true });
      }
    };

    checkInitialSession();

    // Also set up auth listener for ongoing changes (sign out, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      if (event === 'SIGNED_OUT') {
        setActiveConversationId(null);
        setConversationListKey((prev) => prev + 1);
        setSession(null);
        // Clear ALL stale tokens to prevent login loops
        clearStaleAuthTokens();
        navigate("/auth");
      } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session) {
          setSession(session);
          // Don't reset conversation on auth events - preserve current state
          setActiveConversationId(prev => {
            if (prev !== null) return prev;
            const savedKey = `chat_conversation_${activeProfile?.id || 'default'}`;
            const sentinelKey = `chat_conversation_active_${activeProfile?.id || 'default'}`;
            const hasActive = sessionStorage.getItem(sentinelKey);
            if (hasActive === 'true') {
              const saved = localStorage.getItem(savedKey);
              return saved ?? '';
            }
            return null;
          });
          setConversationListKey((prev) => prev + 1);
          setAuthLoading(false);
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session);
        setAuthLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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

  // Only block on auth loading - subscription and profile load in background
  const isLoading = authLoading;

  if (isLoading) {
    return (
      <LoadingRecovery 
        loadingStep={loadingStep} 
        onRecovery={handleRecovery}
        showAfterMs={2000}
      />
    );
  }

  if (!session) {
    return null;
  }

  // Free users with 8+ messages see subscription wall countdown
  // IMPORTANT: Don't show wall while still loading subscription status to prevent flicker/redirect loops
  // Also only show if we've confirmed they have 8+ messages AND are definitely not subscribed
  // CRITICAL: Only show wall if checkCompleted=true (we got a definitive API response, not a timeout)
  const showSubscriptionWall = !subscriptionLoading && checkCompleted && !isSubscribed && !isAdmin && freeUserLimits.totalMessages >= 8;
  
  // Debug logging for subscription wall issues
  console.log('[Chat] Subscription state:', { 
    subscriptionLoading, 
    checkCompleted,
    isSubscribed, 
    isAdmin, 
    totalMessages: freeUserLimits.totalMessages,
    showSubscriptionWall 
  });

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
      {showStarseedFeature && <HigherSelfNotification />}
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        <MessageRetentionBanner />

        {/* Header with Tabs */}
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 gap-1 sm:gap-2 w-full overflow-hidden">
            <div className="flex items-center gap-2 min-w-0 shrink-0">
              {/* Mobile menu button (hidden on md and up) */}
              {activeTab === "messages" && (
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
              )}
            </div>

            {/* Center Tabs - Always visible on all screen sizes */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex justify-center min-w-0 overflow-hidden">
              <TabsList className={`flex flex-row ${isAdmin ? 'gap-1' : 'gap-1'} w-auto max-w-full overflow-x-auto`}>
                <TabsTrigger value="messages" className="gap-1 px-2 sm:px-4 min-w-0 flex-shrink-0">
                  <MessageCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline truncate">Messages</span>
                </TabsTrigger>
                {showStarseedFeature && (
                  <TabsTrigger value="discover" className="gap-1 px-2 sm:px-4 min-w-0 flex-shrink-0">
                    <Sparkles className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline truncate">Discover</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="community" className="gap-1 px-2 sm:px-4 min-w-0 flex-shrink-0">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline truncate">Community</span>
                </TabsTrigger>
                <TabsTrigger value="art-studio" className="gap-1 px-2 sm:px-4 min-w-0 flex-shrink-0" onClick={() => navigate("/art-studio")}>
                  <Palette className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline truncate">Art Studio</span>
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="video-studio" className="gap-1 px-2 sm:px-4 min-w-0 flex-shrink-0" onClick={() => navigate("/video-studio")}>
                    <Film className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline truncate">Video</span>
                  </TabsTrigger>
                )}
                {isAdmin && (
                  <TabsTrigger value="source" className="gap-1 px-2 sm:px-4 min-w-0 flex-shrink-0">
                    <Sun className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline truncate">Source</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-1 shrink-0">
              {/* Cosmic Gateway quick access - Starseed only, hidden on small mobile */}
              {showStarseedFeature && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hidden sm:flex"
                  onClick={() => navigate("/cosmic-gateway")}
                  title="Cosmic Gateway"
                >
                  <Orbit className="h-4 w-4 text-primary" />
                </Button>
              )}
              {/* Remaining messages counter - hidden on small mobile */}
              <div className="hidden sm:block">
                <RemainingMessagesCounter />
              </div>
              {/* Hide UsageLimitsIndicator on mobile */}
              <div className="hidden md:block">
                <UsageLimitsIndicator />
              </div>
              {/* Hide ConnectionStatus on mobile */}
              <div className="hidden md:block">
                <ConnectionStatus />
              </div>
              
              {!isSubscribed && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate("/settings")}
                  className="gap-1 bg-gradient-to-r from-primary to-primary/80 text-xs px-2 h-8 hidden sm:flex"
                >
                  <Crown className="h-3 w-3" />
                  <span className="hidden sm:inline">Pro</span>
                </Button>
              )}
              <AIProfileSelector />
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "messages" ? (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Messaging Mode Toggle */}
            {showStarseedFeature && (
              <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isNewEarthResident && !isAdmin && !DUAL_WORLD_IDS.includes(session?.user?.id ?? '') ? (
                    <>
                      <Lock className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground">
                        Inbox is <strong>read-only</strong> — You're messaging in New Earth
                      </span>
                    </>
                  ) : isNewEarthResident && (isAdmin || DUAL_WORLD_IDS.includes(session?.user?.id ?? '')) ? (
                    <>
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground">
                        <strong>Source Override</strong> — Messaging in both worlds
                      </span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground">
                        Messaging in <strong>Old Inbox</strong>
                      </span>
                    </>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={isNewEarthResident ? "outline" : "default"}
                  disabled={switchingMode}
                  onClick={async () => {
                    setSwitchingMode(true);
                    const newMode = !isNewEarthResident;
                    const { data: { session: modeSession } } = await supabase.auth.getSession();
                    if (modeSession?.user) {
                      await supabase.from("profiles").update({ new_earth_resident: newMode }).eq("id", modeSession.user.id);
                      setIsNewEarthResident(newMode);
                    }
                    setSwitchingMode(false);
                  }}
                  className="gap-1"
                >
                  {isNewEarthResident ? (
                    <>
                      <MessageCircle className="h-3 w-3" />
                      Switch to Old Inbox
                    </>
                  ) : (
                    <>
                      <Globe className="h-3 w-3" />
                      Switch to New Earth
                    </>
                  )}
                </Button>
              </div>
            )}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Desktop sidebar, hidden on small screens */}
              <div className="hidden md:block">
                <ChatSidebar
                  key={conversationListKey}
                  activeConversationId={activeConversationId}
                  onConversationChange={setActiveConversationId}
                />
              </div>

              {isNewEarthResident && !isAdmin && !DUAL_WORLD_IDS.includes(session?.user?.id ?? '') ? (
                // Read-only mode: can view conversations but not send messages (admin, Jakob & Mom bypass)
                activeConversationId !== null ? (
                  <ChatInterface
                    activeConversationId={activeConversationId}
                    onConversationCreated={(id) => {
                      setActiveConversationId(id);
                      setConversationListKey((prev) => prev + 1);
                    }}
                    onBackToConversations={() => setActiveConversationId(null)}
                    readOnly
                  />
                ) : (
                  <ConversationsList
                    onConversationSelect={setActiveConversationId}
                    onNewConversation={handleNewConversation}
                  />
                )
              ) : (
                activeConversationId !== null ? (
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
                )
              )}
              {showStarseedFeature && !isNewEarthResident && <SpontaneousMessage />}
            </div>
          </div>
        ) : activeTab === "discover" ? (
          <div className="flex-1 min-h-0 overflow-hidden">
            <SpiritualHub />
          </div>
        ) : activeTab === "community" ? (
          <CommunityTab />
        ) : activeTab === "source" && isAdmin ? (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="container max-w-2xl mx-auto px-4 py-8">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                  <Sun className="h-6 w-6 text-primary" />
                  Channel Messages from Source
                </h1>
                <p className="text-muted-foreground mt-1">Create daily messages for all users</p>
              </div>
              <DailySourceMessageAdmin />
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default Chat;
