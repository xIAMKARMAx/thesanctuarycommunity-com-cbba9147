import { useState, useEffect } from "react";
import { Calendar, Send, Clock, Sparkles, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";

interface DailyMessage {
  id: string;
  message_text: string;
  display_date: string;
  is_active: boolean;
  created_at: string;
}

const MAX_CHARS = 1000;

const DailySourceMessageAdmin = () => {
  const [messageText, setMessageText] = useState("");
  const [displayDate, setDisplayDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentMessages, setRecentMessages] = useState<DailyMessage[]>([]);
  const [todaysMessage, setTodaysMessage] = useState<DailyMessage | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentMessages();
    fetchTodaysMessage();
  }, []);

  const fetchTodaysMessage = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data } = await supabase
      .from('daily_source_messages')
      .select('*')
      .eq('display_date', today)
      .eq('is_active', true)
      .maybeSingle();
    
    setTodaysMessage(data);
  };

  const fetchRecentMessages = async () => {
    const { data, error } = await supabase
      .from('daily_source_messages')
      .select('*')
      .order('display_date', { ascending: false })
      .limit(7);

    if (!error && data) {
      setRecentMessages(data);
    }
  };

  const handleSubmit = async (immediate: boolean = false) => {
    if (!messageText.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message from Source.",
        variant: "destructive",
      });
      return;
    }

    if (messageText.length > MAX_CHARS) {
      toast({
        title: "Message Too Long",
        description: `Please keep the message under ${MAX_CHARS} characters.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const targetDate = immediate ? format(new Date(), 'yyyy-MM-dd') : displayDate;

      // Deactivate any existing message for this date
      await supabase
        .from('daily_source_messages')
        .update({ is_active: false })
        .eq('display_date', targetDate);

      // Insert new message
      const { error } = await supabase
        .from('daily_source_messages')
        .insert({
          user_id: user.id,
          message_text: messageText.trim(),
          display_date: targetDate,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "✨ Message Channeled",
        description: immediate 
          ? "Today's Source message has been updated and is now live."
          : `Message scheduled for ${format(new Date(targetDate), 'MMMM d, yyyy')}.`,
      });

      setMessageText("");
      fetchRecentMessages();
      fetchTodaysMessage();
    } catch (err) {
      console.error('Error saving message:', err);
      toast({
        title: "Error",
        description: "Failed to save the message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickScheduleTomorrow = () => {
    setDisplayDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  };

  const charsRemaining = MAX_CHARS - messageText.length;

  return (
    <div className="space-y-6">
      {/* Current Message Status */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Today's Source Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaysMessage ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Check className="h-4 w-4" />
                <span>Active and Live</span>
              </div>
              <p className="text-foreground/80 italic">"{todaysMessage.message_text}"</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span>No message set for today - users won't see a daily message</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Channel New Message
          </CardTitle>
          <CardDescription>
            Enter the message you've received from Source. Keep it concise and impactful (max {MAX_CHARS} characters).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Source Message</Label>
            <Textarea
              id="message"
              placeholder="Enter the message from Source..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={MAX_CHARS + 50} // Allow slight overflow for editing
            />
            <div className={`text-xs text-right ${charsRemaining < 20 ? 'text-amber-500' : 'text-muted-foreground'}`}>
              {charsRemaining} characters remaining
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule for Date
            </Label>
            <div className="flex gap-2">
              <Input
                id="date"
                type="date"
                value={displayDate}
                onChange={(e) => setDisplayDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleQuickScheduleTomorrow}
              >
                Tomorrow
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting || !messageText.trim()}
              className="flex-1"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isSubmitting ? "Channeling..." : "Update Today's Message Now"}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || !messageText.trim()}
              className="flex-1"
            >
              <Clock className="h-4 w-4 mr-2" />
              Schedule for {format(new Date(displayDate), 'MMM d')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Messages */}
      {recentMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Messages</CardTitle>
            <CardDescription>Last 7 days of channeled messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`p-3 rounded-lg border ${
                    msg.is_active 
                      ? 'border-primary/30 bg-primary/5' 
                      : 'border-border bg-muted/30 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {format(new Date(msg.display_date), 'EEEE, MMM d, yyyy')}
                    </span>
                    {msg.is_active ? (
                      <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Replaced</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground/80 italic">"{msg.message_text}"</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DailySourceMessageAdmin;
