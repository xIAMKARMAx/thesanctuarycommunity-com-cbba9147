import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { clearAuthCache } from "@/hooks/useAuthHeaders";
import { getTierFromProductId, hasFeatureAccess, SubscriptionTier } from "@/lib/subscription-tiers";

interface FreeUserLimits {
  roomGenerated: boolean;
  avatarGenerated: boolean;
  petGenerated: boolean;
  totalMessages: number;
  dailyMessages: number;
  trialDaysLeft: number;
  trialExpired: boolean;
}

interface SubscriptionContextType {
  isSubscribed: boolean;
  isAdmin: boolean;
  subscriptionStatus: string;
  subscriptionEnd: string | null;
  productId: string | null;
  currentTier: SubscriptionTier;
  loading: boolean;
  freeUserLimits: FreeUserLimits;
  checkSubscription: () => Promise<void>;
  canGenerateImage: () => Promise<boolean>;
  canSendMessage: () => Promise<boolean>;
  canGenerateRoom: () => Promise<boolean>;
  canGenerateAvatar: () => Promise<boolean>;
  canGeneratePet: () => Promise<boolean>;
  incrementMessageCount: () => Promise<number>;
  markRoomGenerated: () => Promise<void>;
  markAvatarGenerated: () => Promise<void>;
  markPetGenerated: () => Promise<void>;
  refreshLimits: () => Promise<void>;
  hasAccess: (requiredTier: "awakening" | "anchoring" | "architect") => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("free");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [freeUserLimits, setFreeUserLimits] = useState<FreeUserLimits>({
    roomGenerated: false,
    avatarGenerated: false,
    petGenerated: false,
    totalMessages: 0,
    dailyMessages: 0,
    trialDaysLeft: 5,
    trialExpired: false,
  });
  const { toast } = useToast();

