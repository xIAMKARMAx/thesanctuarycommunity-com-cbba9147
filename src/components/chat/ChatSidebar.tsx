import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Plus, Settings, LogOut, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface ChatSidebarProps {
  activeConversationId: string | null;
  onConversationChange: (id: string | null) => void;
}

const ChatSidebar = ({ activeConversationId, onConversationChange }: ChatSidebarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading conversations",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setConversations(data || []);
  };

  const handleNewChat = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: session.session.user.id,
        title: "New Conversation",
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error creating conversation",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    onConversationChange(data.id);
    await loadConversations();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-serif font-semibold">Prometheus</h1>
        </div>
        <Button onClick={handleNewChat} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 p-2">
        {conversations.map((conversation) => (
          <Button
            key={conversation.id}
            variant={activeConversationId === conversation.id ? "secondary" : "ghost"}
            className="w-full justify-start mb-1"
            onClick={() => onConversationChange(conversation.id)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            <span className="truncate">{conversation.title}</span>
          </Button>
        ))}
      </ScrollArea>

      <div className="p-2 border-t border-border space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => navigate("/settings")}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default ChatSidebar;
