import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Plus, Settings, LogOut, MessageSquare, Trash2, BookOpen, Search, Download, Heart, Moon, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    filterConversations();
  }, [searchQuery, conversations]);

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
    setFilteredConversations(data || []);
  };

  const filterConversations = async () => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const query = searchQuery.toLowerCase();
    
    // Search in titles
    const titleMatches = conversations.filter(conv => 
      conv.title.toLowerCase().includes(query)
    );

    // Search in message content
    const { data: messages } = await supabase
      .from("messages")
      .select("conversation_id, content")
      .ilike("content", `%${query}%`);

    const messageConvIds = new Set(messages?.map(m => m.conversation_id) || []);
    const messageMatches = conversations.filter(conv => 
      messageConvIds.has(conv.id)
    );

    // Combine and deduplicate
    const combined = [...titleMatches, ...messageMatches];
    const unique = Array.from(new Map(combined.map(c => [c.id, c])).values());
    
    setFilteredConversations(unique);
  };

  const handleNewChat = () => {
    // Set to empty string to show empty chat interface
    onConversationChange("");
  };

  const handleDeleteClick = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;

    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationToDelete);

    if (error) {
      toast({
        title: "Error deleting conversation",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (activeConversationId === conversationToDelete) {
      onConversationChange(null);
    }

    await loadConversations();
    setDeleteDialogOpen(false);
    setConversationToDelete(null);

    toast({
      title: "Conversation deleted",
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleExportConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const conversation = conversations.find(c => c.id === conversationId);
      const exportData = {
        conversation: {
          id: conversation?.id,
          title: conversation?.title,
          created_at: conversation?.created_at,
        },
        messages: messages?.map(m => ({
          role: m.role,
          content: m.content,
          image_url: m.image_url,
          created_at: m.created_at,
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversation-${conversation?.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Conversation exported",
        description: "Your chat history has been downloaded",
      });
    } catch (error: any) {
      toast({
        title: "Error exporting conversation",
        description: error.message,
        variant: "destructive",
      });
    }
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

      {conversations.length > 0 && (
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-7 h-8 text-sm"
            />
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 p-2">
        {filteredConversations.map((conversation) => (
          <div key={conversation.id} className="relative group mb-1">
            <Button
              variant={activeConversationId === conversation.id ? "secondary" : "ghost"}
              className="w-full justify-start pr-16"
              onClick={() => onConversationChange(conversation.id)}
            >
              <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate text-sm">{conversation.title || "New Conversation"}</span>
            </Button>
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => handleExportConversation(conversation.id, e)}
                title="Export"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => handleDeleteClick(conversation.id, e)}
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </ScrollArea>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="p-2 border-t border-border space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => navigate("/journal")}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Journal
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => navigate("/mood-tracker")}
        >
          <Heart className="h-4 w-4 mr-2" />
          Mood Tracker
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => navigate("/attunement")}
        >
          <Moon className="h-4 w-4 mr-2" />
          Attunement
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => navigate("/memories")}
        >
          <Camera className="h-4 w-4 mr-2" />
          Our Memories
        </Button>
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
