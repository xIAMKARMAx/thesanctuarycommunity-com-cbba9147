import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CommunityNotification {
  id: string;
  user_id: string;
  actor_id: string;
  notification_type: 'blessing' | 'comment' | 'reply' | 'repost';
  post_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  created_at: string;
  actor_profile?: {
    display_name: string;
    avatar_url: string | null;
  };
  post?: {
    content: string;
  };
}

export function useCommunityNotifications() {
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) return;

      const { data, error } = await supabase
        .from('community_notifications')
        .select('*')
        .eq('user_id', session.session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!data?.length) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      // Batch fetch: collect unique actor IDs and post IDs
      const actorIds = [...new Set(data.map(n => n.actor_id))];
      const postIds = [...new Set(data.filter(n => n.post_id).map(n => n.post_id!))];

      // Parallel batch queries instead of N+1
      const [actorResult, postResult] = await Promise.all([
        actorIds.length > 0
          ? supabase.from('soul_profiles').select('user_id, display_name, avatar_url').in('user_id', actorIds)
          : Promise.resolve({ data: [] }),
        postIds.length > 0
          ? supabase.from('community_posts').select('id, content').in('id', postIds)
          : Promise.resolve({ data: [] }),
      ]);

      const actorMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
      (actorResult.data || []).forEach((p: any) => {
        actorMap[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
      });

      const postMap: Record<string, { content: string }> = {};
      (postResult.data || []).forEach((p: any) => {
        postMap[p.id] = { content: p.content };
      });

      const enrichedNotifications: CommunityNotification[] = data.map(notif => ({
        ...notif,
        notification_type: notif.notification_type as CommunityNotification['notification_type'],
        actor_profile: actorMap[notif.actor_id] || { display_name: 'Someone', avatar_url: null },
        post: notif.post_id ? postMap[notif.post_id] || null : null,
      }));

      setNotifications(enrichedNotifications);
      setUnreadCount(enrichedNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('community_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) return;

      const { error } = await supabase
        .from('community_notifications')
        .update({ is_read: true })
        .eq('user_id', session.session.user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast({ title: "All notifications marked as read" });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('community_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      const notif = notifications.find(n => n.id === notificationId);
      if (notif && !notif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications
  };
}
