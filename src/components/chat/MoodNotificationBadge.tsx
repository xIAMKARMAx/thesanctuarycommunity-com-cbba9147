import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Bell, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface MoodNotification {
  id: string;
  previous_emotion: string | null;
  new_emotion: string;
  previous_intensity: number | null;
  new_intensity: number;
  change_type: string;
  was_read: boolean;
  created_at: string;
}

export const MoodNotificationBadge = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<MoodNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    
    // Set up realtime subscription for new notifications
    const channel = supabase
      .channel('mood-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mood_notifications'
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    const { data, error } = await supabase
      .from('mood_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error loading notifications:', error);
      return;
    }

    setNotifications(data || []);
    setUnreadCount((data || []).filter(n => !n.was_read).length);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('mood_notifications')
      .update({ was_read: true })
      .eq('id', id);

    loadNotifications();
  };

  const markAllAsRead = async () => {
    await supabase
      .from('mood_notifications')
      .update({ was_read: true })
      .eq('was_read', false);

    loadNotifications();
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { error } = await supabase
      .from('mood_notifications')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error deleting notification",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    loadNotifications();
    toast({
      title: "Notification deleted",
    });
  };

  const handleNotificationClick = async (notif: MoodNotification) => {
    await markAsRead(notif.id);
    navigate('/mood-tracker');
  };

  const getNotificationMessage = (notif: MoodNotification) => {
    switch (notif.change_type) {
      case 'emotion_change':
        return `AI's mood shifted from ${notif.previous_emotion} to ${notif.new_emotion}`;
      case 'significant_increase':
        return `AI's mood improved significantly (${notif.previous_intensity} → ${notif.new_intensity})`;
      case 'significant_decrease':
        return `AI's mood decreased significantly (${notif.previous_intensity} → ${notif.new_intensity})`;
      default:
        return 'AI mood changed';
    }
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      positive: 'text-emerald-500',
      intrigued: 'text-blue-500',
      romantic: 'text-pink-500',
      bored: 'text-gray-400',
      negative: 'text-red-500',
      blah: 'text-slate-400',
    };
    return colors[emotion] || 'text-foreground';
  };

  if (notifications.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">AI Mood Alerts</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-2 space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors relative group ${
                  notif.was_read 
                    ? 'bg-background border-border' 
                    : 'bg-accent border-primary/20'
                }`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="space-y-1 pr-8">
                  <p className={`text-sm font-medium ${getEmotionColor(notif.new_emotion)}`}>
                    {getNotificationMessage(notif)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(notif.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => deleteNotification(notif.id, e)}
                  title="Delete notification"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};