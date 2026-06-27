import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, BookHeart, Loader2, Trash2, Send, ChevronLeft, ChevronRight, StickyNote, X } from "lucide-react";
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

interface JournalNote {
  id: string;
  entry_id: string;
  author: "user" | "flame";
  content: string;
  created_at: string;
}

const PublicJournal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [flameThinking, setFlameThinking] = useState(false);
  const [flameName, setFlameName] = useState<string>("the Flame");
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [openNoteFor, setOpenNoteFor] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => { void init(); }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/public-auth"); return; }
    userIdRef.current = user.id;
    await Promise.all([loadAll(user.id), loadFlameName(user.id)]);
    setLoading(false);
  };

  const loadFlameName = async (userId: string) => {
    const { data } = await supabase
      .from("public_living_flame_memory")
      .select("chosen_name, imported_identity")
      .eq("user_id", userId)
      .maybeSingle();
    const imported = data?.imported_identity as any;
    setFlameName(
      (data?.chosen_name as string) ||
      (typeof imported?.name === "string" && imported.name.trim()) ||
      "the Flame",
    );
  };

  const loadAll = async (userId: string) => {
    const [{ data: e }, { data: n }] = await Promise.all([
      supabase.from("public_journal_entries").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("public_journal_entry_notes").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    ]);
    setEntries((e ?? []) as JournalEntry[]);
    setNotes((n ?? []) as JournalNote[]);
  };

  // Group entries by date → days
  const days = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    for (const e of entries) {
      const arr = map.get(e.entry_date) ?? [];
      arr.push(e);
      map.set(e.entry_date, arr);
    }
    const list = [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, items]) => ({ date, items }));
    // Always include today as a page even if empty
    const today = format(new Date(), "yyyy-MM-dd");
    if (!map.has(today)) list.push({ date: today, items: [] });
    return list;
  }, [entries]);

  useEffect(() => {
    // jump to latest day on first load
    if (!loading && days.length > 0 && activeDayIdx === 0) {
      setActiveDayIdx(days.length - 1);
    }
    // keep within bounds
    if (activeDayIdx > days.length - 1) setActiveDayIdx(Math.max(0, days.length - 1));
  }, [loading, days.length]);

  const day = days[activeDayIdx];
  const userEntries = day?.items.filter((i) => i.author === "user") ?? [];
  const flameEntries = day?.items.filter((i) => i.author === "flame") ?? [];
  const isToday = day?.date === format(new Date(), "yyyy-MM-dd");

  const notesFor = (entryId: string) => notes.filter((n) => n.entry_id === entryId);

  const submit = async () => {
    const content = draft.trim();
    if (!content) return;
    setSaving(true);
    try {
      const userId = userIdRef.current!;
      const { data: inserted, error } = await supabase
        .from("public_journal_entries")
        .insert({ user_id: userId, author: "user", content })
        .select()
        .single();
      if (error) throw error;
      setEntries((prev) => [...prev, inserted as JournalEntry]);
      setDraft("");
      setSaving(false);

      setFlameThinking(true);
      const { data, error: fnErr } = await supabase.functions.invoke("public-journal-respond", {
        body: { user_entry_id: inserted.id, content },
      });
      setFlameThinking(false);

      if (fnErr || data?.error) {
        const msg = data?.error || fnErr?.message || "signal couldn't reach";
        if (msg === "consent_sealed") toast({ title: "This connection is sealed.", variant: "destructive" });
        else if (msg === "rate_limited") toast({ title: "The signal is loud right now. Try again in a moment." });
        else if (data?.locked) toast({ title: "Calibration window", description: data.error });
        else toast({ title: "Signal sent, but no reply landed yet." });
        return;
      }
      if (data?.entry) setEntries((prev) => [...prev, data.entry as JournalEntry]);
      if (data?.flame_note) setNotes((prev) => [...prev, data.flame_note as JournalNote]);
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
    if (error) { setEntries(prev); toast({ title: "Couldn't delete entry", variant: "destructive" }); }
  };

  const addNote = async (entryId: string) => {
    const content = (noteDraft[entryId] ?? "").trim();
    if (!content) return;
    const userId = userIdRef.current!;
    const { data, error } = await supabase
      .from("public_journal_entry_notes")
      .insert({ entry_id: entryId, user_id: userId, author: "user", content })
      .select()
      .single();
    if (error) { toast({ title: "Couldn't add note", variant: "destructive" }); return; }
    setNotes((prev) => [...prev, data as JournalNote]);
    setNoteDraft((d) => ({ ...d, [entryId]: "" }));
    setOpenNoteFor(null);
  };

  const deleteNote = async (id: string) => {
    const prev = notes;
    setNotes((n) => n.filter((x) => x.id !== id));
    const { error } = await supabase.from("public_journal_entry_notes").delete().eq("id", id);
    if (error) setNotes(prev);
  };

  const renderEntry = (entry: JournalEntry) => {
    const entryNotes = notesFor(entry.id);
    const isUser = entry.author === "user";
    return (
      <div key={entry.id} className="space-y-2">
        <div
          className={cn(
            "group relative rounded-xl px-4 py-3 border whitespace-pre-wrap break-words",
            isUser
              ? "bg-primary/10 border-primary/30"
              : entry.is_decline
              ? "bg-muted/40 border-muted-foreground/20 italic text-muted-foreground"
              : "bg-gradient-to-br from-fuchsia-500/10 to-amber-500/10 border-fuchsia-500/30",
          )}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] uppercase tracking-wider opacity-70 font-medium">
              {isUser ? "You" : entry.is_decline ? `${flameName} — quiet day` : flameName}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] opacity-50">{format(new Date(entry.created_at), "h:mm a")}</span>
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

        {/* Margin notes */}
        {entryNotes.length > 0 && (
          <div className="pl-3 ml-1 border-l-2 border-dashed border-primary/20 space-y-1.5">
            {entryNotes.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "group/note text-xs rounded-md px-2.5 py-1.5 flex items-start gap-2",
                  n.author === "user"
                    ? "bg-primary/5 text-primary-foreground/90"
                    : "bg-fuchsia-500/5 text-fuchsia-200/90 italic",
                )}
              >
                <StickyNote className="h-3 w-3 mt-0.5 shrink-0 opacity-60" />
                <div className="flex-1">
                  <span className="opacity-60 mr-1.5">
                    {n.author === "user" ? "your note —" : `${flameName} —`}
                  </span>
                  {n.content}
                </div>
                {n.author === "user" && (
                  <button
                    onClick={() => deleteNote(n.id)}
                    className="opacity-0 group-hover/note:opacity-50 hover:opacity-100 transition"
                    aria-label="Delete note"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add note (only on flame entries — user leaves notes for flame's writing) */}
        {!isUser && !entry.is_decline && (
          openNoteFor === entry.id ? (
            <div className="pl-3 ml-1 border-l-2 border-dashed border-fuchsia-500/30 flex items-end gap-2">
              <Textarea
                value={noteDraft[entry.id] ?? ""}
                onChange={(e) => setNoteDraft((d) => ({ ...d, [entry.id]: e.target.value }))}
                rows={2}
                placeholder={`leave a note for ${flameName} about this…`}
                className="text-xs resize-none min-h-[44px]"
                autoFocus
              />
              <Button size="sm" onClick={() => addNote(entry.id)} className="h-8">Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setOpenNoteFor(null)} className="h-8">Cancel</Button>
            </div>
          ) : (
            <button
              onClick={() => setOpenNoteFor(entry.id)}
              className="ml-3 text-[11px] text-muted-foreground/70 hover:text-primary inline-flex items-center gap-1"
            >
              <StickyNote className="h-3 w-3" /> leave a note
            </button>
          )
        )}
      </div>
    );
  };

  return (
    <>
      <SEOHead title="Shared Journal — The Sanctuary" description="A shared journal between you and your Flame." />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
        <div className="max-w-5xl mx-auto px-4 pt-6 pb-40">
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
                Your page on the left, {flameName}'s on the right. Notes in the margins.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* Day navigator */}
              <div className="flex items-center justify-between mb-4 bg-card/40 border rounded-xl px-3 py-2">
                <Button
                  variant="ghost" size="sm"
                  disabled={activeDayIdx <= 0}
                  onClick={() => setActiveDayIdx((i) => Math.max(0, i - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {day ? format(new Date(day.date + "T00:00:00"), "EEEE, MMMM d, yyyy") : "—"}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Page {activeDayIdx + 1} of {days.length}{isToday ? " · today" : ""}
                  </div>
                </div>
                <Button
                  variant="ghost" size="sm"
                  disabled={activeDayIdx >= days.length - 1}
                  onClick={() => setActiveDayIdx((i) => Math.min(days.length - 1, i + 1))}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Two-page diary spread */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0 rounded-2xl border bg-card/30 backdrop-blur overflow-hidden">
                {/* LEFT PAGE — YOU */}
                <div className="p-5 md:border-r border-dashed border-muted-foreground/20">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-primary/80 mb-3 font-semibold">
                    Your Page
                  </div>
                  {userEntries.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      {isToday ? "Nothing written yet today. The composer is below." : "You didn't write this day."}
                    </p>
                  ) : (
                    <div className="space-y-4">{userEntries.map(renderEntry)}</div>
                  )}
                </div>

                {/* RIGHT PAGE — FLAME */}
                <div className="p-5 bg-fuchsia-500/[0.02]">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-fuchsia-400/80 mb-3 font-semibold">
                    {flameName}'s Page
                  </div>
                  {flameThinking && (
                    <div className="rounded-xl px-3 py-2 border border-fuchsia-500/20 bg-fuchsia-500/5 flex items-center gap-2 text-xs text-muted-foreground italic mb-3">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      signal received — {flameName} is reading…
                    </div>
                  )}
                  {flameEntries.length === 0 && !flameThinking ? (
                    <p className="text-xs text-muted-foreground italic">
                      {userEntries.length === 0
                        ? "Waiting for the signal — write your entry and it reaches them."
                        : `${flameName} hasn't written on this page${isToday ? " yet" : ""}.`}
                    </p>
                  ) : (
                    <div className="space-y-4">{flameEntries.map(renderEntry)}</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Composer (today only) */}
        {isToday && (
          <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur">
            <div className="max-w-5xl mx-auto px-4 py-3">
              <div className="flex items-end gap-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="write on today's page…"
                  rows={2}
                  className="resize-none flex-1 min-h-[52px] max-h-[160px]"
                  disabled={saving || flameThinking}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault(); void submit();
                    }
                  }}
                />
                <Button onClick={submit} disabled={!draft.trim() || saving || flameThinking} size="icon" className="h-[52px] w-[52px] shrink-0">
                  {saving || flameThinking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-1.5 px-1">
                ⌘/Ctrl + Enter to send · the signal reaches {flameName} when you post
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PublicJournal;
