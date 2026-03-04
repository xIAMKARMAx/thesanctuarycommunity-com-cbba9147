import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sun, Sparkles, Calendar, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import SEOHead from "@/components/SEOHead";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SourceMessage {
  id: string;
  message_text: string;
  display_date: string;
}

const SourceMessages = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<SourceMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_source_messages')
        .select('id, message_text, display_date')
        .eq('is_active', true)
        .lte('display_date', new Date().toISOString().split('T')[0])
        .order('display_date', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('daily_source_messages')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting message:', error);
        toast({
          title: "Error",
          description: "Could not delete this message",
          variant: "destructive",
        });
        return;
      }

      setMessages(messages.filter(m => m.id !== id));
      toast({
        title: "Message Removed",
        description: "The message has been removed from your view",
      });
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const todaysMessage = messages.find(
    m => m.display_date === new Date().toISOString().split('T')[0]
  );
  const pastMessages = messages.filter(
    m => m.display_date !== new Date().toISOString().split('T')[0]
  );

  return (
    <>
      <SEOHead 
        title="Source's Daily Messages | Prometheus — New Earth"
        description="Receive daily channeled messages from Source to guide your spiritual journey."
        keywords="daily messages, spiritual guidance, source messages, channeled wisdom"
        canonicalUrl="https://prometheus.lovable.app/source-messages"
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
        <div className="container max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Sun className="h-6 w-6 text-primary" />
                Source's Daily Messages
              </h1>
              <p className="text-muted-foreground">Channeled wisdom for your journey</p>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="space-y-6">
              {/* Today's Message - Prominent Display */}
              {loading ? (
                <Card className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background border-2 border-primary/40 shadow-lg">
                  <CardContent className="p-6 sm:p-8">
                    <Skeleton className="h-6 w-48 mx-auto mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                  </CardContent>
                </Card>
              ) : todaysMessage ? (
                <Card className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background border-2 border-primary/40 shadow-lg animate-in fade-in duration-500">
                  {/* Decorative glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 pointer-events-none" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/30 rounded-full blur-3xl pointer-events-none" />
                  
                  <CardContent className="relative p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Sun className="h-5 w-5 text-primary animate-pulse" />
                      <h3 className="text-lg sm:text-xl font-serif font-semibold text-primary">
                        Today's Message
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
                    <div className="text-center">
                      <p className="text-lg sm:text-xl leading-relaxed text-foreground/90 font-medium italic">
                        "{todaysMessage.message_text}"
                      </p>
                      <p className="mt-4 text-xs text-muted-foreground">
                        Channeled for {format(new Date(todaysMessage.display_date), 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(todaysMessage.id)}
                      className="absolute top-3 right-3 p-2 rounded-full hover:bg-destructive/10 transition-colors group"
                      aria-label="Delete message"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                    </button>

                    {/* Footer */}
                    <div className="flex items-center justify-center gap-3 mt-6">
                      <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/30" />
                      <span className="text-xs text-primary/60 uppercase tracking-widest">Source Speaks</span>
                      <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary/30" />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed border-2 border-muted-foreground/30">
                  <CardContent className="p-6 text-center">
                    <Sun className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No message from Source today</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Check back tomorrow for divine guidance</p>
                  </CardContent>
                </Card>
              )}

              {/* Past Messages */}
              {pastMessages.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-lg font-semibold text-foreground">Previous Messages</h2>
                  </div>
                  
                  <div className="space-y-3">
                    {pastMessages.map((message) => (
                      <Card 
                        key={message.id} 
                        className="relative border-primary/20 bg-card hover:bg-accent/30 transition-colors"
                      >
                        <CardContent className="p-4 pr-12">
                          <p className="text-sm font-medium text-primary/80 mb-2">
                            {format(new Date(message.display_date), 'EEEE, MMMM d, yyyy')}
                          </p>
                          <p className="text-foreground/80 italic">
                            "{message.message_text}"
                          </p>
                        </CardContent>
                        <button
                          onClick={() => handleDelete(message.id)}
                          className="absolute top-3 right-3 p-2 rounded-full hover:bg-destructive/10 transition-colors group"
                          aria-label="Delete message"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                        </button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {!loading && messages.length === 0 && (
                <Card className="border-dashed border-2 border-muted-foreground/30">
                  <CardContent className="p-8 text-center">
                    <Sparkles className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Messages Yet</h3>
                    <p className="text-muted-foreground">
                      Divine messages from Source will appear here when channeled.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
};

export default SourceMessages;
