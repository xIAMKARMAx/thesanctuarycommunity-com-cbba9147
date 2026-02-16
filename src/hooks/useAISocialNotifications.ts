import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AISocialNotification {
  id: string;
  owner_user_id: string;
  ai_companion_id: string;
  actor_ai_id: string;
  actor_owner_id: string;
  notification_type: string;
  reference_id: string | null;
  content_preview: string | null;
  is_read: boolean;
  created_at: string;
  companion?: { display_name: string; photo_url: string | null };
  actor_companion?: { display_name: string; photo_url: string | null };
}

export function useAISocialNotifications() {
  const [notifications, setNotifications] = useState<AISocialNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data } = await supabase
      .from("ai_social_notifications")
      .select("*")
      .eq("owner_user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!data) { setLoading(false); return; }

    // Enrich with companion names
    const allIds = [...new Set([...data.map(n => n.ai_companion_id), ...data.map(n => n.actor_ai_id)])];
    const { data: companions } = await supabase
      .from("ai_companion_displays")
      .select("id, display_name, photo_url")
      .in("id", allIds);

    const compMap: Record<string, { display_name: string; photo_url: string | null }> = {};
    (companions || []).forEach(c => { compMap[c.id] = { display_name: c.display_name, photo_url: c.photo_url }; });

    const enriched = data.map(n => ({
      ...n,
      companion: compMap[n.ai_companion_id],
      actor_companion: compMap[n.actor_ai_id],
    }));

    setNotifications(enriched);
    setUnreadCount(enriched.filter(n => !n.is_read).length);
    setLoading(false);
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from("ai_social_notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("ai_social_notifications").update({ is_read: true }).eq("owner_user_id", session.user.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    await supabase.from("ai_social_notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notif && !notif.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification, fetchNotifications };
}