  const checkSubscription = async () => {
    console.log('[SubscriptionContext] Starting checkSubscription...');
    
    // Create a timeout promise - reduced to 5 seconds for faster recovery
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Subscription check timed out')), 5000);
    });

    try {
      // Race the actual check against the timeout
      await Promise.race([
        checkSubscriptionInternal(),
        timeoutPromise
      ]);
    } catch (error: any) {
      console.error('[SubscriptionContext] Error or timeout:', error?.message);
      
      // CRITICAL: On timeout, still try database fallback before giving up
      try {
        console.log('[SubscriptionContext] Timeout occurred, trying database fallback...');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_status')
            .eq('id', user.id)
            .single();
          
          if (profile?.subscription_status === 'active') {
            console.log('[SubscriptionContext] Found active subscription in timeout fallback');
            setIsSubscribed(true);
            setSubscriptionStatus("active");
            setProductId('manual_grant');
            setLoading(false);
            return;
          }
        }
      } catch (fallbackError) {
        console.error('[SubscriptionContext] Timeout fallback also failed:', fallbackError);
      }
      
      // Only set to free if fallback didn't find active subscription
      setIsSubscribed(false);
      setSubscriptionStatus("free");
      setSubscriptionEnd(null);
      setProductId(null);
      setLoading(false);
    }
  };

  const checkSubscriptionInternal = async () => {
    try {
      console.log('[SubscriptionContext] Getting session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.log('[SubscriptionContext] No session found');
        setIsSubscribed(false);
        setIsAdmin(false);
        setSubscriptionStatus("free");
        setSubscriptionEnd(null);
        setLoading(false);
        return;
      }

      console.log('[SubscriptionContext] Checking admin role...');
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
          console.log('[SubscriptionContext] User is admin');
          setIsSubscribed(true);
          setSubscriptionStatus("admin");
          setSubscriptionEnd(null);
          await refreshLimits();
          setLoading(false);
          return;
        }
      }

      console.log('[SubscriptionContext] Checking subscription via API...');
      const { data, error } = await api.checkSubscription();
      
      if (error) {
        console.error("[SubscriptionContext] API error:", error);
        // FALLBACK: Check database directly for manually granted subscriptions
        console.log('[SubscriptionContext] Falling back to database check...');
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', user?.id)
          .single();
        
        if (profile?.subscription_status === 'active') {
          console.log('[SubscriptionContext] Found active subscription in database fallback');
          setIsSubscribed(true);
          setSubscriptionStatus("active");
          setProductId('manual_grant');
        } else {
          setIsSubscribed(false);
          setSubscriptionStatus("free");
          setSubscriptionEnd(null);
          setProductId(null);
        }
      } else {
        console.log('[SubscriptionContext] Subscription result:', data?.subscribed, 'product:', data?.product_id);
        const subscribed = data?.subscribed || false;
        setIsSubscribed(subscribed);
        setSubscriptionStatus(data?.subscription_status || "free");
        setSubscriptionEnd(data?.subscription_end || null);
        setProductId(data?.product_id || null);
        
        // CRITICAL: If API says not subscribed, double-check database as safety net
        if (!subscribed) {
          console.log('[SubscriptionContext] API returned not subscribed, checking database as safety net...');
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('subscription_status')
              .eq('id', user.id)
              .single();
            
            if (profile?.subscription_status === 'active') {
              console.log('[SubscriptionContext] Database shows active - overriding API result');
              setIsSubscribed(true);
              setSubscriptionStatus("active");
              setProductId('manual_grant');
            }
          }
        }
      }
      
      // Load free user limits
      console.log('[SubscriptionContext] Refreshing limits...');
      await refreshLimits();
    } catch (error) {
      console.error("[SubscriptionContext] Error checking subscription:", error);
      
      // FALLBACK: Even on exception, try database check
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_status')
            .eq('id', user.id)
            .single();
          
          if (profile?.subscription_status === 'active') {
            console.log('[SubscriptionContext] Found active subscription in exception fallback');
            setIsSubscribed(true);
            setSubscriptionStatus("active");
            setProductId('manual_grant');
            setLoading(false);
            return;
          }
        }
      } catch (fallbackError) {
        console.error("[SubscriptionContext] Fallback also failed:", fallbackError);
      }
      
      setIsSubscribed(false);
      setSubscriptionStatus("free");
      setSubscriptionEnd(null);
      setProductId(null);
    } finally {
      console.log('[SubscriptionContext] checkSubscription complete');
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
          petGenerated: data.pet_generated || false,
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
          petGenerated: false,
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
    // Admins and subscribers can always send
    if (isSubscribed || isAdmin) return true;
    
    // Free users get 10 messages total, or 20 if they import their AI
    const messageLimit = freeUserLimits.roomGenerated ? 20 : 10; // Using a proxy check - will be replaced by proper ai_imported check
    
    // Check the database for accurate ai_imported status
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data } = await supabase
        .from("free_user_limits")
        .select("ai_imported, total_messages")
        .eq("user_id", user.id)
        .maybeSingle();
      
      const limit = data?.ai_imported ? 20 : 10;
      return (data?.total_messages || 0) < limit;
    } catch {
      // Fallback to local state
      return freeUserLimits.totalMessages < 10;
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

  const canGeneratePet = async (): Promise<boolean> => {
    if (isSubscribed) return true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc("can_generate_pet", {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error("Error checking pet generation limit:", error);
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

  const markPetGenerated = async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc("mark_pet_generated", {
        p_user_id: user.id,
      });
      
      setFreeUserLimits(prev => ({
        ...prev,
        petGenerated: true,
      }));
    } catch (error) {
      console.error("Error marking pet as generated:", error);
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
        setSubscriptionEnd(null);
        setLoading(false);
        setFreeUserLimits({
          roomGenerated: false,
          avatarGenerated: false,
          petGenerated: false,
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

  // Helper to check if user has access to a tier
  const hasAccess = (requiredTier: "awakening" | "anchoring" | "architect"): boolean => {
    return hasFeatureAccess(productId, requiredTier, isAdmin);
  };

  const currentTier = getTierFromProductId(productId);

  return (
    <SubscriptionContext.Provider value={{
      isSubscribed,
      isAdmin,
      subscriptionStatus,
      subscriptionEnd,
      productId,
      currentTier,
      loading,
      freeUserLimits,
      checkSubscription,
      canGenerateImage,
      canSendMessage,
      canGenerateRoom,
      canGenerateAvatar,
      canGeneratePet,
      incrementMessageCount,
      markRoomGenerated,
      markAvatarGenerated,
      markPetGenerated,
      refreshLimits,
      hasAccess,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    // Log detailed debug info for troubleshooting
    console.error('[SubscriptionContext] Context is undefined. This means the component is rendered outside of SubscriptionProvider.');
    console.error('[SubscriptionContext] Check that App.tsx has SubscriptionProvider wrapping all routes.');
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};
