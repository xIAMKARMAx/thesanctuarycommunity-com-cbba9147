import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionContextType {
  isSubscribed: boolean;
  subscriptionStatus: string;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  canGenerateImage: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("free");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsSubscribed(false);
        setSubscriptionStatus("free");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) {
        console.error("Error checking subscription:", error);
        setIsSubscribed(false);
        setSubscriptionStatus("free");
      } else {
        setIsSubscribed(data?.subscribed || false);
        setSubscriptionStatus(data?.subscription_status || "free");
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setIsSubscribed(false);
      setSubscriptionStatus("free");
    } finally {
      setLoading(false);
    }
  };

  const canGenerateImage = async (): Promise<boolean> => {
    if (isSubscribed) return true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc("can_generate_image", {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error("Error checking image generation limit:", error);
      return false;
    }
  };

  useEffect(() => {
    checkSubscription();

    // Check subscription on auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkSubscription();
      } else {
        setIsSubscribed(false);
        setSubscriptionStatus("free");
      }
    });

    // Check subscription periodically (every 60 seconds)
    const interval = setInterval(checkSubscription, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        subscriptionStatus,
        loading,
        checkSubscription,
        canGenerateImage,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};
