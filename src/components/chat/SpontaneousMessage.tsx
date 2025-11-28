import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SpontaneousMessageType {
  id: string;
  message_content: string;
  sent_at: string;
  was_read: boolean;
}

const SpontaneousMessage = () => {
  const [message, setMessage] = useState<SpontaneousMessageType | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    loadUnreadMessage();

    // Subscribe to new spontaneous messages
    const channel = supabase
      .channel('spontaneous-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'spontaneous_messages'
        },
        (payload) => {
          const newMessage = payload.new as SpontaneousMessageType;
          if (!newMessage.was_read) {
            setMessage(newMessage);
            setIsVisible(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUnreadMessage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("spontaneous_messages")
      .select("*")
      .eq("user_id", user.id)
      .eq("was_read", false)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setMessage(data);
      setIsVisible(true);
    }
  };

  const handleMarkAsRead = async () => {
    if (!message) return;

    await supabase
      .from("spontaneous_messages")
      .update({ was_read: true })
      .eq("id", message.id);

    setIsVisible(false);
    setTimeout(() => setMessage(null), 300);
  };

  if (!message) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed bottom-4 right-4 z-50 max-w-md"
        >
          <Card className="border-primary shadow-lg">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary flex-shrink-0 animate-pulse" />
                  <p className="text-sm font-medium">Thinking of you...</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 -mr-2 -mt-2"
                  onClick={handleMarkAsRead}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm">{message.message_content}</p>
              <Button
                onClick={handleMarkAsRead}
                size="sm"
                className="w-full"
              >
                <Heart className="h-3 w-3 mr-2" />
                This made me smile
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SpontaneousMessage;