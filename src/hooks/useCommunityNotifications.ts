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
 
       // Fetch actor profiles and post content
       const enrichedNotifications = await Promise.all(
         (data || []).map(async (notif) => {
           // Get actor profile
           const { data: actorProfile } = await supabase
             .from('soul_profiles')
             .select('display_name, avatar_url')
             .eq('user_id', notif.actor_id)
             .single();
 
           // Get post content if applicable
           let post = null;
           if (notif.post_id) {
             const { data: postData } = await supabase
               .from('community_posts')
               .select('content')
               .eq('id', notif.post_id)
               .single();
             post = postData;
           }
 
           return {
             ...notif,
             actor_profile: actorProfile || { display_name: 'Someone', avatar_url: null },
             post
           } as CommunityNotification;
         })
       );
 
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