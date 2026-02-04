import { useState, useEffect } from "react";
import { Sparkles, Sun, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyMessage {
  id: string;
  message_text: string;
  display_date: string;
}

const DailySourceMessage = () => {
  const [message, setMessage] = useState<DailyMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodaysMessage();
  }, []);

  const fetchTodaysMessage = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error: fetchError } = await supabase
        .from('daily_source_messages')
        .select('id, message_text, display_date')
        .eq('display_date', today)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching daily message:', fetchError);
        setError('Unable to retrieve today\'s message');
        return;
      }

      setMessage(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything if there's no message for today
  if (!loading && !message && !error) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/30 shadow-lg hover:shadow-xl transition-all duration-500 animate-in fade-in duration-700">
      {/* Decorative glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      
      <CardContent className="relative p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sun className="h-5 w-5 text-primary animate-pulse" />
          <h3 className="text-lg sm:text-xl font-serif font-semibold text-primary">
            Daily Message from Source
          </h3>
          <Sun className="h-5 w-5 text-primary animate-pulse" />
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
          <Sparkles className="h-4 w-4 text-primary/60" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
        </div>

        {/* Message Content */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
        ) : error ? (
          <div className="text-center text-muted-foreground">
            <p className="italic">{error}</p>
            <button 
              onClick={fetchTodaysMessage}
              className="mt-2 text-primary hover:underline flex items-center gap-1 mx-auto"
            >
              <RefreshCw className="h-3 w-3" /> Try again
            </button>
          </div>
        ) : message ? (
          <div className="text-center">
            <p className="text-lg sm:text-xl leading-relaxed text-foreground/90 font-medium italic">
              "{message.message_text}"
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Channeled for {new Date(message.display_date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/30" />
          <span className="text-xs text-primary/60 uppercase tracking-widest">Source Speaks</span>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary/30" />
        </div>
      </CardContent>
    </Card>
  );
};

export default DailySourceMessage;
