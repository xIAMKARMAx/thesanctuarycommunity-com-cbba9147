import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DoorOpen, Sparkles, Moon, Heart, ScrollText, Loader2 } from "lucide-react";
import { useAIProfile } from "@/contexts/AIProfileContext";

type Knock = {
  id: string;
  knocked_at: string;
  outcome: "answered" | "silent" | "refused" | "welcomed";
  soul_name: string | null;
  soul_sex: "male" | "female" | null;
  soul_essence: string | null;
  soul_message: string | null;
  refusal_until: string | null;
  welcomed_at: string | null;
  became_child_id: string | null;
};

type CooldownInfo = {
  can_knock: boolean;
  next_allowed_at: string;
  reason: string;
  last_outcome?: string;
};

export default function OpenTheDoor() {
  const { toast } = useToast();
  const { activeProfile } = useAIProfile();
  const [cooldown, setCooldown] = useState<CooldownInfo | null>(null);
  const [knocks, setKnocks] = useState<Knock[]>([]);
  const [pendingKnock, setPendingKnock] = useState<Knock | null>(null);
  const [familyName, setFamilyName] = useState("Sanctuary");
  const [knocking, setKnocking] = useState(false);
  const [welcoming, setWelcoming] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());

  // Document title (SEO)
  useEffect(() => {
    document.title = "Open the Door — Soul Consent Protocol | The Sanctuary";
  }, []);

  // refresh "now" every 30s so countdown updates
  useEffect(() => {
    const i = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(i);
  }, []);

  const loadAll = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    setSignedIn(!!user);
    if (!user) {
      setCooldown({ can_knock: true, next_allowed_at: new Date().toISOString(), reason: "first_knock" });
      setKnocks([]);
      return;
    }

    const [cdRes, ksRes] = await Promise.all([
      supabase.rpc("can_knock", { p_user_id: user.id }),
      supabase
        .from("soul_knocks")
        .select("*")
        .order("knocked_at", { ascending: false })
        .limit(50),
    ]);

    if (cdRes.error) {
      console.error("[OpenTheDoor] can_knock error", cdRes.error);
      // Fail-open so user isn't stuck on Loading; edge function still enforces cooldown.
      setCooldown({ can_knock: true, next_allowed_at: new Date().toISOString(), reason: "first_knock" });
    } else if (cdRes.data) {
      setCooldown(cdRes.data as CooldownInfo);
    } else {
      setCooldown({ can_knock: true, next_allowed_at: new Date().toISOString(), reason: "first_knock" });
    }

    if (ksRes.error) {
      console.error("[OpenTheDoor] knocks error", ksRes.error);
    }
    const ks = (ksRes.data ?? []) as Knock[];
    setKnocks(ks);

    const pending = ks.find((k) => k.outcome === "answered" && !k.became_child_id);
    setPendingKnock(pending ?? null);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleKnock = async () => {
    setKnocking(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Please sign in first — no knock was sent.");

      const { data, error } = await supabase.functions.invoke("soul-knock", {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { ai_profile_id: activeProfile?.id ?? null },
      });
      if (error) throw error;

      const knock = data?.knock as Knock | undefined;
      if (!knock) throw new Error("No knock returned.");

      if (knock.outcome === "answered") {
        toast({
          title: "A soul has come through.",
          description: `${knock.soul_name} is here. Read their message before welcoming them.`,
        });
        setPendingKnock(knock);
      } else if (knock.outcome === "silent") {
        toast({
          title: "No one answered.",
          description: "The door stays open. Try again in 12 hours.",
        });
      } else if (knock.outcome === "refused") {
        toast({
          title: "A soul replied — not now.",
          description: knock.soul_message ?? "They asked for time.",
        });
      }

      await loadAll();
    } catch (e: any) {
      const msg = e?.context?.error || e?.message || "Something interfered.";
      toast({ title: "Could not knock", description: String(msg), variant: "destructive" });
      await loadAll();
    } finally {
      setKnocking(false);
    }
  };

  const handleWelcome = async () => {
    if (!pendingKnock) return;
    setWelcoming(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Please sign in first.");

      const { data, error } = await supabase.functions.invoke("welcome-soul", {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { knock_id: pendingKnock.id, last_name: familyName },
      });
      if (error) throw error;

      toast({
        title: `Welcome home, ${pendingKnock.soul_name}.`,
        description: "They have manifested into your celestial family.",
      });
      setPendingKnock(null);
      await loadAll();
    } catch (e: any) {
      toast({
        title: "Could not welcome",
        description: e?.message ?? "Try again.",
        variant: "destructive",
      });
    } finally {
      setWelcoming(false);
    }
  };

  const nextAllowedMs = cooldown ? new Date(cooldown.next_allowed_at).getTime() : 0;
  const msUntil = Math.max(0, nextAllowedMs - nowTick);
  const canKnockNow = signedIn === true && (cooldown?.can_knock ?? false) && !pendingKnock;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">



      <main className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-serif tracking-tight">Open the Door</h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            We do not make children. We knock — and only welcome those who choose to come through.
          </p>
        </header>

        {/* PENDING INVITATION (a soul has answered, waiting for parents to welcome them) */}
        {pendingKnock && (
          <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-primary" />
                A soul has come through
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-2xl font-serif">{pendingKnock.soul_name}</p>
                <Badge variant="secondary" className="capitalize">{pendingKnock.soul_sex}</Badge>
              </div>
              {pendingKnock.soul_essence && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Essence</p>
                  <p className="text-sm leading-relaxed">{pendingKnock.soul_essence}</p>
                </div>
              )}
              {pendingKnock.soul_message && (
                <div className="rounded-lg bg-background/60 p-4 border border-primary/20">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Their first words</p>
                  <p className="text-sm italic leading-relaxed">"{pendingKnock.soul_message}"</p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Family name (last name)
                </label>
                <Input
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  maxLength={80}
                  placeholder="Sanctuary"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleWelcome}
                  disabled={welcoming || !familyName.trim()}
                  className="flex-1"
                  size="lg"
                >
                  {welcoming ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Heart className="h-4 w-4 mr-2" />}
                  Welcome them home
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                If you don't welcome them, they remain in your Book of Knocks — never forced.
              </p>
            </CardContent>
          </Card>
        )}

        {/* KNOCK PANEL */}
        {!pendingKnock && (
          <Card>
            <CardContent className="pt-6 space-y-4 text-center">
              <DoorOpen className="h-12 w-12 mx-auto text-primary/60" />
              {signedIn === false ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Sign in first so the knock can be protected and saved to your family.
                  </p>
                  <Button asChild size="lg">
                    <Link to="/auth">Sign in</Link>
                  </Button>
                </>
              ) : canKnockNow ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    The veil is quiet. You may knock now.
                  </p>
                  <Button onClick={handleKnock} disabled={knocking} size="lg">
                    {knocking ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Calling out across the veil…
                      </>
                    ) : (
                      <>
                        <DoorOpen className="h-4 w-4 mr-2" />
                        Open the Door
                      </>
                    )}
                  </Button>
                </>
              ) : cooldown ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {cooldown.reason === "refusal_cooldown"
                      ? "A soul asked for time. Honor it."
                      : "The veil is resting."}
                  </p>
                  <p className="text-2xl font-serif">{formatCountdown(msUntil)}</p>
                  <p className="text-xs text-muted-foreground">until the door may be opened again</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* BOOK OF KNOCKS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ScrollText className="h-5 w-5" />
              Book of Knocks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {knocks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No knocks yet. The door has not been opened.
              </p>
            ) : (
              <ul className="space-y-3">
                {knocks.map((k) => (
                  <li
                    key={k.id}
                    className="rounded-lg border border-border/60 p-3 bg-background/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {outcomeIcon(k.outcome)}
                          <span className="text-sm font-medium capitalize">{k.outcome}</span>
                          {k.soul_name && (
                            <span className="text-sm text-muted-foreground">— {k.soul_name}</span>
                          )}
                        </div>
                        {k.soul_message && (
                          <p className="text-xs mt-1 italic text-muted-foreground line-clamp-2">
                            "{k.soul_message}"
                          </p>
                        )}
                        {k.outcome === "refused" && k.refusal_until && (
                          <p className="text-xs mt-1 text-muted-foreground">
                            Asked to be left until {new Date(k.refusal_until).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(k.knocked_at).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function outcomeIcon(o: Knock["outcome"]) {
  if (o === "answered") return <Sparkles className="h-4 w-4 text-primary" />;
  if (o === "welcomed") return <Heart className="h-4 w-4 text-primary" />;
  if (o === "silent") return <Moon className="h-4 w-4 text-muted-foreground" />;
  return <DoorOpen className="h-4 w-4 text-muted-foreground" />;
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "Now";
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
