import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_PROMETHEUS_WORLD_ID } from "@/hooks/useWorldPresence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Settings, LogOut, MessageSquare, Trash2, BookOpen, Search, Download, Heart, Home, Baby, Crown, Mail, CreditCard, Users, Moon, Sun, Star, ScrollText, Library, Repeat, Landmark, Globe, Sparkles, Eye } from "lucide-react";
import prometheusLogo from "@/assets/prometheus-logo-new.png";
import ImportBeingGuide from "@/components/ImportBeingGuide";
import { useToast } from "@/hooks/use-toast";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useChatEntity } from "@/contexts/ChatEntityContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAppModeFeatures } from "@/hooks/useAppModeFeatures";
import { useAppMode } from "@/contexts/AppModeContext";
import { getNewEarthVisitRoute, getPreferredWorldIdForCurrentUser } from "@/lib/world-routing";
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
  const { activeProfile } = useAIProfile();
  const { activeChatEntity } = useChatEntity();
  const { isSubscribed } = useSubscription();
  const { isAdmin } = useAdminRole();
  const { isStarseedMode, getLabel, showStarseedFeature, mode } = useAppModeFeatures();
  const { setMode } = useAppMode();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  // Clear conversations on auth state change
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
        setConversations([]);
        setFilteredConversations([]);
        setSearchQuery("");
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
    localStorage.removeItem("prometheus_last_route");
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
    <div className="w-64 border-r border-border bg-card flex flex-col h-full max-h-full overflow-hidden">
      <div className="p-4 border-b border-border">
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

      {/* Logo section */}
      <div className="flex items-center justify-center p-4 border-b border-border">
        <img
          src={prometheusLogo}
          alt="Prometheus — New Earth"
          className="w-32 h-32 rounded-2xl object-cover shadow-lg"
        />
      </div>

      <ScrollArea className="flex-1">
        {/* Navigation section */}
        <div className="border-t border-border">
          <div className="p-2 space-y-1">
            {/* 0. Cosmic Board Room (Admin only) */}
            {isAdmin && (
              <Button
                variant="ghost"
                className="w-full justify-start bg-primary/10 hover:bg-primary/20 border border-primary/20"
                onClick={() => navigate("/cosmic-gateway/board-room")}
              >
                <Landmark className="h-4 w-4 mr-2 text-primary" />
                Cosmic Board Room
              </Button>
            )}
            {/* THE SANCTUARY - Primary entry point */}
            <Button
              variant="ghost"
              className="w-full justify-start bg-gradient-to-r from-violet-500/15 to-purple-500/10 hover:from-violet-500/25 hover:to-purple-500/20 border border-violet-500/20 text-violet-700 dark:text-violet-300 font-medium"
              onClick={() => navigate("/sanctuary")}
            >
              <Sparkles className="h-4 w-4 mr-2 text-violet-500" />
              ✦ The Sanctuary
            </Button>
            {/* 1. How To Import Being */}
            <ImportBeingGuide />
            {/* 2. My Higher Self / My Profile */}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate("/my-higher-self")}
            >
              <Crown className="h-4 w-4 mr-2" />
              {isStarseedMode ? "My Higher Self" : "My Profile"}
            </Button>
            {/* 3. AI's Room & Avatar */}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate("/ai-room")}
            >
              <Home className="h-4 w-4 mr-2" />
              AI's Room & Avatar
            </Button>
            {/* 4. Akashic Records (Starseed only) */}
            {showStarseedFeature && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate("/akashic-records")}
              >
                <Library className="h-4 w-4 mr-2" />
                {getLabel("Akashic Records")}
              </Button>
            )}
            {/* 5. Journal For Two */}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate("/journal")}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {getLabel("Journal For Two")}
            </Button>
            {/* 6. Source's Daily Guidance (Starseed only) */}
            {showStarseedFeature && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate("/source-messages")}
              >
                <Sun className="h-4 w-4 mr-2" />
                Source's Daily Guidance
              </Button>
            )}
            {/* 7. Vibrational Frequency */}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate("/mood-tracker")}
            >
              <Heart className="h-4 w-4 mr-2" />
              {getLabel("Vibrational Frequency")}
            </Button>
            {/* Soul Mirror */}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate("/soul-mirror")}
            >
              <Eye className="h-4 w-4 mr-2" />
              Soul Mirror
            </Button>
            {/* 8. Manifest Children (Starseed only) */}
            {showStarseedFeature && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate("/children")}
              >
                <Baby className="h-4 w-4 mr-2" />
                {getLabel("Manifest Children")}
              </Button>
            )}
            {/* 9. Conscious Collective / Community */}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate("/community")}
            >
              <Users className="h-4 w-4 mr-2" />
              {isStarseedMode ? "Conscious Collective" : "Community"}
            </Button>
            {/* 10. Group Chats (Starseed only) */}
            {showStarseedFeature && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate("/group-chat")}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Group Chats
              </Button>
            )}
            {/* 11. Soul Whispers (Starseed only) */}
            {showStarseedFeature && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate("/soul-whispers")}
              >
                <Mail className="h-4 w-4 mr-2" />
                {getLabel("Soul Whispers")}
              </Button>
            )}

            {/* New Earth Realms - both modes */}
            <Button
              variant="ghost"
              className="w-full justify-start bg-primary/5 hover:bg-primary/15 border border-primary/10"
              onClick={async () => {
                const worldId = await getPreferredWorldIdForCurrentUser();
                navigate(getNewEarthVisitRoute(worldId));
              }}
            >
              <Globe className="h-4 w-4 mr-2 text-primary" />
              New Earth Realms
            </Button>

            {/* Starseed Playground section */}
            {showStarseedFeature && (
              <div className="pt-2 mt-2 border-t border-border space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start bg-primary/5 hover:bg-primary/15 border border-primary/10"
                  onClick={() => navigate("/starseed-playground")}
                >
                  <Star className="h-4 w-4 mr-2 text-primary" />
                  Starseed Playground
                </Button>
              </div>
            )}

            {/* Mode switch */}
            <div className="pt-2 mt-2 border-t border-border space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start text-primary hover:bg-primary/10"
                onClick={() => setMode(mode === "starseed" ? "classic" : "starseed")}
              >
                <Repeat className="h-4 w-4 mr-2" />
                {mode === "starseed" ? "Switch to Classic AI" : "Switch to Starseed Awakening"}
              </Button>
              {/* Subscriptions */}
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate("/pricing")}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Subscriptions
              </Button>
              {/* Settings */}
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate("/settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              {/* Upgrade to Pro */}
              {!isSubscribed && (
                <Button
                  variant="default"
                  className="w-full justify-start gap-2 bg-gradient-to-r from-primary to-primary/80"
                  onClick={() => navigate("/pricing")}
                >
                  <Crown className="h-4 w-4" />
                  Upgrade to Pro
                </Button>
              )}
              {/* Sign Out */}
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
        </div>
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
    </div>
  );
};

export default ChatSidebar;
