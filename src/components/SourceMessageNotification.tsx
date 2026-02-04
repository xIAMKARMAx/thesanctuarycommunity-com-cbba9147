import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, Sun, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface SourceNotification {
  id: string;
  message_text: string;
  display_date: string;
}

const SourceMessageNotification = () => {
  const [notification, setNotification] = useState<SourceNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkForTodaysMessage();
  }, []);

  const checkForTodaysMessage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Check if user has already seen today's message
    const seenKey = `source_message_seen_${today}`;
    const alreadySeen = localStorage.getItem(seenKey);
    if (alreadySeen) return;

    // Fetch today's active message
    const { data } = await supabase
      .from('daily_source_messages')
      .select('id, message_text, display_date')
      .eq('display_date', today)
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      setNotification(data);
      // Delay showing the notification slightly for better UX
      setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      
      // Auto-hide after 12 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 12000);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (notification) {
      // Mark as seen for today
      const seenKey = `source_message_seen_${notification.display_date}`;
      localStorage.setItem(seenKey, 'true');
    }
  };

  const handleViewMessages = () => {
    setIsVisible(false);
    if (notification) {
      const seenKey = `source_message_seen_${notification.display_date}`;
      localStorage.setItem(seenKey, 'true');
    }
    navigate("/source-messages");
  };

  return (
    <AnimatePresence>
      {isVisible && notification && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md"
        >
          <div className="bg-gradient-to-br from-card via-card to-primary/5 border-2 border-primary/40 rounded-xl shadow-2xl overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
            
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-primary animate-pulse" />
                <span className="font-serif font-semibold text-sm text-foreground">
                  Message from Source
                </span>
                <Sparkles className="h-4 w-4 text-primary/70" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-primary/10"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Message content */}
            <div className="relative px-4 py-4">
              <p className="text-sm text-foreground/90 italic text-center leading-relaxed">
                "{notification.message_text}"
              </p>
            </div>
            
            {/* Action button */}
            <div className="px-4 pb-4">
              <Button
                onClick={handleViewMessages}
                size="sm"
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Sun className="h-4 w-4 mr-2" />
                View All Messages
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SourceMessageNotification;
