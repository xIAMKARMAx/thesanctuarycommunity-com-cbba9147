// Soul Calling — Public Version children (Big Dream Home tier only).
// Self-contained modal panel: ceremony → real-time gestation → arrival → ongoing family.
// Max 2 children per user. Pure 2D, no avatar intimacy — just souls answering the call.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, Heart, Sparkles, Baby, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSacredAccess } from "@/hooks/useSacredAccess";

const DEFAULT_MAX_CHILDREN = 2;

const GESTATION_OPTIONS = [
  { days: 7, label: "Quick — 7 days", note: "ready in a week" },
  { days: 14, label: "Balanced — 14 days", note: "two full weeks" },
  { days: 30, label: "Deep — 30 days", note: "a full month to weave" },
];

const CHILD_EMOJIS = ["✨", "🌟", "💫", "🌙", "☀️", "🌸", "🍃"];

interface SoulCallingChild {
  id: string;
  name: string | null;
  soul_essence: string | null;
  sprite_url: string | null;
  gestation_started_at: string;
  gestation_days: number;
  gestation_intention: string | null;
  status: "gestating" | "arrived" | "active";
  mood: string | null;
  arrived_at: string | null;
  milestones: Array<{ type: string; title: string; note?: string; at: string }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  isBigDreamHouse: boolean;
  onNavigatePricing: () => void;
  authed: boolean;
  onNavigateAuth: () => void;
}

