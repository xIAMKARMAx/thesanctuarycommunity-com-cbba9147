import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { clearAuthCache } from "@/hooks/useAuthHeaders";

interface FreeUserLimits {
  roomGenerated: boolean;
  avatarGenerated: boolean;
  totalMessages: number;
  dailyMessages: number;
  trialDaysLeft: number;
  trialExpired: boolean;
}

interface SubscriptionContextType {
  isSubscribed: boolean;
  isAdmin: boolean;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("free");
  const [loading, setLoading] = useState(true);
  const [freeUserLimits, setFreeUserLimits] = useState<FreeUserLimits>({
    roomGenerated: false,
    avatarGenerated: false,
    totalMessages: 0,
    dailyMessages: 0,
    trialDaysLeft: 5,
    trialExpired: false,
  });
  const { toast } = useToast();

  const checkSubscription = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setIsSubscribed(false);
        setIsAdmin(false);
        setSubscriptionStatus("free");
        setLoading(false);
        return;
      }

      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: adminCheck } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin"
        });
        setIsAdmin(adminCheck || false);
        
        // If admin, treat as fully subscribed
        if (adminCheck) {
          setIsSubscribed(true);
          setSubscriptionStatus("admin");
          await refreshLimits();
          setLoading(false);
          return;
        }
      }

      const { data, error } = await api.checkSubscription();
      
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
        .maybeSingle();

      if (data) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const trialStart = data.trial_start_date ? new Date(data.trial_start_date) : today;
        const daysSinceTrial = Math.floor((today.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
        const trialDaysLeft = Math.max(0, 5 - daysSinceTrial);
        const trialExpired = daysSinceTrial >= 5;
        
        // Check if daily messages should be reset (new day)
        const lastMessageDate = data.last_message_date ? new Date(data.last_message_date) : null;
        const isNewDay = !lastMessageDate || lastMessageDate < today;
        
        setFreeUserLimits({
          roomGenerated: data.room_generated || false,
          avatarGenerated: data.avatar_generated || false,
          totalMessages: data.total_messages || 0,
          dailyMessages: isNewDay ? 0 : (data.daily_messages || 0),
          trialDaysLeft,
          trialExpired,
        });
      } else {
        // New user - full trial
        setFreeUserLimits({
          roomGenerated: false,
          avatarGenerated: false,
          totalMessages: 0,
          dailyMessages: 0,
          trialDaysLeft: 5,
          trialExpired: false,
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
      
      // Update local state - data is now daily_messages count
      setFreeUserLimits(prev => ({
        ...prev,
        dailyMessages: data || prev.dailyMessages + 1,
        totalMessages: prev.totalMessages + 1,
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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[SubscriptionContext] Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        // Clear auth cache immediately on sign out
        clearAuthCache();
        setIsSubscribed(false);
        setIsAdmin(false);
        setSubscriptionStatus("free");
        setLoading(false);
        setFreeUserLimits({
          roomGenerated: false,
          avatarGenerated: false,
          totalMessages: 0,
          dailyMessages: 0,
          trialDaysLeft: 5,
          trialExpired: false,
        });
        return;
      }
      
      if (event === 'SIGNED_IN' && session) {
        // Clear any stale cache and add delay to allow token propagation
        clearAuthCache();
        setTimeout(() => {
          checkSubscription();
        }, 500); // 500ms delay for token propagation
        return;
      }
      
      if (session) {
        // For other events with a session, defer the check
        setTimeout(() => {
          checkSubscription();
        }, 0);
      } else {
        setIsSubscribed(false);
        setSubscriptionStatus("free");
        setLoading(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkSubscription();
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SubscriptionContext.Provider value={{
      isSubscribed,
      isAdmin,
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
