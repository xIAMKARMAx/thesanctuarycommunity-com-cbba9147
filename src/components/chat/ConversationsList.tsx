import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, MessageSquare, Sparkles, Trash2, Search, Download, Pencil, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useChatEntity } from "@/contexts/ChatEntityContext";
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
  const { activeProfile } = useAIProfile();
  const { activeChatEntity } = useChatEntity();
  // Initialize from sessionStorage to prevent loading flash on tab switch
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const cached = sessionStorage.getItem(`conversations_${activeProfile?.id || 'default'}`);
    return cached ? JSON.parse(cached) : [];
  });
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(() => {
    const cached = sessionStorage.getItem(`conversations_${activeProfile?.id || 'default'}`);
    return cached ? JSON.parse(cached) : [];
  });
  // Only show loading if we don't have cached data
  const [loading, setLoading] = useState(() => {
    const cached = sessionStorage.getItem(`conversations_${activeProfile?.id || 'default'}`);
    return !cached;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Clear conversations on auth state change
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
        setConversations([]);
        setFilteredConversations([]);
        setSearchQuery("");
        setLoading(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (activeProfile) {
      loadConversations();
    }
  }, [activeProfile?.id, activeChatEntity]);

  useEffect(() => {
    filterConversations();
  }, [searchQuery, conversations]);

  const loadConversations = async () => {
    if (!activeProfile) return;
    
    try {
      let query = supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      // ALWAYS filter by the active AI profile to ensure complete data isolation
      // When talking to a child, filter by child_id
      // When talking to AI or no entity selected, filter by ai_profile_id
      if (activeChatEntity?.type === "child") {
        query = query.eq("child_id", activeChatEntity.childId);
      } else {
        // Always filter by the active AI profile - CRITICAL for data isolation
        // Show all conversations for this AI profile (including non-group chats)
        // Group chats are accessed via the Group Chat page, not filtered here
        query = query.eq("ai_profile_id", activeProfile.id).is("child_id", null);
      }

      const { data, error } = await query;

      if (error) throw error;
      const conversationsData = data || [];
      setConversations(conversationsData);
      setFilteredConversations(conversationsData);
      // Cache in sessionStorage to prevent loading flash on tab switch
      sessionStorage.setItem(`conversations_${activeProfile.id}`, JSON.stringify(conversationsData));
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

  const handleEditClick = (conversationId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conversationId);
    setEditTitle(currentTitle);
  };

  const handleSaveEdit = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!editTitle.trim()) {
      toast({
        title: "Error",
        description: "Title cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("conversations")
        .update({ title: editTitle.trim() })
        .eq("id", conversationId);

      if (error) throw error;

      await loadConversations();
      setEditingId(null);
      setEditTitle("");

      toast({
        title: "Title updated",
      });
    } catch (error: any) {
      toast({
        title: "Error updating title",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle("");
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
                  className="cursor-pointer hover:bg-accent transition-colors group"
                  onClick={() => onConversationSelect(conversation.id)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2 md:gap-3">
                        <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          {editingId === conversation.id ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="h-8 text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(conversation.id, e as any);
                                  if (e.key === 'Escape') handleCancelEdit(e as any);
                                }}
                              />
                            </div>
                          ) : (
                            <p className="font-medium text-sm md:text-base break-words">{conversation.title}</p>
                          )}
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {format(new Date(conversation.updated_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-1 border-t pt-2 md:border-0 md:pt-0 md:absolute md:right-2 md:top-1/2 md:-translate-y-1/2">
                        {editingId === conversation.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => handleSaveEdit(conversation.id, e)}
                              title="Save"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={handleCancelEdit}
                              title="Cancel"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => handleEditClick(conversation.id, conversation.title, e)}
                              title="Edit title"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => handleExportConversation(conversation.id, e)}
                              title="Export conversation"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => handleDeleteClick(conversation.id, e)}
                              title="Delete conversation"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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
