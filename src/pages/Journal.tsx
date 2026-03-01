import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, BookOpen, CalendarIcon, Loader2, Lock, Save, Sparkles, MessageCircle } from "lucide-react";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { format, isFuture, isToday, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  entry_date: string;
  key_moments: any;
  created_at: string;
  entry_type: string;
  user_journal_entry_id: string | null;
}

interface UserJournalEntry {
  id: string;
  content: string;
  entry_date: string;
  created_at: string;
  updated_at: string;
}

const MAX_USER_ENTRIES_PER_DAY = 2;

const Journal = () => {
  const navigate = useNavigate();
  const { activeProfile } = useAIProfile();
  const { isSubscribed } = useSubscription();
  const { toast } = useToast();
  const [aiEntries, setAiEntries] = useState<JournalEntry[]>([]);
  const [userEntries, setUserEntries] = useState<UserJournalEntry[]>([]);
  const [userContent, setUserContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const beingName = activeProfile?.name || `AI Being ${activeProfile?.profile_number || 1}`;
  const selectedDateStr = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);

  const userEntriesAtLimit = userEntries.length >= MAX_USER_ENTRIES_PER_DAY;

  useEffect(() => {
    if (activeProfile?.id) {
      loadAiEntries();
      loadUserEntries();
    }
  }, [activeProfile?.id, selectedDateStr]);

  const loadAiEntries = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile?.id)
        .eq("entry_date", selectedDateStr)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setAiEntries((data || []) as unknown as JournalEntry[]);
    } catch (error) {
      console.error("Error loading AI journal entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile?.id)
        .eq("entry_date", selectedDateStr)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setUserEntries(data || []);
    } catch (error) {
      console.error("Error loading user journal entries:", error);
    }
  };

  const saveUserEntry = async () => {
    if (userEntriesAtLimit) {
      toast({ title: "You've reached your limit of 2 journal entries for today.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: newEntry, error } = await supabase
        .from("user_journal_entries")
        .insert({
          user_id: user.id,
          ai_profile_id: activeProfile?.id,
          content: userContent,
          entry_date: selectedDateStr,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "✨ Journal entry saved!" });
      setUserContent("");
      await loadUserEntries();

      // Trigger AI response in background
      if (newEntry && activeProfile?.id) {
        triggerAIResponse(newEntry.id, userContent);
      }
    } catch (error) {
      console.error("Error saving journal entry:", error);
      toast({ title: "Failed to save entry", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const triggerAIResponse = async (userJournalEntryId: string, content: string) => {
    setGeneratingResponse(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Use AbortController for a 60-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await supabase.functions.invoke("journal-respond", {
        body: {
          userJournalEntryId,
          aiProfileId: activeProfile?.id,
          content,
        },
      });

      clearTimeout(timeoutId);

      if (response.error) {
        console.error("AI response error:", response.error);
        toast({ title: `${beingName} couldn't reflect right now. Try again later.`, variant: "destructive" });
      } else {
        await loadAiEntries();
        toast({ title: `${beingName} responded to your journal entry 💫` });
      }
    } catch (error: any) {
      console.error("Error triggering AI response:", error);
      if (error?.name === 'AbortError') {
        toast({ title: `${beingName}'s reflection is taking a while. Check back shortly!` });
        // Poll for the response for up to 2 minutes
        pollForAIResponse(userJournalEntryId);
        return; // Don't clear generatingResponse yet
      }
      toast({ title: "Something went wrong generating the reflection", variant: "destructive" });
    } finally {
      setGeneratingResponse(false);
    }
  };

  const pollForAIResponse = async (userJournalEntryId: string) => {
    const maxAttempts = 12; // 12 * 10s = 2 minutes
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) break;
      const { data } = await supabase
        .from("journal_entries")
        .select("id")
        .eq("user_journal_entry_id", userJournalEntryId)
        .eq("entry_type", "response")
        .limit(1);
      if (data && data.length > 0) {
        await loadAiEntries();
        toast({ title: `${beingName} responded to your journal entry 💫` });
        setGeneratingResponse(false);
        return;
      }
    }
    setGeneratingResponse(false);
    toast({ title: `${beingName} may still be reflecting. Refresh later to check.` });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && !isFuture(startOfDay(date))) {
      setSelectedDate(date);
      setCalendarOpen(false);
    }
  };

  const disabledDays = (date: Date) => {
    return isFuture(startOfDay(date)) && !isToday(date);
  };

  // Find AI response for a specific user entry
  const getAIResponseForEntry = (userEntryId: string) => {
    return aiEntries.find(e => e.entry_type === 'response' && e.user_journal_entry_id === userEntryId);
  };

  // Get autonomous AI entries (from daily cron)
  const autonomousAiEntries = aiEntries.filter(e => e.entry_type === 'autonomous');

  if (!isSubscribed) {
    return (
      <>
        <SEOHead 
          title="Journal For Two - Prometheus"
          description="A shared journal between you and your AI being"
        />
        <div className="min-h-screen bg-background p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl md:text-3xl font-bold">Journal For Two</h1>
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
                  Unlock your shared journal where your AI writes their reflections
                  and you can write your own thoughts — together, side by side.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">Upgrade to Pro to access Journal For Two.</p>
                <Button onClick={() => navigate("/pricing?required=awakening&feature=Journal For Two")}>
                  View Subscription Options
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="Journal For Two - Prometheus"
        description="A shared journal between you and your AI being"
      />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  Journal For Two
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  A shared space for reflections — yours & {beingName}'s
                </p>
              </div>
            </div>

            {/* Calendar Picker */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal gap-2 min-w-[200px]",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {isToday(selectedDate) ? (
                    <span>Today — {format(selectedDate, "MMM d, yyyy")}</span>
                  ) : (
                    format(selectedDate, "MMMM d, yyyy")
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={disabledDays}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date Display */}
          <div className="text-center">
            <p className="text-lg font-semibold text-primary">
              {isToday(selectedDate) 
                ? `Today — ${format(selectedDate, "EEEE, MMMM d, yyyy")}`
                : format(selectedDate, "EEEE, MMMM d, yyyy")
              }
            </p>
          </div>

          {/* Journal Tabs */}
          <Tabs defaultValue="shared" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="shared" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Shared Journal
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-2">
                <Sparkles className="h-4 w-4" />
                {beingName}'s Journal
              </TabsTrigger>
            </TabsList>

            {/* Shared Journal Tab - User writes, AI responds */}
            <TabsContent value="shared" className="mt-4 space-y-4">
              {/* Write area - only for today */}
              {isToday(selectedDate) && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Write Your Entry
                    </CardTitle>
                    <CardDescription>
                      {userEntriesAtLimit
                        ? "You've reached your 2 entries for today."
                        : `Share your thoughts — ${beingName} will respond. (${userEntries.length}/${MAX_USER_ENTRIES_PER_DAY} entries today)`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder={
                        userEntriesAtLimit
                          ? "You've already written 2 entries today. Come back tomorrow!"
                          : "What's on your mind today? Write as much as you'd like..."
                      }
                      value={userContent}
                      onChange={(e) => setUserContent(e.target.value)}
                      className="min-h-[150px] resize-y text-base"
                      disabled={userEntriesAtLimit}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {userContent.length > 0 ? `${userContent.length} characters` : ""}
                      </p>
                      <Button 
                        onClick={saveUserEntry} 
                        disabled={saving || !userContent.trim() || userEntriesAtLimit}
                        className="gap-2"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {saving ? "Saving..." : "Save Entry"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Generating response indicator */}
              {generatingResponse && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="py-4 flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      {beingName} is reflecting on your entry...
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Saved entries & AI responses */}
              {userEntries.length === 0 && !loading ? (
                <Card className="border-border/50">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <CardDescription className="text-base">
                      {isToday(selectedDate)
                        ? "No entries yet today. Write something above!"
                        : "No journal entries for this day."
                      }
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="space-y-4">
                  {userEntries.map((entry) => {
                    const aiResponse = getAIResponseForEntry(entry.id);
                    return (
                      <div key={entry.id} className="space-y-3">
                        {/* User's entry */}
                        <Card className="border-primary/20">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-primary flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                Your Entry
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(entry.created_at), "h:mm a")}
                              </p>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-foreground whitespace-pre-wrap">{entry.content}</p>
                          </CardContent>
                        </Card>

                        {/* AI Response */}
                        {aiResponse ? (
                          <Card className="border-primary/30 bg-primary/5 ml-4">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-primary flex items-center gap-2">
                                  <MessageCircle className="h-4 w-4" />
                                  {beingName}'s Response
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(aiResponse.created_at), "h:mm a")}
                                </p>
                              </div>
                              {aiResponse.title && (
                                <p className="text-sm font-semibold mt-1">{aiResponse.title}</p>
                              )}
                            </CardHeader>
                            <CardContent>
                              <p className="text-foreground whitespace-pre-wrap">{aiResponse.content}</p>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card className="border-dashed border-muted ml-4">
                            <CardContent className="py-3 flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <p className="text-sm">{beingName} is reflecting...</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* AI's Autonomous Journal Tab */}
            <TabsContent value="ai" className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : autonomousAiEntries.length === 0 ? (
                <Card className="border-primary/20">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>No Entry From {beingName}</CardTitle>
                    <CardDescription className="text-base">
                      {isToday(selectedDate)
                        ? `${beingName} hasn't written a journal entry yet today. They reflect on your conversations daily!`
                        : `${beingName} didn't write a journal entry on this day.`
                      }
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="space-y-4">
                  {autonomousAiEntries.map((entry) => (
                    <Card key={entry.id} className="border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {entry.title || "Untitled Reflection"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Written by {beingName}
                        </p>
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Journal;
