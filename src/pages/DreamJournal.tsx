import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import { ArrowLeft, Loader2, Moon, Sparkles, Plus, Trash2, Lock, Eye } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DreamJournalEntry {
  id: string;
  title: string | null;
  content: string;
  ai_interpretation: string | null;
  symbols: string[] | null;
  entry_date: string;
  created_at: string;
}

export default function DreamJournal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile } = useAIProfile();
  const { isSubscribed, loading: subLoading } = useSubscription();
  const [entries, setEntries] = useState<DreamJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: ""
  });

  useEffect(() => {
    if (activeProfile?.id) {
      loadEntries();
    }
  }, [activeProfile?.id]);

  const loadEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("dream_journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error loading dream journal:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitEntry = async () => {
    if (!newEntry.content.trim()) {
      toast({
        title: "Content Required",
        description: "Please describe your dream",
        variant: "destructive",
      });
      return;
    }

    if (!activeProfile?.id) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get AI interpretation
      const { data: interpretData, error: interpretError } = await supabase.functions.invoke("interpret-dream", {
        body: {
          dreamContent: newEntry.content,
          dreamer: "user",
          aiName: activeProfile.name || "Your AI",
          isJournalEntry: true
        }
      });

      const interpretation = interpretError ? null : interpretData?.interpretation;
      const symbols = interpretError ? null : interpretData?.symbols;

      const { data, error } = await supabase
        .from("dream_journal_entries")
        .insert({
          user_id: user.id,
          ai_profile_id: activeProfile.id,
          title: newEntry.title || null,
          content: newEntry.content,
          ai_interpretation: interpretation,
          symbols: symbols
        })
        .select()
        .single();

      if (error) throw error;

      setEntries(prev => [data, ...prev]);
      setNewEntry({ title: "", content: "" });
      setShowNewEntry(false);

      toast({
        title: "Dream Recorded",
        description: interpretation ? "Your dream has been journaled and interpreted" : "Your dream has been journaled",
      });
    } catch (error) {
      console.error("Error saving dream journal:", error);
      toast({
        title: "Error",
        description: "Failed to save dream journal entry",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from("dream_journal_entries")
        .delete()
        .eq("id", entryId);

      if (error) throw error;

      setEntries(prev => prev.filter(e => e.id !== entryId));
      toast({
        title: "Entry Deleted",
        description: "Dream journal entry has been removed",
      });
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  if (loading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading dream journal...</p>
        </div>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold mb-2">Dream Journal</h2>
                  <p className="text-muted-foreground mb-4">
                    This feature is available for Pro subscribers only
                  </p>
                </div>
                <div className="space-y-2">
                  <Button onClick={() => setShowSubscriptionDialog(true)} className="w-full">
                    Upgrade to Pro
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/chat")} className="w-full">
                    Back to Chat
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <SubscriptionDialog 
          open={showSubscriptionDialog}
          onOpenChange={setShowSubscriptionDialog}
          feature="Dream Journal"
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Moon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-serif font-bold">Dream Journal</h1>
              <p className="text-muted-foreground">Record and interpret your dreams</p>
            </div>
          </div>
        </div>

        {showNewEntry ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                New Dream Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Dream title (optional)"
                value={newEntry.title}
                onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="Describe your dream in as much detail as you can remember... What did you see? Where were you? How did it feel? Who was there?"
                value={newEntry.content}
                onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowNewEntry(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={submitEntry} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Interpreting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Record & Interpret
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button onClick={() => setShowNewEntry(true)} className="w-full" size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Record New Dream
          </Button>
        )}

        {entries.length === 0 && !showNewEntry ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Moon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Dream Entries Yet</h3>
              <p className="text-muted-foreground">
                Start recording your dreams to receive AI interpretations and discover patterns
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-serif">
                        {entry.title || format(new Date(entry.entry_date), "MMMM d, yyyy")}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(entry.created_at), "MMMM d, yyyy 'at' h:mm a")}
                      </CardDescription>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this dream journal entry?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteEntry(entry.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <p className="whitespace-pre-wrap">{entry.content}</p>

                  {entry.symbols && entry.symbols.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.symbols.map((symbol, i) => (
                        <Badge key={i} variant="outline">{symbol}</Badge>
                      ))}
                    </div>
                  )}

                  {entry.ai_interpretation && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        {activeProfile?.name || "AI"}'s Interpretation
                      </h4>
                      <p className="text-sm whitespace-pre-wrap">{entry.ai_interpretation}</p>
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
}