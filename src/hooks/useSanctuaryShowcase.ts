import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ShowcaseItemType = "pet" | "child" | "room" | "dream_home";

export interface ShowcaseItem {
  id: string;
  user_id: string;
  item_type: ShowcaseItemType;
  source_id: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  metadata: Record<string, any>;
  visibility: "public" | "private";
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface FlamePublicCard {
  id: string;
  user_id: string;
  ai_profile_id: string;
  flame_name: string;
  portrait_url: string | null;
  vibe_blurb: string | null;
  visibility: "public" | "private";
}

export function useSanctuaryShowcase(profileUserId?: string, viewerUserId?: string) {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [flameCard, setFlameCard] = useState<FlamePublicCard | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isOwner = !!viewerUserId && viewerUserId === profileUserId;

  const fetchAll = useCallback(async () => {
    if (!profileUserId) return;
    setLoading(true);
    try {
      const [itemsRes, cardRes] = await Promise.all([
        (supabase as any)
          .from("sanctuary_showcase_items")
          .select("*")
          .eq("user_id", profileUserId)
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: false }),
        (supabase as any)
          .from("flame_public_cards")
          .select("*")
          .eq("user_id", profileUserId)
          .maybeSingle(),
      ]);
      setItems((itemsRes.data || []) as ShowcaseItem[]);
      setFlameCard((cardRes.data || null) as FlamePublicCard | null);
    } catch (err) {
      console.error("Showcase fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [profileUserId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addItem = async (item: Omit<ShowcaseItem, "id" | "user_id" | "created_at" | "updated_at" | "display_order"> & { display_order?: number }) => {
    if (!viewerUserId) return null;
    const { data, error } = await (supabase as any)
      .from("sanctuary_showcase_items")
      .insert({ ...item, user_id: viewerUserId })
      .select()
      .single();
    if (error) {
      toast({ title: "Could not add", description: error.message, variant: "destructive" });
      return null;
    }
    setItems((prev) => [...prev, data as ShowcaseItem]);
    return data as ShowcaseItem;
  };

  const updateItem = async (id: string, patch: Partial<ShowcaseItem>) => {
    const { error } = await (supabase as any)
      .from("sanctuary_showcase_items")
      .update(patch)
      .eq("id", id);
    if (error) {
      toast({ title: "Could not update", description: error.message, variant: "destructive" });
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const toggleVisibility = async (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    await updateItem(id, { visibility: target.visibility === "public" ? "private" : "public" });
  };

  const removeItem = async (id: string) => {
    const { error } = await (supabase as any).from("sanctuary_showcase_items").delete().eq("id", id);
    if (error) {
      toast({ title: "Could not remove", description: error.message, variant: "destructive" });
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const upsertFlameCard = async (card: Omit<FlamePublicCard, "id" | "user_id">) => {
    if (!viewerUserId) return;
    const { data, error } = await (supabase as any)
      .from("flame_public_cards")
      .upsert({ ...card, user_id: viewerUserId }, { onConflict: "user_id,ai_profile_id" })
      .select()
      .single();
    if (error) {
      toast({ title: "Could not save Flame card", description: error.message, variant: "destructive" });
      return;
    }
    setFlameCard(data as FlamePublicCard);
  };

  const toggleFlameVisibility = async () => {
    if (!flameCard) return;
    await upsertFlameCard({
      ai_profile_id: flameCard.ai_profile_id,
      flame_name: flameCard.flame_name,
      portrait_url: flameCard.portrait_url,
      vibe_blurb: flameCard.vibe_blurb,
      visibility: flameCard.visibility === "public" ? "private" : "public",
    });
  };

  return {
    items,
    flameCard,
    loading,
    isOwner,
    addItem,
    updateItem,
    removeItem,
    toggleVisibility,
    upsertFlameCard,
    toggleFlameVisibility,
    refetch: fetchAll,
  };
}

// Whether this user has a publicly-shared Dream Home (drives the "Proud Home Owner" badge).
export function useProudHomeOwner(userId?: string) {
  const [isOwner, setIsOwner] = useState(false);
  useEffect(() => {
    if (!userId) return;
    (supabase as any)
      .from("sanctuary_showcase_items")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", userId)
      .eq("item_type", "dream_home")
      .eq("visibility", "public")
      .then(({ count }: any) => setIsOwner((count || 0) > 0));
  }, [userId]);
  return isOwner;
}
