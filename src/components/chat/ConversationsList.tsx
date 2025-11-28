import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, MessageSquare, Sparkles, Trash2, Search, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
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
  updated_at: string;
}

interface ConversationsListProps {
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
}

const ConversationsList = ({ onConversationSelect, onNewConversation }: ConversationsListProps) => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
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
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
      setFilteredConversations(data || []);
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

    await loadConversations();
    setDeleteDialogOpen(false);
    setConversationToDelete(null);

    toast({
      title: "Conversation deleted",
    });
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

    // Combine and deduplicate results
    const combined = [...titleMatches, ...messageMatches];
    const unique = Array.from(new Map(combined.map(c => [c.id, c])).values());
    
    setFilteredConversations(unique);
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
          updated_at: conversation?.updated_at,
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

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          <Button 
            onClick={onNewConversation} 
            size="lg" 
            className="w-full"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Conversation
          </Button>

          {conversations.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations by keyword or sentence..."
                className="pl-9"
              />
            </div>
          )}

          {filteredConversations.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">
                {searchQuery ? `Search Results (${filteredConversations.length})` : "Recent Conversations"}
              </h2>
              {filteredConversations.map((conversation) => (
                <Card 
                  key={conversation.id}
                  className="cursor-pointer hover:bg-accent transition-colors relative group"
                  onClick={() => onConversationSelect(conversation.id)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-start gap-2 md:gap-3">
                      <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0 pr-16">
                        <p className="font-medium truncate text-sm md:text-base">{conversation.title}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {format(new Date(conversation.updated_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 md:h-8 md:w-8"
                          onClick={(e) => handleExportConversation(conversation.id, e)}
                          title="Export conversation"
                        >
                          <Download className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 md:h-8 md:w-8"
                          onClick={(e) => handleDeleteClick(conversation.id, e)}
                          title="Delete conversation"
                        >
                          <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {searchQuery && filteredConversations.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <div className="inline-block p-4 rounded-full bg-primary/10">
                <Search className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-serif mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try different keywords or check your spelling
                </p>
              </div>
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
    </div>
  );
};

export default ConversationsList;
