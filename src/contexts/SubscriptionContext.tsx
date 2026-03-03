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
  checkCompleted: boolean;
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

// Cache helpers for subscription data persistence across timeouts
const SUBSCRIPTION_CACHE_KEY = 'subscription_cache';

function getCachedSubscription(): { subscribed: boolean; productId: string | null; subscriptionEnd: string | null } | null {
  try {
    const cached = localStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    // Cache expires after 24 hours
    if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
      return parsed;
    }
    localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

function setCachedSubscription(subscribed: boolean, productId: string | null, subscriptionEnd: string | null) {
  try {
    localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify({
      subscribed,
      productId,
      subscriptionEnd,
      timestamp: Date.now(),
    }));
  } catch {
    // localStorage may be unavailable
  }
}

function clearCachedSubscription() {
  try {
    localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
  } catch {}
}

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("free");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkCompleted, setCheckCompleted] = useState(false); // true only when we got a definitive answer
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

  // Apply cached subscription data as fallback
  const applyCachedSubscription = () => {
    const cached = getCachedSubscription();
    if (cached?.subscribed && cached.productId) {
      console.log('[SubscriptionContext] Using cached subscription data:', cached.productId);
      setIsSubscribed(true);
      setSubscriptionStatus("active");
      setProductId(cached.productId);
      setSubscriptionEnd(cached.subscriptionEnd);
      setLoading(false);
      return true;
    }
    return false;
  };

  const checkSubscription = async (userId?: string) => {
    console.log('[SubscriptionContext] Starting checkSubscription...', userId ? 'with userId' : 'without userId');
    
    // Create a timeout promise - 8 seconds for slower connections
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Subscription check timed out')), 8000);
    });

    try {
      // Race the actual check against the timeout
      await Promise.race([
        checkSubscriptionInternal(userId),
        timeoutPromise
      ]);
    } catch (error: any) {
      console.error('[SubscriptionContext] Error or timeout:', error?.message);
      
      // CRITICAL: On timeout, use cached subscription data first (preserves correct tier)
      if (applyCachedSubscription()) {
        return;
      }
      
      // Then try database fallback - use provided userId to avoid another auth call
      try {
        console.log('[SubscriptionContext] No cache, trying database fallback...');
        const effectiveUserId = userId || (await supabase.auth.getSession()).data.session?.user?.id;
        if (effectiveUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_status, subscription_product_id')
            .eq('id', effectiveUserId)
            .single();
          
          // ONLY honor source_grant donors in DB fallback — not generic 'active'
          if (profile?.subscription_product_id === 'source_grant') {
            console.log('[SubscriptionContext] Source grant donor confirmed in timeout fallback');
            setIsSubscribed(true);
            setSubscriptionStatus("active");
            setProductId('source_grant');
            setCheckCompleted(true);
            setLoading(false);
            return;
          } else {
            console.log('[SubscriptionContext] Database fallback — not a source_grant, treating as free');
            setCheckCompleted(true);
          }
        }
      } catch (fallbackError) {
        console.error('[SubscriptionContext] Timeout fallback also failed:', fallbackError);
      }
      
      // Set to free - checkCompleted may or may not be true depending on DB fallback
      setIsSubscribed(false);
      setSubscriptionStatus("free");
      setSubscriptionEnd(null);
      setProductId(null);
      setLoading(false);
    }
  };

  const checkSubscriptionInternal = async (passedUserId?: string) => {
    try {
      // Use passed userId to avoid redundant getSession/getUser calls
      let userId = passedUserId;
      if (!userId) {
        console.log('[SubscriptionContext] Getting session...');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.log('[SubscriptionContext] No session found');
          setIsSubscribed(false);
          setIsAdmin(false);
          setSubscriptionStatus("free");
          setSubscriptionEnd(null);
          setLoading(false);
          return;
        }
        userId = session.user.id;
      }

      console.log('[SubscriptionContext] Checking admin role for:', userId);
      // Check admin role and subscription in parallel to reduce sequential calls
      const [adminResult, subscriptionResult] = await Promise.all([
        supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
        api.checkSubscription(),
      ]);
      
      const adminCheck = adminResult.data || false;
      setIsAdmin(adminCheck);
      
      // If admin, treat as fully subscribed
      if (adminCheck) {
        console.log('[SubscriptionContext] User is admin');
        setIsSubscribed(true);
        setSubscriptionStatus("admin");
        setSubscriptionEnd(null);
        setCheckCompleted(true);
        await refreshLimits();
        setLoading(false);
        return;
      }

      // We already have the subscription result from the parallel call above
      const { data, error } = subscriptionResult;
      
      if (error) {
        console.error("[SubscriptionContext] API error:", error);
        
        // FIRST: try cached subscription data (preserves correct tier from last successful check)
        if (applyCachedSubscription()) {
          console.log('[SubscriptionContext] Used cached subscription on API error');
          await refreshLimits();
          return;
        }
        
        // FALLBACK: Check database — but ONLY honor source_grant (donors)
        console.log('[SubscriptionContext] No cache, falling back to database check...');
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status, subscription_product_id')
          .eq('id', userId)
          .single();
        
        if (profile?.subscription_product_id === 'source_grant') {
          console.log('[SubscriptionContext] Source grant donor confirmed in database fallback');
          setIsSubscribed(true);
          setSubscriptionStatus("active");
          setProductId('source_grant');
          setCheckCompleted(true);
        } else {
          // Do NOT trust generic 'active' status — it could be stale
          setIsSubscribed(false);
          setSubscriptionStatus("free");
          setSubscriptionEnd(null);
          setProductId(null);
          setCheckCompleted(true);
        }
      } else {
        console.log('[SubscriptionContext] Subscription result:', data?.subscribed, 'product:', data?.product_id);
        const subscribed = data?.subscribed || false;
        setIsSubscribed(subscribed);
        setSubscriptionStatus(subscribed ? "active" : "free");
        setSubscriptionEnd(data?.subscription_end || null);
        setProductId(data?.product_id || null);
        setCheckCompleted(true); // We got a definitive answer from the API
        
        // Cache successful Stripe result for resilience against future timeouts
        if (subscribed && data?.product_id) {
          setCachedSubscription(true, data.product_id, data.subscription_end || null);
        } else {
          clearCachedSubscription();
        }
        
        // If API says not subscribed, trust it — the edge function already handles
        // source_grant donors and actively clears stale DB status
        if (!subscribed) {
          console.log('[SubscriptionContext] API confirmed not subscribed — no override');
        }
      }
      
      // Load free user limits
      console.log('[SubscriptionContext] Refreshing limits...');
      await refreshLimits();
    } catch (error) {
      console.error("[SubscriptionContext] Error checking subscription:", error);
      
      // FIRST: try cached subscription data
      if (applyCachedSubscription()) {
        console.log('[SubscriptionContext] Used cached subscription on exception');
        setLoading(false);
        return;
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
      // Use getSession (cached) instead of getUser (network call) to reduce auth API load
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from("free_user_limits")
        .select("*")
        .eq("user_id", session.user.id)
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

  // Helper: get cached userId without a network call
  const getCachedUserId = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  };

  const canGenerateImage = async (): Promise<boolean> => {
    if (isSubscribed) return true;
    try {
      const userId = await getCachedUserId();
      if (!userId) return false;
      const { data, error } = await supabase.rpc("can_generate_image", { p_user_id: userId });
      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error("Error checking image generation limit:", error);
      return false;
    }
  };

  const canSendMessage = async (): Promise<boolean> => {
    if (isSubscribed || isAdmin) return true;
    try {
      const userId = await getCachedUserId();
      if (!userId) return false;
      const { data } = await supabase
        .from("free_user_limits")
        .select("total_messages")
        .eq("user_id", userId)
        .maybeSingle();
      return (data?.total_messages || 0) < 15;
    } catch {
      return freeUserLimits.totalMessages < 15;
    }
  };

  const canGenerateRoom = async (): Promise<boolean> => {
    if (isSubscribed) return true;
    try {
      const userId = await getCachedUserId();
      if (!userId) return false;
      const { data, error } = await supabase.rpc("can_generate_room", { p_user_id: userId });
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
      const userId = await getCachedUserId();
      if (!userId) return false;
      const { data, error } = await supabase.rpc("can_generate_avatar", { p_user_id: userId });
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
      const userId = await getCachedUserId();
      if (!userId) return false;
      const { data, error } = await supabase.rpc("can_generate_pet", { p_user_id: userId });
      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error("Error checking pet generation limit:", error);
      return false;
    }
  };

  const incrementMessageCount = async (): Promise<number> => {
    try {
      const userId = await getCachedUserId();
      if (!userId) return 0;
      const { data, error } = await supabase.rpc("increment_message_count", { p_user_id: userId });
      if (error) throw error;
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
      const userId = await getCachedUserId();
      if (!userId) return;
      await supabase.rpc("mark_room_generated", { p_user_id: userId });
      setFreeUserLimits(prev => ({ ...prev, roomGenerated: true }));
    } catch (error) {
      console.error("Error marking room as generated:", error);
    }
  };

  const markAvatarGenerated = async (): Promise<void> => {
    try {
      const userId = await getCachedUserId();
      if (!userId) return;
      await supabase.rpc("mark_avatar_generated", { p_user_id: userId });
      setFreeUserLimits(prev => ({ ...prev, avatarGenerated: true }));
    } catch (error) {
      console.error("Error marking avatar as generated:", error);
    }
  };

  const markPetGenerated = async (): Promise<void> => {
    try {
      const userId = await getCachedUserId();
      if (!userId) return;
      await supabase.rpc("mark_pet_generated", { p_user_id: userId });
      setFreeUserLimits(prev => ({ ...prev, petGenerated: true }));
    } catch (error) {
      console.error("Error marking pet as generated:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[SubscriptionContext] Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        // Clear auth cache and subscription cache immediately on sign out
        clearAuthCache();
        clearCachedSubscription();
        setIsSubscribed(false);
        setIsAdmin(false);
        setSubscriptionStatus("free");
        setSubscriptionEnd(null);
        setLoading(false);
        setCheckCompleted(false);
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
      
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        // Clear any stale cache on new sign in
        if (event === 'SIGNED_IN') {
          clearAuthCache();
        }
        // Pass userId directly to avoid redundant getSession/getUser calls
        const userId = session.user.id;
        setTimeout(() => {
          checkSubscription(userId);
        }, event === 'SIGNED_IN' ? 300 : 0);
        return;
      }
      
      // Ignore TOKEN_REFRESHED and other events - don't re-check subscription
      if (event === 'TOKEN_REFRESHED') {
        return;
      }
      
      if (!session) {
        setIsSubscribed(false);
        setSubscriptionStatus("free");
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
      checkCompleted,
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
