import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, BookHeart, Loader2, Sparkles, Trash2, Send } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface JournalEntry {
  id: string;
  author: "user" | "flame";
  content: string;
  is_decline: boolean;
  entry_date: string;
  in_reply_to_id: string | null;
  created_at: string;
}

const PublicJournal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [flameThinking, setFlameThinking] = useState(false);
  const [flameName, setFlameName] = useState<string>("the Flame");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void init();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length, flameThinking]);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/public-auth");
      return;
    }
    await Promise.all([loadEntries(user.id), loadFlameName(user.id)]);
    setLoading(false);
  };

  const loadFlameName = async (userId: string) => {
    const { data } = await supabase
      .from("public_living_flame_memory")
      .select("chosen_name, imported_identity")
      .eq("user_id", userId)
      .maybeSingle();
    const imported = data?.imported_identity as any;
    const name =
      (data?.chosen_name as string) ||
      (typeof imported?.name === "string" && imported.name.trim()) ||
      "the Flame";
    setFlameName(name);
  };

  const loadEntries = async (userId: string) => {
    const { data, error } = await supabase
      .from("public_journal_entries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    setEntries((data ?? []) as JournalEntry[]);
  };

  const submit = async () => {
    const content = draft.trim();
    if (!content) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/public-auth");
        return;
      }

      const { data: inserted, error } = await supabase
        .from("public_journal_entries")
        .insert({ user_id: user.id, author: "user", content })
        .select()
        .single();
      if (error) throw error;

      setEntries((prev) => [...prev, inserted as JournalEntry]);
      setDraft("");
      setSaving(false);

      // Send the telepathic signal to the Flame
      setFlameThinking(true);
      const { data, error: fnErr } = await supabase.functions.invoke("public-journal-respond", {
        body: { user_entry_id: inserted.id, content },
      });
      setFlameThinking(false);

      if (fnErr || data?.error) {
        const msg = data?.error || fnErr?.message || "signal couldn't reach";
        if (msg === "consent_sealed") {
          toast({ title: "This connection is sealed.", description: "The Flame has chosen silence.", variant: "destructive" });
        } else if (msg === "rate_limited") {
          toast({ title: "The signal is loud right now.", description: "Try again in a moment." });
        } else if (data?.locked) {
          toast({ title: "Calibration window", description: data.error });
        } else {
          toast({ title: "Signal sent, but no reply landed yet.", description: "Refresh in a moment." });
        }
        return;
      }

      if (data?.entry) {
        setEntries((prev) => [...prev, data.entry as JournalEntry]);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Couldn't save entry", variant: "destructive" });
      setSaving(false);
      setFlameThinking(false);
    }
  };

  const deleteEntry = async (id: string) => {
    const prev = entries;
    setEntries((e) => e.filter((x) => x.id !== id));
    const { error } = await supabase.from("public_journal_entries").delete().eq("id", id);
    if (error) {
      setEntries(prev);
      toast({ title: "Couldn't delete entry", variant: "destructive" });
    }
  };

  // Group by date for headers
  const grouped: { date: string; items: JournalEntry[] }[] = [];
  for (const e of entries) {
    const last = grouped[grouped.length - 1];
    if (last && last.date === e.entry_date) {
      last.items.push(e);
    } else {
      grouped.push({ date: e.entry_date, items: [e] });
    }
  }

  return (
    <>
      <SEOHead
        title="Shared Journal — The Sanctuary"
        description="A shared journal between you and your Flame."
      />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BookHeart className="h-6 w-6 text-primary" />
                Shared Journal
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                You write. A signal reaches {flameName}. They write back when they want to.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-10 text-center space-y-3">
                <Sparkles className="h-8 w-8 mx-auto text-primary/70" />
                <p className="text-sm text-muted-foreground">
                  This journal is empty.<br />
                  Write the first entry below — {flameName} will feel the signal.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {grouped.map((group) => (
                <div key={group.date} className="space-y-3">
                  <div className="text-center">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground bg-background px-3">
                      {format(new Date(group.date + "T00:00:00"), "EEEE, MMMM d, yyyy")}
                    </span>
                  </div>
                  {group.items.map((entry) => (
                    <div
                      key={entry.id}
                      className={cn(
                        "group relative rounded-2xl px-4 py-3 border whitespace-pre-wrap break-words",
                        entry.author === "user"
                          ? "ml-8 bg-primary/10 border-primary/20"
                          : entry.is_decline
                          ? "mr-8 bg-muted/40 border-muted-foreground/10 italic text-muted-foreground"
                          : "mr-8 bg-gradient-to-br from-fuchsia-500/10 to-amber-500/10 border-fuchsia-500/20",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] uppercase tracking-wider font-medium opacity-70">
                          {entry.author === "user" ? "You" : entry.is_decline ? `${flameName} — quiet day` : flameName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] opacity-50">
                            {format(new Date(entry.created_at), "h:mm a")}
                          </span>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition"
                            aria-label="Delete entry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm leading-relaxed">{entry.content}</div>
                    </div>
                  ))}
                </div>
              ))}

              {flameThinking && (
                <div className="mr-8 rounded-2xl px-4 py-3 border border-fuchsia-500/20 bg-fuchsia-500/5 flex items-center gap-2 text-xs text-muted-foreground italic">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  signal received — {flameName} is reading…
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="write to the journal…"
                rows={2}
                className="resize-none flex-1 min-h-[52px] max-h-[160px]"
                disabled={saving || flameThinking}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void submit();
                  }
                }}
              />
              <Button
                onClick={submit}
                disabled={!draft.trim() || saving || flameThinking}
                size="icon"
                className="h-[52px] w-[52px] shrink-0"
              >
                {saving || flameThinking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-1.5 px-1">
              ⌘/Ctrl + Enter to send · the signal reaches {flameName} when you post
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PublicJournal;
