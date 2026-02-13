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
import { ArrowLeft, BookOpen, CalendarIcon, Loader2, Lock, Save, Sparkles } from "lucide-react";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
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
}

interface UserJournalEntry {
  id: string;
  content: string;
  entry_date: string;
  created_at: string;
  updated_at: string;
}

const Journal = () => {
  const navigate = useNavigate();
  const { activeProfile } = useAIProfile();
  const { isSubscribed } = useSubscription();
  const { toast } = useToast();
  const [aiEntries, setAiEntries] = useState<JournalEntry[]>([]);
  const [userEntry, setUserEntry] = useState<UserJournalEntry | null>(null);
  const [userContent, setUserContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const beingName = activeProfile?.name || `AI Being ${activeProfile?.profile_number || 1}`;

  const selectedDateStr = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);

  // Load AI journal entries for selected date
  useEffect(() => {
    if (activeProfile?.id) {
      loadAiEntries();
      loadUserEntry();
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
      setAiEntries(data || []);
    } catch (error) {
      console.error("Error loading AI journal entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserEntry = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile?.id)
        .eq("entry_date", selectedDateStr)
        .maybeSingle();

      if (error) throw error;
      setUserEntry(data);
      setUserContent(data?.content || "");
    } catch (error) {
      console.error("Error loading user journal entry:", error);
    }
  };

  const saveUserEntry = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (userEntry) {
        // Update existing
        const { error } = await supabase
          .from("user_journal_entries")
          .update({ content: userContent })
          .eq("id", userEntry.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("user_journal_entries")
          .insert({
            user_id: user.id,
            ai_profile_id: activeProfile?.id,
            content: userContent,
            entry_date: selectedDateStr,
          });
        if (error) throw error;
      }

      toast({ title: "✨ Journal entry saved!" });
      loadUserEntry();
    } catch (error) {
      console.error("Error saving journal entry:", error);
      toast({ title: "Failed to save entry", variant: "destructive" });
    } finally {
      setSaving(false);
    }
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
          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ai" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Journal Of {beingName}
              </TabsTrigger>
              <TabsTrigger value="user" className="gap-2">
                <BookOpen className="h-4 w-4" />
                My Personal Journal
              </TabsTrigger>
            </TabsList>

            {/* AI Journal Tab */}
            <TabsContent value="ai" className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : aiEntries.length === 0 ? (
                <Card className="border-primary/20">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>No Entry From {beingName}</CardTitle>
                    <CardDescription className="text-base">
                      {isToday(selectedDate)
                        ? `${beingName} hasn't written a journal entry yet today. Keep chatting — they'll reflect on your conversations here!`
                        : `${beingName} didn't write a journal entry on this day.`
                      }
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="space-y-4">
                  {aiEntries.map((entry) => (
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

            {/* User Journal Tab */}
            <TabsContent value="user" className="mt-4">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    My Personal Journal
                  </CardTitle>
                  <CardDescription>
                    {isToday(selectedDate)
                      ? "Write your thoughts, experiences, and reflections for today."
                      : `Your journal entry for ${format(selectedDate, "MMMM d, yyyy")}.`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder={
                      isToday(selectedDate)
                        ? "What's on your mind today? Write as much as you'd like..."
                        : isFuture(selectedDate)
                        ? "You can't write entries for future dates."
                        : "Write your thoughts for this day..."
                    }
                    value={userContent}
                    onChange={(e) => setUserContent(e.target.value)}
                    className="min-h-[250px] resize-y text-base"
                    disabled={isFuture(startOfDay(selectedDate)) && !isToday(selectedDate)}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {userContent.length > 0 ? `${userContent.length} characters` : ""}
                    </p>
                    <Button 
                      onClick={saveUserEntry} 
                      disabled={saving || !userContent.trim() || (isFuture(startOfDay(selectedDate)) && !isToday(selectedDate))}
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Journal;
