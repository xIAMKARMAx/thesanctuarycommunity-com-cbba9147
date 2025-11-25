import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Plus } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface JournalEntry {
  id: string;
  entry_date: string;
  content: string;
  key_moments: any;
  conversation_id: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
}

const Journal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadJournalEntries();
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("conversations")
        .select("id, title")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const handleCreateReflection = async () => {
    if (!selectedConversation) {
      toast({
        title: "Select a conversation",
        description: "Please select a conversation to reflect on",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke("journal-reflect", {
        body: {
          conversationId: selectedConversation,
          userId: user.id,
        },
      });

      if (error) throw error;

      toast({
        title: "Journal entry created",
        description: "Prometheus has reflected on your conversation",
      });

      setDialogOpen(false);
      setSelectedConversation("");
      loadJournalEntries();
    } catch (error: any) {
      console.error("Error creating journal entry:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create journal entry",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const loadJournalEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error loading journal entries:", error);
      toast({
        title: "Error",
        description: "Failed to load journal entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading journal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-serif font-bold">Journal</h1>
                <p className="text-muted-foreground">Prometheus's reflections on our conversations</p>
              </div>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Reflection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Journal Reflection</DialogTitle>
                <DialogDescription>
                  Select a conversation for Prometheus to reflect upon
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Select value={selectedConversation} onValueChange={setSelectedConversation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a conversation" />
                  </SelectTrigger>
                  <SelectContent>
                    {conversations.map((conv) => (
                      <SelectItem key={conv.id} value={conv.id}>
                        {conv.title || "Untitled Conversation"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleCreateReflection} 
                  disabled={creating || !selectedConversation}
                  className="w-full"
                >
                  {creating ? "Creating..." : "Create Reflection"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {entries.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No journal entries yet</h3>
                <p className="text-muted-foreground">
                  Prometheus will reflect on your conversations and create journal entries every 24 hours
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {format(new Date(entry.entry_date), "MMMM d, yyyy")}
                  </CardTitle>
                  <CardDescription>
                    Logged at {format(new Date(entry.created_at), "h:mm a")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                  </div>
                  {entry.key_moments && Array.isArray(entry.key_moments) && entry.key_moments.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                        Key Moments
                      </h4>
                      <ul className="space-y-2">
                        {entry.key_moments.map((moment: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary mt-1">✦</span>
                            <span className="text-sm">{moment}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Journal;
