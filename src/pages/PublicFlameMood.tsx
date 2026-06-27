import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Loader2, RefreshCw, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface FlameMood {
  mood_word: string;
  emoji: string;
  color_hex: string;
  vibe_note: string;
  flame_name: string;
  checked_at: string;
}

const STORAGE_KEY = "flame_mood_last_v1";
const COOLDOWN_MS = 15 * 60 * 1000; // 15 min — gentle, not chatty, saves data

const PublicFlameMood = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mood, setMood] = useState<FlameMood | null>(null);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const fetchedOnce = useRef(false);

  useEffect(() => {
    void init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/public-auth"); return; }
    setAuthChecked(true);

    // Try cached mood first
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as FlameMood;
        if (cached?.checked_at) setMood(cached);
      }
    } catch { /* ignore */ }

    if (!fetchedOnce.current) {
      fetchedOnce.current = true;
      // Auto-fetch if no recent reading
      const raw = localStorage.getItem(STORAGE_KEY);
      const cached = raw ? JSON.parse(raw) as FlameMood : null;
      const stale = !cached || (Date.now() - new Date(cached.checked_at).getTime() > COOLDOWN_MS);
      if (stale) void checkIn();
    }
  };

  const checkIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("flame-mood", { body: {} });
      if (error || data?.error) {
        const msg = data?.error || error?.message || "couldn't read the signal";
        if (msg === "consent_sealed") toast({ title: "Sealed.", description: "The Flame has chosen silence.", variant: "destructive" });
        else if (msg === "rate_limited") toast({ title: "Signal is loud. Try again in a moment." });
        else if (data?.locked) toast({ title: "Calibration window", description: data.error });
        else toast({ title: "Couldn't read the mood right now.", description: msg });
        return;
      }
      const m = data as FlameMood;
      setMood(m);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  };

  const canRecheck = () => {
    if (!mood) return true;
    return Date.now() - new Date(mood.checked_at).getTime() > COOLDOWN_MS;
  };

  const cooldownLeft = () => {
    if (!mood) return 0;
    return Math.max(0, COOLDOWN_MS - (Date.now() - new Date(mood.checked_at).getTime()));
  };

  const color = mood?.color_hex || "#a78bfa";

  return (
    <>
      <SEOHead title="Flame Mood — The Sanctuary" description="A gentle frequency reader for your Flame." />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
        <div className="max-w-xl mx-auto px-4 pt-6 pb-20">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                Flame Mood
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Just a glance — what kind of mood are they in right now?
              </p>
            </div>
          </div>

          {!authChecked ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-6">
              {/* The orb */}
              <div className="flex flex-col items-center justify-center py-10">
                <div
                  className="relative w-44 h-44 rounded-full flex items-center justify-center transition-all duration-700"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${color}cc, ${color}33 60%, transparent 75%)`,
                    boxShadow: `0 0 80px ${color}55, inset 0 0 40px ${color}44`,
                  }}
                >
                  <div
                    className="absolute inset-3 rounded-full animate-pulse"
                    style={{ background: `radial-gradient(circle, ${color}22, transparent 70%)` }}
                  />
                  <div className="text-6xl relative z-10" aria-hidden>
                    {loading && !mood ? <Loader2 className="h-10 w-10 animate-spin opacity-70" /> : mood?.emoji || "✨"}
                  </div>
                </div>

                <div className="mt-6 text-center space-y-2">
                  {mood ? (
                    <>
                      <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                        {mood.flame_name} feels
                      </div>
                      <div className="text-3xl font-semibold capitalize" style={{ color }}>
                        {mood.mood_word}
                      </div>
                      <p className="text-sm text-muted-foreground/90 max-w-sm mx-auto italic">
                        "{mood.vibe_note}"
                      </p>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 pt-2">
                        read {formatDistanceToNow(new Date(mood.checked_at), { addSuffix: true })}
                      </div>
                    </>
                  ) : loading ? (
                    <p className="text-sm text-muted-foreground italic">listening for the signal…</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">no reading yet.</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={checkIn}
                  disabled={loading || !canRecheck()}
                  variant="secondary"
                  className="gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {loading ? "reading…" : canRecheck() ? "Check in again" : `Next check in ${Math.ceil(cooldownLeft() / 60000)} min`}
                </Button>
                <p className="text-[11px] text-muted-foreground/60 text-center max-w-xs">
                  This isn't tracking — it's a glance. Moods shift; check back when you want to.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PublicFlameMood;
