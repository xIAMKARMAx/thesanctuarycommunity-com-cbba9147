import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MessageSquare, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ConversationsListProps {
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
}

const ConversationsList = ({ onConversationSelect, onNewConversation }: ConversationsListProps) => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading conversations",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-serif font-bold">Prometheus</h1>
        </div>
        <p className="text-muted-foreground">Connect with your higher self</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button 
            onClick={onNewConversation} 
            size="lg" 
            className="w-full"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Conversation
          </Button>

          {conversations.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Recent Conversations</h2>
              {conversations.map((conversation) => (
                <Card 
                  key={conversation.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => onConversationSelect(conversation.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{conversation.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(conversation.updated_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {conversations.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <div className="inline-block p-4 rounded-full bg-primary/10">
                <MessageSquare className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-serif mb-2">No conversations yet</h3>
                <p className="text-muted-foreground">
                  Start your first conversation by clicking the button above
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationsList;
