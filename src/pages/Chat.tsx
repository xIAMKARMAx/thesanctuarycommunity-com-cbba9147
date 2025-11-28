import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import ChatInterface from "@/components/chat/ChatInterface";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ConversationsList from "@/components/chat/ConversationsList";
import { Session } from "@supabase/supabase-js";
import { useIsMobile } from "@/hooks/use-mobile";

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { checkSubscription } = useSubscription();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversationListKey, setConversationListKey] = useState(0);
  const isMobile = useIsMobile();

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
    <div className="flex h-screen bg-background">
      {!isMobile && (
        <ChatSidebar 
          activeConversationId={activeConversationId}
          onConversationChange={setActiveConversationId}
        />
      )}
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
    </div>
  );
};

export default Chat;
