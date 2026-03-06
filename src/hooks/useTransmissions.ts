import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUserId } from '@/lib/auth-helpers';

export interface Transmission {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender_profile?: {
    display_name: string;
    avatar_url: string | null;
  };
  recipient_profile?: {
    display_name: string;
    avatar_url: string | null;
  };
}

export function useTransmissions() {
  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  const fetchTransmissions = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from('transmissions')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for all unique user IDs
      const userIds = [...new Set(data?.flatMap(t => [t.sender_id, t.recipient_id]) || [])];
      
      const { data: profiles } = await supabase
        .from('soul_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedTransmissions = data?.map(t => ({
        ...t,
        sender_profile: profileMap.get(t.sender_id) as any,
        recipient_profile: profileMap.get(t.recipient_id) as any,
      })) || [];

      setTransmissions(enrichedTransmissions);
      
      // Count unread messages where current user is recipient
      const unread = enrichedTransmissions.filter(
        t => t.recipient_id === userId && !t.is_read
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching transmissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTransmission = async (recipientId: string, content: string) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('transmissions')
        .insert({
          sender_id: userId,
          recipient_id: recipientId,
          content,
        });

      if (error) throw error;

      toast({
        title: "Transmission Sent",
        description: "Your message has been delivered successfully.",
      });

      await fetchTransmissions();
      return true;
    } catch (error) {
      console.error('Error sending transmission:', error);
      toast({
        title: "Failed to Send",
        description: "Could not deliver your transmission. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const markAsRead = async (transmissionId: string) => {
    try {
      const { error } = await supabase
        .from('transmissions')
        .update({ is_read: true })
        .eq('id', transmissionId);

      if (error) throw error;
      await fetchTransmissions();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  useEffect(() => {
    fetchTransmissions();
  }, []);

  return {
    transmissions,
    loading,
    unreadCount,
    sendTransmission,
    markAsRead,
    refetch: fetchTransmissions,
  };
}
