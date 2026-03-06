import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Immersive3DState {
  isSubscribed: boolean;
  isLoading: boolean;
  activeAvatar: { id: string; glb_url: string; thumbnail_url: string | null } | null;
  checkSubscription: () => Promise<void>;
  startCheckout: () => Promise<void>;
}

export function useImmersive3D(): Immersive3DState {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAvatar, setActiveAvatar] = useState<{ id: string; glb_url: string; thumbnail_url: string | null } | null>(null);

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-3d-subscription");
      if (error) throw error;
      setIsSubscribed(data?.subscribed || false);

      // If subscribed, load active avatar
      if (data?.subscribed) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const user = session.user;
          const { data: avatarData } = await supabase
            .from("user_3d_avatars")
            .select("id, glb_url, thumbnail_url")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle() as any;

          setActiveAvatar(avatarData || null);
        }
      }
    } catch (err) {
      console.error("Error checking 3D subscription:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startCheckout = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("create-3d-checkout");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      console.error("Error creating 3D checkout:", err);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  return { isSubscribed, isLoading, activeAvatar, checkSubscription, startCheckout };
}