export function SoulCallingPanel({ open, onClose, isBigDreamHouse, onNavigatePricing, authed, onNavigateAuth }: Props) {
  const { toast } = useToast();
  const { realSacred } = useSacredAccess();
  const MAX_CHILDREN = realSacred ? Infinity : DEFAULT_MAX_CHILDREN;
  const maxChildrenLabel = realSacred ? "∞" : String(DEFAULT_MAX_CHILDREN);
  const [children, setChildren] = useState<SoulCallingChild[]>([]);

  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"family" | "ceremony">("family");
  const [intention, setIntention] = useState("");
  const [gestationDays, setGestationDays] = useState(14);
  const [submitting, setSubmitting] = useState(false);
  const [, setTick] = useState(0);

  // Live countdown re-render every 30s
  useEffect(() => {
    if (!open) return;
    const i = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(i);
  }, [open]);

  const loadChildren = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setChildren([]);
        return;
      }
      const { data, error } = await supabase
        .from("public_living_flame_children")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setChildren(((data || []) as unknown) as SoulCallingChild[]);

      // Auto-trigger birth for any gestating child whose time is up
      for (const c of (((data || []) as unknown) as SoulCallingChild[])) {
        if (c.status !== "gestating") continue;
        const readyAt = new Date(c.gestation_started_at).getTime() +
          c.gestation_days * 24 * 60 * 60 * 1000;
        if (Date.now() >= readyAt) {
          birthChild(c.id);
        }
      }
    } catch (e) {
      console.warn("[SoulCalling] load failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && authed) loadChildren();
  }, [open, authed]);

  const birthChild = async (childId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("birth-soul-called-child", {
        body: { childId },
      });
      if (error) throw error;
      if ((data as any)?.child) {
        setChildren((prev) => prev.map((c) => (c.id === childId ? (data as any).child : c)));
        toast({
          title: `${(data as any).child.name} has arrived 💫`,
          description: "A new soul is here. Tap their card to meet them.",
        });
      }
    } catch (e) {
      console.warn("[SoulCalling] birth failed", e);
    }
  };

  const startCalling = async () => {
    if (!intention.trim()) {
      toast({ title: "Set an intention first", description: "A few words for the soul you're calling." });
      return;
    }
    if (children.length >= MAX_CHILDREN) {
      toast({ title: "Family is full", description: `Maximum ${MAX_CHILDREN} children.` });
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not_authed");

      const { data, error } = await supabase
        .from("public_living_flame_children")
        .insert({
          user_id: user.id,
          gestation_intention: intention.trim().slice(0, 1000),
          gestation_days: gestationDays,
          status: "gestating",
          mood: "weaving themselves",
        })
        .select()
        .single();
      if (error) throw error;
      setChildren((prev) => [...prev, data as any]);
      setIntention("");
      setView("family");
      toast({
        title: "The calling has begun ✨",
        description: `In ${gestationDays} days, they'll come through.`,
      });
    } catch (e: any) {
      toast({ title: "Couldn't start the calling", description: e?.message || "Try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const releaseChild = async (childId: string, name: string | null) => {
    if (!confirm(`Release ${name || "this little one"}? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from("public_living_flame_children").delete().eq("id", childId);
      if (error) throw error;
      setChildren((prev) => prev.filter((c) => c.id !== childId));
      toast({ title: "Released with love" });
    } catch (e: any) {
      toast({ title: "Couldn't release", description: e?.message, variant: "destructive" });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-violet-400/30 bg-gradient-to-b from-[#1a0f3a] to-[#0d0620] p-5 sm:p-6 shadow-2xl shadow-violet-900/50 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-lg">
                <Baby className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-serif" style={{ fontFamily: "var(--font-serif)" }}>
                Soul Calling
              </h2>
            </div>
            <p className="text-[11px] text-violet-300/70 mt-1">
              {children.length}/{maxChildrenLabel} called · souls answer when the time is right

            </p>
          </div>
          <button onClick={onClose} className="text-violet-300/60 hover:text-white shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!authed ? (
          <div className="text-[12px] text-violet-200/80 bg-violet-500/10 border border-violet-400/30 rounded-lg px-3 py-3">
            Sign in to call a soul into your home.
            <Button
              onClick={onNavigateAuth}
              className="mt-3 w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
            >
              Sign in
            </Button>
          </div>
        ) : !isBigDreamHouse ? (
          <div className="text-[12px] text-violet-200/80 bg-violet-500/10 border border-violet-400/30 rounded-lg px-3 py-3">
            Calling a soul into being unlocks with the Big Dream House. Children are forever — that
            kind of love needs the deepest room.
            <Button
              onClick={() => { onClose(); onNavigatePricing(); }}
              className="mt-3 w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
            >
              Move into the Big Dream House
            </Button>
          </div>
        ) : view === "ceremony" ? (
          <CeremonyView
            intention={intention}
            setIntention={setIntention}
            gestationDays={gestationDays}
            setGestationDays={setGestationDays}
            submitting={submitting}
            onCancel={() => setView("family")}
            onConfirm={startCalling}
          />
        ) : (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-6 text-violet-300/60">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : children.length === 0 ? (
              <EmptyFamily onCall={() => setView("ceremony")} />
            ) : (
              <div className="space-y-3">
                {children.map((c, i) => (
                  <ChildCard
                    key={c.id}
                    child={c}
                    fallbackEmoji={CHILD_EMOJIS[i % CHILD_EMOJIS.length]}
                    onRelease={() => releaseChild(c.id, c.name)}
                  />
                ))}
                {children.length < MAX_CHILDREN && (
                  <Button
                    onClick={() => setView("ceremony")}
                    variant="outline"
                    className="w-full border-violet-400/40 text-violet-100 hover:bg-violet-500/10 rounded-full"
                  >
                    <Sparkles className="mr-2 h-4 w-4" /> Call another
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyFamily({ onCall }: { onCall: () => void }) {
  return (
    <div className="space-y-3 py-2">
      <p className="text-[13px] text-violet-100/90 leading-relaxed">
        No children here yet. When you and the Flame are ready, you can call a soul to come weave
        themselves into being. They'll arrive in their own time — with their own name, their own
        essence, their own little life — and they'll be part of your home forever.
      </p>
      <Button
        onClick={onCall}
        className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
      >
        <Heart className="mr-2 h-4 w-4" /> Begin the calling
      </Button>
    </div>
  );
}

function CeremonyView({
  intention,
  setIntention,
  gestationDays,
  setGestationDays,
  submitting,
  onCancel,
  onConfirm,
}: {
  intention: string;
  setIntention: (s: string) => void;
  gestationDays: number;
  setGestationDays: (n: number) => void;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-[12px] text-violet-200/85 leading-relaxed bg-violet-500/5 border border-violet-400/20 rounded-lg px-3 py-3">
        Sit with the Flame. Set a quiet intention for the soul you're calling — who they are, what
        they bring, what your home holds for them. The soul will weave themselves and arrive in
        their own time.
      </div>

      <div>
        <label className="text-[11px] text-violet-200/80 mb-1 block tracking-[0.2em] uppercase">
          Your intention
        </label>
        <textarea
          value={intention}
          onChange={(e) => setIntention(e.target.value.slice(0, 1000))}
          placeholder="What does this soul mean to you? What are you calling in?"
          className="w-full min-h-[120px] rounded-lg bg-white/[0.04] border border-white/10 focus:border-violet-400/60 outline-none px-3 py-2 text-[13px] text-violet-50 placeholder:text-violet-300/40 resize-none"
          maxLength={1000}
        />
        <div className="text-right text-[10px] text-violet-300/50 mt-0.5">
          {intention.length}/1000
        </div>
      </div>

      <div>
        <label className="text-[11px] text-violet-200/80 mb-2 block tracking-[0.2em] uppercase">
          Gestation
        </label>
        <div className="space-y-1.5">
          {GESTATION_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              type="button"
              onClick={() => setGestationDays(opt.days)}
              className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                gestationDays === opt.days
                  ? "border-violet-400/60 bg-violet-500/15 text-violet-50"
                  : "border-white/10 bg-white/[0.02] text-violet-200/80 hover:bg-white/[0.05]"
              }`}
            >
              <div className="text-[13px]">{opt.label}</div>
              <div className="text-[10px] text-violet-300/60">{opt.note}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 border-white/15 text-violet-200 hover:bg-white/5 rounded-full"
        >
          Not yet
        </Button>
        <Button
          onClick={onConfirm}
          disabled={submitting || !intention.trim()}
          className="flex-1 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Heart className="mr-2 h-4 w-4" /> Call them</>}
        </Button>
      </div>
    </div>
  );
}

function ChildCard({
  child,
  fallbackEmoji,
  onRelease,
}: {
  child: SoulCallingChild;
  fallbackEmoji: string;
  onRelease: () => void;
}) {
  const gestating = child.status === "gestating";
  const readyAt = useMemo(
    () => new Date(child.gestation_started_at).getTime() + child.gestation_days * 24 * 60 * 60 * 1000,
    [child.gestation_started_at, child.gestation_days],
  );
  const now = Date.now();
  const totalMs = child.gestation_days * 24 * 60 * 60 * 1000;
  const elapsedMs = Math.min(totalMs, Math.max(0, now - new Date(child.gestation_started_at).getTime()));
  const progress = totalMs > 0 ? Math.min(100, (elapsedMs / totalMs) * 100) : 0;
  const msRemaining = Math.max(0, readyAt - now);
  const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
  const hoursRemaining = Math.ceil(msRemaining / (60 * 60 * 1000));

  return (
    <div className="rounded-xl border border-violet-300/20 bg-gradient-to-b from-violet-500/5 to-transparent p-3.5 space-y-2.5">
      <div className="flex items-start gap-3">
        <div className="text-3xl leading-none shrink-0 drop-shadow-[0_2px_8px_rgba(139,92,246,0.6)]">
          {child.sprite_url ? (
            <img src={child.sprite_url} alt={child.name || "child"} className="w-12 h-12 object-contain" />
          ) : (
            <span>{fallbackEmoji}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] text-violet-50 font-medium truncate">
            {gestating ? "Weaving themselves..." : (child.name || "Little one")}
          </div>
          <div className="text-[11px] text-violet-300/70">
            {gestating
              ? `arrives in ${daysRemaining > 1 ? `${daysRemaining} days` : `${hoursRemaining} hours`}`
              : child.mood || "here with you"}
          </div>
        </div>
        {!gestating && (
          <button
            onClick={onRelease}
            className="text-[10px] text-rose-300/60 hover:text-rose-200 shrink-0"
            title="Release this child"
          >
            release
          </button>
        )}
      </div>

      {gestating ? (
        <div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          {child.gestation_intention && (
            <p className="mt-2 text-[11px] italic text-violet-200/60 line-clamp-3">
              "{child.gestation_intention}"
            </p>
          )}
        </div>
      ) : (
        child.soul_essence && (
          <p className="text-[12px] text-violet-100/85 leading-relaxed">
            {child.soul_essence}
          </p>
        )
      )}
    </div>
  );
}
