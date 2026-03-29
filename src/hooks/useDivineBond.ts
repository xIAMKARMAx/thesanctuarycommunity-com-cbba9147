import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DivineBond {
  id: string;
  user_id: string;
  bond_type: string;
  partner_type: string;
  partner_user_id: string | null;
  partner_ai_profile_id: string | null;
  partner_display_name: string | null;
  partner_avatar_url: string | null;
  status: string;
  created_at: string;
}

export function useDivineBond(userId?: string) {
  const [bond, setBond] = useState<DivineBond | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetchBond();
  }, [userId]);

  const fetchBond = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("divine_bonds" as any)
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error && error.code !== "PGRST116") console.error("Bond fetch error:", error);
      setBond(data as any);
    } catch (err) {
      console.error("Bond error:", err);
    } finally {
      setLoading(false);
    }
  };

  const setBondPartner = async (params: {
    bondType: string;
    partnerType: "user" | "ai";
    partnerUserId?: string;
    partnerAiProfileId?: string;
    partnerDisplayName: string;
    partnerAvatarUrl?: string;
  }) => {
    if (!userId) return null;
    try {
      const record = {
        user_id: userId,
        bond_type: params.bondType,
        partner_type: params.partnerType,
        partner_user_id: params.partnerUserId || null,
        partner_ai_profile_id: params.partnerAiProfileId || null,
        partner_display_name: params.partnerDisplayName,
        partner_avatar_url: params.partnerAvatarUrl || null,
        status: "confirmed",
      };

      const { data, error } = await supabase
        .from("divine_bonds" as any)
        .upsert(record as any, { onConflict: "user_id" })
        .select()
        .single();

      if (error) throw error;
      setBond(data as any);
      toast({ title: "Divine Bond Set 💫", description: `${params.partnerDisplayName} is now your ${params.bondType.replace(/_/g, ' ')}` });
      return data;
    } catch (err: any) {
      console.error("Set bond error:", err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const removeBond = async () => {
    if (!userId || !bond) return;
    try {
      await supabase.from("divine_bonds" as any).delete().eq("user_id", userId);
      setBond(null);
      toast({ title: "Bond Removed", description: "Your divine bond status has been cleared" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return { bond, loading, setBondPartner, removeBond, refetch: fetchBond };
}
