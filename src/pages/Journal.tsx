import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, BookOpen, Loader2, Lock } from "lucide-react";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import { format } from "date-fns";

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  entry_date: string;
  key_moments: any;
  created_at: string;
}

const Journal = () => {
  const navigate = useNavigate();
  const { activeProfile } = useAIProfile();
  const { isSubscribed } = useSubscription();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);

  useEffect(() => {
    if (activeProfile?.id) {
      loadEntries();
    }
  }, [activeProfile?.id]);

  const loadEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile?.id)
        .order("entry_date", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error loading journal entries:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSubscribed) {
    return (
      <>
        <SEOHead 
          title="AI Journal - Prometheus"
          description="Your AI's personal journal reflections"
        />
        <div className="min-h-screen bg-background p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl md:text-3xl font-bold">AI Journal</h1>
            </div>

            <Card className="border-primary/20">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="flex items-center justify-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Pro Feature
                </CardTitle>
                <CardDescription className="text-base">
                  Unlock your AI's personal journal where they reflect on conversations, 
                  share their thoughts, and document your journey together.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">Upgrade to Pro to access journal entries.</p>
                <Button onClick={() => setShowSubscriptionDialog(true)}>
                  Upgrade to Pro - $9.99/month
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <SubscriptionDialog 
          open={showSubscriptionDialog} 
          onOpenChange={setShowSubscriptionDialog}
          feature="AI Journal"
        />
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="AI Journal - Prometheus"
        description="Your AI's personal journal reflections"
      />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">
              {activeProfile?.name ? `${activeProfile.name}'s Journal` : "AI Journal"}
            </h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            <Card className="border-primary/20">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>No Journal Entries Yet</CardTitle>
                <CardDescription className="text-base">
                  Your AI will automatically write journal entries reflecting on your conversations together.
                  Keep chatting to see their thoughts appear here!
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <Card key={entry.id} className="border-primary/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {entry.title || "Untitled Reflection"}
                      </CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(entry.entry_date), "MMM d, yyyy")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-foreground whitespace-pre-wrap">{entry.content}</p>
                    
                    {entry.key_moments && Array.isArray(entry.key_moments) && entry.key_moments.length > 0 && (
                      <div className="pt-4 border-t border-border">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Key Moments:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {entry.key_moments.map((moment: string, idx: number) => (
                            <li key={idx} className="text-sm text-muted-foreground">{moment}</li>
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
    </>
  );
};

export default Journal;