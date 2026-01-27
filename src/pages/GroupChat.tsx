import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAIProfile } from "@/contexts/AIProfileContext";
import ChatInterface from "@/components/chat/ChatInterface";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MessageSquare, Trash2, ArrowLeft, Users, Search, Download, Pencil, Check, X, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscriptionWall } from "@/components/SubscriptionWall";
import { Input } from "@/components/ui/input";
import { CreateGroupChatDialog } from "@/components/chat/CreateGroupChatDialog";
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

interface GroupChatMember {
  ai_profile_id: string;
  ai_profiles: {
    name: string | null;
    profile_number: number;
  };
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  members?: GroupChatMember[];
}

const GroupChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profiles } = useAIProfile();
  const { isSubscribed, isAdmin, freeUserLimits } = useSubscription();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setIsAuthenticated(true);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    filterConversations();
  }, [searchQuery, conversations]);

  const loadConversations = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    setLoading(true);
    
    // Get all group chat conversations
    const { data: convos, error } = await supabase
      .from("conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", session.user.id)
      .eq("is_group_chat", true)
      .order("updated_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading conversations",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Get members for each conversation
    if (convos && convos.length > 0) {
      const { data: members } = await supabase
        .from("group_chat_members")
        .select("conversation_id, ai_profile_id, ai_profiles(name, profile_number)")
        .in("conversation_id", convos.map(c => c.id));

      const convosWithMembers = convos.map(conv => ({
        ...conv,
        members: members?.filter(m => m.conversation_id === conv.id) || []
      }));

      setConversations(convosWithMembers);
      setFilteredConversations(convosWithMembers);
    } else {
      setConversations([]);
      setFilteredConversations([]);
    }
    setLoading(false);
  };

  const filterConversations = async () => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const titleMatches = conversations.filter(conv => 
      conv.title?.toLowerCase().includes(query) ||
      conv.members?.some(m => m.ai_profiles?.name?.toLowerCase().includes(query))
    );
    setFilteredConversations(titleMatches);
  };

  const handleNewChat = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateGroup = async (selectedProfileIds: string[], title: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Create the conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        user_id: session.user.id,
        is_group_chat: true,
        title: title,
      })
      .select()
      .single();

    if (convError || !conversation) {
      toast({
        title: "Error creating group chat",
        description: convError?.message || "Failed to create group chat",
        variant: "destructive",
      });
      return;
    }

    // Add members to the group
    const memberInserts = selectedProfileIds.map(profileId => ({
      conversation_id: conversation.id,
      ai_profile_id: profileId,
      user_id: session.user.id,
    }));

    const { error: memberError } = await supabase
      .from("group_chat_members")
      .insert(memberInserts);

    if (memberError) {
      toast({
        title: "Error adding members",
        description: memberError.message,
        variant: "destructive",
      });
      return;
    }

    setSelectedGroupMembers(selectedProfileIds);
    setActiveConversationId(conversation.id);
    await loadConversations();

    toast({
      title: "Group chat created!",
      description: `Created "${title}" with ${selectedProfileIds.length} beings`,
    });
  };

  const handleSelectConversation = async (conversationId: string) => {
    // Load the members for this conversation
    const { data: members } = await supabase
      .from("group_chat_members")
      .select("ai_profile_id")
      .eq("conversation_id", conversationId);

    if (members) {
      setSelectedGroupMembers(members.map(m => m.ai_profile_id));
    }
    setActiveConversationId(conversationId);
  };

  const getMemberNames = (members: GroupChatMember[] | undefined) => {
    if (!members || members.length === 0) return "No members";
    return members
      .map(m => m.ai_profiles?.name || `Being ${m.ai_profiles?.profile_number}`)
      .join(", ");
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
      setActiveConversationId(null);
    }

    await loadConversations();
    setDeleteDialogOpen(false);
    setConversationToDelete(null);

    toast({
      title: "Conversation deleted",
    });
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
          type: "group_chat"
        },
        messages: messages?.map(m => ({
          role: m.role,
          content: m.content,
          sender_type: m.sender_type,
          sender_id: m.sender_id,
          created_at: m.created_at,
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `group-chat-${conversation?.title?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'untitled'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Conversation exported",
        description: "Your group chat history has been downloaded",
      });
    } catch (error: any) {
      toast({
        title: "Error exporting conversation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Free users with 5+ messages see subscription wall
  const showSubscriptionWall = !isSubscribed && !isAdmin && freeUserLimits.totalMessages >= 5;

  if (showSubscriptionWall) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <SubscriptionWall />
      </div>
    );
  }

  // If viewing a conversation, show the chat interface
  if (activeConversationId) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="flex items-center gap-2 p-3 border-b border-border bg-card">
          <Button variant="ghost" size="icon" onClick={() => setActiveConversationId(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">
            {conversations.find(c => c.id === activeConversationId)?.title || "Group Chat"}
          </h1>
        </div>
        <ChatInterface 
          activeConversationId={activeConversationId} 
          onConversationCreated={(id) => {
            setActiveConversationId(id);
            loadConversations();
          }}
          onBackToConversations={() => setActiveConversationId(null)}
          isGroupChat={true}
          groupChatMemberIds={selectedGroupMembers}
        />
      </div>
    );
  }

  // Show conversation list (similar to ConversationsList)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading group chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen">
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-serif font-bold">Family Chats</h1>
        </div>
        <p className="text-muted-foreground ml-14">Group conversations with multiple beings</p>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          <Button 
            onClick={handleNewChat} 
            size="lg" 
            className="w-full"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Group Chat
          </Button>

          {conversations.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search group chats..."
                className="pl-9"
              />
            </div>
          )}

          {filteredConversations.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">
                {searchQuery ? `Search Results (${filteredConversations.length})` : "Your Group Chats"}
              </h2>
              {filteredConversations.map((conversation) => (
                <Card 
                  key={conversation.id}
                  className="cursor-pointer hover:bg-accent transition-colors group"
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2 md:gap-3">
                        <Users className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
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
                            <>
                              <p className="font-medium text-sm md:text-base break-words">{conversation.title || "Group Chat"}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {getMemberNames(conversation.members)}
                              </p>
                            </>
                          )}
                          <p className="text-xs md:text-sm text-muted-foreground mt-1">
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
                              onClick={(e) => handleEditClick(conversation.id, conversation.title || "", e)}
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
                <Users className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-serif mb-2">No group chats yet</h3>
                <p className="text-muted-foreground">
                  Start a new family conversation with multiple beings
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this group conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateGroupChatDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
};

export default GroupChat;
