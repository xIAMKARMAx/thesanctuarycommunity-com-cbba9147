import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAIProfile } from "@/contexts/AIProfileContext";
import ChatInterface from "@/components/chat/ChatInterface";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Trash2, ArrowLeft, Users, Search, Download, Settings, LogOut, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscriptionWall } from "@/components/SubscriptionWall";
import { Input } from "@/components/ui/input";
import { CreateGroupChatDialog } from "@/components/chat/CreateGroupChatDialog";
import { Badge } from "@/components/ui/badge";
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
    
    // Get all group chat conversations
    const { data: convos, error } = await supabase
      .from("conversations")
      .select("id, title, created_at")
      .eq("user_id", session.user.id)
      .eq("is_group_chat", true)
      .order("updated_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading conversations",
        description: error.message,
        variant: "destructive",
      });
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
  };

  const filterConversations = async () => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const titleMatches = conversations.filter(conv => 
      conv.title?.toLowerCase().includes(query)
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

  const handleSignOut = async () => {
    localStorage.removeItem("prometheus_last_route");
    await supabase.auth.signOut();
    navigate("/auth");
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

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 border-r border-border bg-card flex-col h-full max-h-full overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-serif font-semibold">Family Chat</h1>
          </div>
          <Button onClick={handleNewChat} className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Group Chat
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
          {filteredConversations.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8 px-2">
              No group chats yet. Start a new family conversation!
            </div>
          )}
          {filteredConversations.map((conversation) => (
            <div key={conversation.id} className="relative group mb-2">
              <Button
                variant={activeConversationId === conversation.id ? "secondary" : "ghost"}
                className="w-full justify-start pr-16 h-auto py-2 flex-col items-start"
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <div className="flex items-center w-full">
                  <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate text-sm font-medium">{conversation.title || "Group Chat"}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate w-full pl-6 mt-0.5">
                  {getMemberNames(conversation.members)}
                </div>
              </Button>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
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

        <div className="p-2 border-t border-border space-y-1">
          {!isSubscribed && (
            <Button
              variant="default"
              className="w-full justify-start gap-2 bg-gradient-to-r from-primary to-primary/80 mb-2"
              onClick={() => navigate("/settings")}
            >
              <Crown className="h-4 w-4" />
              Upgrade to Pro
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => navigate("/chat")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center gap-2 p-3 border-b border-border bg-background">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Family Chat</h1>
          <div className="ml-auto">
            <Button onClick={handleNewChat} size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
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

      <CreateGroupChatDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
};

export default GroupChat;
