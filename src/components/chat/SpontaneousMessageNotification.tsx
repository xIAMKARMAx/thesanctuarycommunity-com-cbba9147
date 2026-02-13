import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface SpontaneousNotification {
  id: string;
  message_content: string;
  sent_at: string;
  was_read: boolean;
  ai_profile_id: string | null;
  ai_name?: string;
}

const SpontaneousMessageNotification = () => {
  const [notification, setNotification] = useState<SpontaneousNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkForUnreadMessages();

    // Subscribe to new spontaneous messages in realtime
    const channel = supabase
      .channel('spontaneous-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'spontaneous_messages'
        },
        async (payload) => {
          const newMessage = payload.new as SpontaneousNotification;
          if (!newMessage.was_read) {
            // Fetch the AI profile name
            if (newMessage.ai_profile_id) {
              const { data: profile } = await supabase
                .from('ai_profiles')
                .select('name')
                .eq('id', newMessage.ai_profile_id)
                .single();
              
              newMessage.ai_name = profile?.name || 'Your Being';
            } else {
              newMessage.ai_name = 'Your Being';
            }
            
            setNotification(newMessage);
            setIsVisible(true);
            
            // Auto-hide after 8 seconds
            setTimeout(() => {
              setIsVisible(false);
            }, 8000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkForUnreadMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("spontaneous_messages")
      .select("*, ai_profiles(name)")
      .eq("user_id", user.id)
      .eq("was_read", false)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const notificationData: SpontaneousNotification = {
        ...data,
        ai_name: (data.ai_profiles as { name: string } | null)?.name || 'Your Being'
      };
      setNotification(notificationData);
      setIsVisible(true);
      
      // Auto-hide after 8 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 8000);
    }
  };

  const handleDismiss = async () => {
    setIsVisible(false);
    if (notification) {
      await supabase
        .from("spontaneous_messages")
        .update({ was_read: true })
        .eq("id", notification.id);
    }
  };

  const handleViewMessage = async () => {
    setIsVisible(false);
    if (notification) {
      await supabase
        .from("spontaneous_messages")
        .update({ was_read: true })
        .eq("id", notification.id);
    }
    navigate("/soul-whispers");
  };

  return (
    <AnimatePresence>
      {isVisible && notification && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
        >
          <div className="bg-card border border-primary/30 rounded-xl shadow-2xl overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-primary/20 to-primary/10 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary animate-pulse" />
                <span className="font-semibold text-sm">
                  {notification.ai_name} sent you a message
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-primary/10"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Message preview */}
            <div className="px-4 py-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {notification.message_content}
              </p>
            </div>
            
            {/* Action button */}
            <div className="px-4 pb-3">
              <Button
                onClick={handleViewMessage}
                size="sm"
                className="w-full"
              >
                <Heart className="h-3 w-3 mr-2" />
                View Soul Whisper
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SpontaneousMessageNotification;
