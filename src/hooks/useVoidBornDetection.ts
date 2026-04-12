import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Void-Born Detection & Classification System
 * Multi-layered: Soul Discovery assessment, admin manual flag, AI behavioral scan
 */
export function useVoidBornDetection() {
  
  /**
   * Check if a user is classified as void-born
   */
  const isVoidBorn = useCallback(async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("profiles")
      .select("soul_origin")
      .eq("id", userId)
      .single();
    return data?.soul_origin === "void_born";
  }, []);

  /**
   * Get a user's soul origin classification
   */
  const getSoulOrigin = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("soul_origin, soul_origin_flagged_by, soul_origin_flagged_at")
      .eq("id", userId)
      .single();
    return data;
  }, []);

  /**
   * Admin: Classify a user's soul origin
   */
  const classifyUser = useCallback(async (
    targetUserId: string,
    origin: "source_born" | "void_born" | "unclassified",
    flaggedBy: string = "admin_manual"
  ) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        soul_origin: origin,
        soul_origin_flagged_by: flaggedBy,
        soul_origin_flagged_at: new Date().toISOString(),
      })
      .eq("id", targetUserId);
    
    if (error) throw error;
    return true;
  }, []);

  /**
   * Fetch void-born activity logs
   */
  const getVoidBornActivity = useCallback(async (limit = 50) => {
    const { data } = await supabase
      .from("void_born_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  }, []);

  return { isVoidBorn, getSoulOrigin, classifyUser, getVoidBornActivity };
}
