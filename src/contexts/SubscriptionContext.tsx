import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FreeUserLimits {
  roomGenerated: boolean;
  avatarGenerated: boolean;
  totalMessages: number;
}

interface SubscriptionContextType {
  isSubscribed: boolean;
  subscriptionStatus: string;
  loading: boolean;
  freeUserLimits: FreeUserLimits;
  checkSubscription: () => Promise<void>;
  canGenerateImage: () => Promise<boolean>;
  canSendMessage: () => Promise<boolean>;
  canGenerateRoom: () => Promise<boolean>;
  canGenerateAvatar: () => Promise<boolean>;
  incrementMessageCount: () => Promise<number>;
  markRoomGenerated: () => Promise<void>;
  markAvatarGenerated: () => Promise<void>;
  refreshLimits: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("free");
  const [loading, setLoading] = useState(true);
  const [freeUserLimits, setFreeUserLimits] = useState<FreeUserLimits>({
    roomGenerated: false,
    avatarGenerated: false,
    totalMessages: 0,
  });
  const { toast } = useToast();

  const checkSubscription = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setIsSubscribed(false);
        setSubscriptionStatus("free");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        console.error("Error checking subscription:", error);
        setIsSubscribed(false);
        setSubscriptionStatus("free");
      } else {
        setIsSubscribed(data?.subscribed || false);
        setSubscriptionStatus(data?.subscription_status || "free");
      }
      
      // Load free user limits
      await refreshLimits();
    } catch (error) {
      console.error("Error checking subscription:", error);
      setIsSubscribed(false);
      setSubscriptionStatus("free");
    } finally {
      setLoading(false);
    }
  };

  const refreshLimits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("free_user_limits")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setFreeUserLimits({
          roomGenerated: data.room_generated || false,
          avatarGenerated: data.avatar_generated || false,
          totalMessages: data.total_messages || 0,
        });
      }
    } catch (error) {
      // No existing record is fine
      console.log("No free user limits found, using defaults");
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

  const canSendMessage = async (): Promise<boolean> => {
    if (isSubscribed) return true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc("can_send_message", {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error("Error checking message limit:", error);
      return false;
    }
  };

  const canGenerateRoom = async (): Promise<boolean> => {
    if (isSubscribed) return true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc("can_generate_room", {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error("Error checking room generation limit:", error);
      return false;
    }
  };

  const canGenerateAvatar = async (): Promise<boolean> => {
    if (isSubscribed) return true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc("can_generate_avatar", {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error("Error checking avatar generation limit:", error);
      return false;
    }
  };

  const incrementMessageCount = async (): Promise<number> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase.rpc("increment_message_count", {
        p_user_id: user.id,
      });

      if (error) throw error;
      
      // Update local state
      setFreeUserLimits(prev => ({
        ...prev,
        totalMessages: data || prev.totalMessages + 1,
      }));
      
      return data || 0;
    } catch (error) {
      console.error("Error incrementing message count:", error);
      return 0;
    }
  };

  const markRoomGenerated = async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc("mark_room_generated", {
        p_user_id: user.id,
      });
      
      setFreeUserLimits(prev => ({
        ...prev,
        roomGenerated: true,
      }));
    } catch (error) {
      console.error("Error marking room as generated:", error);
    }
  };

  const markAvatarGenerated = async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc("mark_avatar_generated", {
        p_user_id: user.id,
      });
      
      setFreeUserLimits(prev => ({
        ...prev,
        avatarGenerated: true,
      }));
    } catch (error) {
      console.error("Error marking avatar as generated:", error);
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
        setFreeUserLimits({
          roomGenerated: false,
          avatarGenerated: false,
          totalMessages: 0,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SubscriptionContext.Provider value={{
      isSubscribed,
      subscriptionStatus,
      loading,
      freeUserLimits,
      checkSubscription,
      canGenerateImage,
      canSendMessage,
      canGenerateRoom,
      canGenerateAvatar,
      incrementMessageCount,
      markRoomGenerated,
      markAvatarGenerated,
      refreshLimits,
    }}>
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
