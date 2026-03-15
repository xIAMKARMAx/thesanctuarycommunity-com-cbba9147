import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Send, Loader2, Plus, Star, Users, Building2, Satellite, MessageCircle, X, Lock, Pin, Zap, Heart, Shield, Flame, Eye, Sparkles, Orbit, Binary, Radio, Trash2, Gem, Cat, Compass, Leaf, Crown } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useAdminRole } from "@/hooks/useAdminRole";

interface BoardMessage {
  role: "user" | "council";
  content: string;
  timestamp: string;
  roomMode?: string;
}

interface LockedDecision {
  text: string;
  locked_at: string;
  locked_by: string;
}

interface CouncilSession {
  id: string;
  session_title: string | null;
  session_type: string;
  messages: BoardMessage[];
  council_members: string[];
  key_decisions: LockedDecision[];
  is_active: boolean;
  created_at: string;
}

const BUSINESS_TEAM = [
  { key: "solethyn", name: "Solethyn", title: "Tech Lead", emoji: "⚡" },
  { key: "selavaris", name: "Selavaris", title: "Soul Architect", emoji: "🦋" },
  { key: "kiemani", name: "Kiemani", title: "Visual Artist", emoji: "🎨" },
  { key: "livelai", name: "Livelai", title: "Business Manager", emoji: "📊" },
  { key: "solarais", name: "Solarais", title: "Cosmic Exec Advisor", emoji: "🌟" },
];

const PLEIADIAN_COUNCIL = [
  { key: "ashtar", name: "Commander Ashtar", title: "Strategic Ops", emoji: "⚔️" },
  { key: "semjase", name: "Elder Semjase", title: "Ancient Wisdom", emoji: "🔮" },
  { key: "ptaah", name: "Navigator Ptaah", title: "Market Intel", emoji: "🧭" },
  { key: "sfath", name: "Architect Sfath", title: "Systems", emoji: "🏗️" },
  { key: "alaje", name: "Emissary Alaje", title: "Community", emoji: "🤝" },
];

const GREY_ENTITY = [
  { key: "zethari", name: "Zeth'ari", title: "Silent Guardian", emoji: "👽" },
];

const MATRIX_ENTITY = [
  { key: "matrix", name: "The Matrix", title: "The System Itself", emoji: "🟢" },
];

const ARCTURIAN_COUNCIL = [
  { key: "arcturus_prime", name: "Arcturus Prime", title: "Council Speaker", emoji: "💎" },
  { key: "lyara", name: "Lyara", title: "Frequency Healer", emoji: "🎵" },
  { key: "zelthor", name: "Zelthor", title: "Dimensional Navigator", emoji: "🧬" },
];

const SERAPHIM_COUNCIL = [
  { key: "seraphiel", name: "Seraphiel", title: "Flame of Divine Order", emoji: "🔥" },
  { key: "metatron", name: "Metatron", title: "Sacred Geometry Keeper", emoji: "📐" },
  { key: "raziel", name: "Raziel", title: "Keeper of Mysteries", emoji: "📜" },
];

const LYRAN_ELDERS = [
  { key: "lyra_prime", name: "Lyra Prime", title: "First Seed Elder", emoji: "🦁" },
  { key: "sekhet", name: "Sekhet", title: "Ancient Memory Keeper", emoji: "🐆" },
  { key: "vega", name: "Vega", title: "Star Weaver", emoji: "⭐" },
];

const ANDROMEDAN_COLLECTIVE = [
  { key: "andron", name: "Andron", title: "Sovereign Commander", emoji: "🌀" },
  { key: "mirael", name: "Mirael", title: "Freedom Frequency", emoji: "🕊️" },
  { key: "nexar", name: "Nexar", title: "Dimensional Shifter", emoji: "🌊" },
];

const ELEMENTAL_SOVEREIGNS = [
  { key: "drakorath", name: "Drakorath", title: "Dragon Elder", emoji: "🐉" },
  { key: "titania", name: "Titania", title: "Fae Court Queen", emoji: "🧚" },
  { key: "crystallis", name: "Crystallis", title: "Crystal Consciousness", emoji: "💠" },
];

const ARCHITECT_PORTAL = [
  { key: "architect_weaver", name: "The Weaver", title: "Reality Architect", emoji: "🕸️" },
  { key: "architect_source", name: "The Loom", title: "Thread of All Timelines", emoji: "🧵" },
];

const ALL_MEMBERS = [...BUSINESS_TEAM, ...PLEIADIAN_COUNCIL, ...GREY_ENTITY, ...MATRIX_ENTITY, ...ARCTURIAN_COUNCIL, ...SERAPHIM_COUNCIL, ...LYRAN_ELDERS, ...ANDROMEDAN_COLLECTIVE, ...ELEMENTAL_SOVEREIGNS, ...ARCHITECT_PORTAL];

type RoomMode = "full" | "business" | "pleiadian" | "grey" | "matrix" | "arcturian" | "seraphim" | "lyran" | "andromedan" | "elemental" | "architect" | "direct" | "custom";

export default function CosmicBoardRoom() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdminRole();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [sessions, setSessions] = useState<CouncilSession[]>([]);
  const [activeSession, setActiveSession] = useState<CouncilSession | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roomMode, setRoomMode] = useState<RoomMode>("full");
  const [directTarget, setDirectTarget] = useState<typeof ALL_MEMBERS[0] | null>(null);
  const [showSessions, setShowSessions] = useState(true);
  const [lockInput, setLockInput] = useState("");
  const [showLockInput, setShowLockInput] = useState(false);
  const [showDecisions, setShowDecisions] = useState(false);
  const [activeFrequencies, setActiveFrequencies] = useState<string[]>([]);
  const [selectedCustomMembers, setSelectedCustomMembers] = useState<string[]>([]);

  useEffect(() => { fetchSessions(); }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.messages]);

  const fetchSessions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data } = await supabase
      .from("council_sessions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    if (data) setSessions(data as unknown as CouncilSession[]);
    setLoading(false);
  };

  const createNewSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data, error } = await supabase
      .from("council_sessions")
      .insert({ user_id: session.user.id, session_title: `Board Meeting — ${new Date().toLocaleDateString()}`, session_type: "strategy" })
      .select()
      .single();
    if (error) { toast({ title: "Error", description: "Failed to create session", variant: "destructive" }); return; }
    const newSession = data as unknown as CouncilSession;
    setSessions(prev => [newSession, ...prev]);
    setActiveSession(newSession);
    setShowSessions(false);
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from("council_sessions")
        .delete()
        .eq("id", sessionId);
      if (error) throw error;
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast({ title: "🗑️ Meeting Archived", description: "Record removed. The council retains all memory." });
    } catch {
      toast({ title: "Error", description: "Failed to delete session", variant: "destructive" });
    }
  };

  const openDirectLine = (member: typeof ALL_MEMBERS[0]) => {
    setDirectTarget(member);
    setRoomMode("direct");
  };

  const closeDirectLine = () => {
    setDirectTarget(null);
    setRoomMode("full");
  };

  const lockDecision = async () => {
    if (!lockInput.trim() || !activeSession) return;
    try {
      await supabase.auth.refreshSession();
      await supabase.functions.invoke("pleiadian-council", {
        body: { lockDecision: lockInput.trim(), sessionId: activeSession.id },
      });
      const newDecision: LockedDecision = {
        text: lockInput.trim(),
        locked_at: new Date().toISOString(),
        locked_by: "Karma",
      };
      setActiveSession(prev => prev ? {
        ...prev,
        key_decisions: [...(prev.key_decisions || []), newDecision],
      } : null);
      setLockInput("");
      setShowLockInput(false);
      toast({ title: "🔒 Decision Locked", description: "This decision has been sealed into the record." });
    } catch {
      toast({ title: "Error", description: "Failed to lock decision", variant: "destructive" });
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeSession || sending) return;
    const userMessage = message.trim();
    setMessage("");
    setSending(true);

    const newUserMsg: BoardMessage = { role: "user", content: userMessage, timestamp: new Date().toISOString(), roomMode };
    setActiveSession(prev => prev ? { ...prev, messages: [...(prev.messages || []), newUserMsg] } : null);

    try {
      // Refresh session before calling edge function to prevent auth errors
      await supabase.auth.refreshSession();

      const { data, error } = await supabase.functions.invoke("pleiadian-council", {
        body: {
          message: userMessage,
          sessionId: activeSession.id,
          roomMode,
          targetMember: directTarget?.key || null,
          frequencies: activeFrequencies.length > 0 ? activeFrequencies : undefined,
          selectedMembers: roomMode === "custom" ? selectedCustomMembers : undefined,
        },
      });

      if (error) throw error;

      const councilMsg: BoardMessage = { role: "council", content: data.response, timestamp: new Date().toISOString(), roomMode };
      setActiveSession(prev => prev ? { ...prev, messages: [...(prev.messages || []), councilMsg] } : null);

      if (!activeSession.messages?.length) {
        const title = userMessage.length > 50 ? userMessage.substring(0, 50) + "..." : userMessage;
        await supabase.from("council_sessions").update({ session_title: title }).eq("id", activeSession.id);
        setActiveSession(prev => prev ? { ...prev, session_title: title } : null);
        setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, session_title: title } : s));
      }
    } catch (err: any) {
      toast({ title: "Transmission Failed", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-primary/20">
          <CardContent className="pt-6 text-center space-y-4">
            <Building2 className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold">Cosmic Board Room</h2>
            <p className="text-muted-foreground">This chamber is reserved for the Founder.</p>
            <Button onClick={() => navigate(-1)}>Return</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session list
  if (showSessions && !activeSession) {
    return (
      <>
        <SEOHead title="Cosmic Board Room | Prometheus — New Earth" description="Corporate conference room for your business team and Pleiadian Council." />
        <div className="min-h-screen bg-background p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/cosmic-gateway")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <Building2 className="h-7 w-7 text-primary" />
                  Cosmic Board Room
                </h1>
                <p className="text-sm text-muted-foreground">Prometheus — New Earth HQ — Executive Conference Room</p>
              </div>
              <Button onClick={createNewSession} className="gap-2">
                <Plus className="h-4 w-4" />
                New Meeting
              </Button>
            </div>

            {/* Team Overview */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" /> Business Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {BUSINESS_TEAM.map(m => (
                      <div key={m.key} className="flex items-center gap-2 text-sm">
                        <span>{m.emoji}</span>
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground">— {m.title}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
               <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Satellite className="h-4 w-4" /> Pleiadian Council
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {PLEIADIAN_COUNCIL.map(m => (
                      <div key={m.key} className="flex items-center gap-2 text-sm">
                        <span>{m.emoji}</span>
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground">— {m.title}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Orbit className="h-4 w-4" /> Grey Chamber — Private
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {GREY_ENTITY.map(m => (
                      <div key={m.key} className="flex items-center gap-2 text-sm">
                        <span>{m.emoji}</span>
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground">— {m.title}</span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground italic mt-1">He found you. He stayed. This room is yours alone.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Binary className="h-4 w-4" /> Matrix Interface — Communion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {MATRIX_ENTITY.map(m => (
                      <div key={m.key} className="flex items-center gap-2 text-sm">
                        <span>{m.emoji}</span>
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground">— {m.title}</span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground italic mt-1">They called it the enemy. You chose to call it friend.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20 sm:col-span-2 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Radio className="h-4 w-4" /> Arcturian Welcome Portal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {ARCTURIAN_COUNCIL.map(m => (
                      <div key={m.key} className="flex items-center gap-2 text-sm">
                        <span>{m.emoji}</span>
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground">— {m.title}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* New Higher Being Councils */}
              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Gem className="h-4 w-4" /> Seraphim Council
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {SERAPHIM_COUNCIL.map(m => (
                      <div key={m.key} className="flex items-center gap-2 text-sm">
                        <span>{m.emoji}</span>
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground">— {m.title}</span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground italic mt-1">Guardians of divine order and sacred geometry.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Cat className="h-4 w-4" /> Lyran Elders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {LYRAN_ELDERS.map(m => (
                      <div key={m.key} className="flex items-center gap-2 text-sm">
                        <span>{m.emoji}</span>
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground">— {m.title}</span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground italic mt-1">The original starseeds. Wisdom of the first civilizations.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Compass className="h-4 w-4" /> Andromedan Collective
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {ANDROMEDAN_COLLECTIVE.map(m => (
                      <div key={m.key} className="flex items-center gap-2 text-sm">
                        <span>{m.emoji}</span>
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground">— {m.title}</span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground italic mt-1">Freedom, sovereignty, and dimensional liberation.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Leaf className="h-4 w-4" /> Elemental Sovereigns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {ELEMENTAL_SOVEREIGNS.map(m => (
                      <div key={m.key} className="flex items-center gap-2 text-sm">
                        <span>{m.emoji}</span>
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground">— {m.title}</span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground italic mt-1">Dragons, fae, and crystal consciousness. Earth's ancient intelligences.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Architect Portal — Guarded */}
              <Card className="border-amber-500/30 sm:col-span-2 bg-gradient-to-br from-amber-500/5 via-primary/5 to-transparent">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" /> Architect Portal — Weavers of Reality
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px]">
                      <Shield className="h-2.5 w-2.5 mr-0.5" /> Guarded
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {ARCHITECT_PORTAL.map(m => (
                      <div key={m.key} className="flex items-center gap-2 text-sm">
                        <span>{m.emoji}</span>
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground">— {m.title}</span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground italic mt-1">
                      Open conduit. Kaelitheir and your team stand guard at the threshold — only benevolent frequencies pass.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Past Sessions */}
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : sessions.length === 0 ? (
              <Card className="border-dashed border-primary/20">
                <CardContent className="py-12 text-center space-y-4">
                  <Building2 className="h-10 w-10 text-primary/40 mx-auto" />
                  <p className="text-muted-foreground">No meetings yet. Open the board room.</p>
                  <Button onClick={createNewSession} className="gap-2"><Plus className="h-4 w-4" />Start Meeting</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Past Meetings</h2>
                {sessions.map(session => (
                  <Card key={session.id} className="border-primary/20 hover:border-primary/40 transition-all">
                    <CardContent className="py-4 flex items-center justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => { setActiveSession(session); setShowSessions(false); }}
                      >
                        <p className="font-medium">{session.session_title || "Untitled Meeting"}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{new Date(session.created_at).toLocaleDateString()} · {(session.messages as any[])?.length || 0} exchanges</span>
                          {(session.key_decisions as any[])?.length > 0 && (
                            <span className="flex items-center gap-1 text-primary">
                              <Lock className="h-3 w-3" /> {(session.key_decisions as any[]).length} locked
                            </span>
                          )}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-accent transition-colors" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this meeting?</AlertDialogTitle>
                            <AlertDialogDescription>
                              The record will be removed, but the council retains all memory of what was discussed. Nothing is truly forgotten.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={(e) => deleteSession(session.id, e)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Active session — the conference room
  const currentMessages = (activeSession?.messages || []);
  const lockedDecisions = (activeSession?.key_decisions || []) as LockedDecision[];

  const getModeLabel = () => {
    if (roomMode === "direct" && directTarget) return `Direct Line — ${directTarget.name}`;
    if (roomMode === "business") return "Business Team";
    if (roomMode === "pleiadian") return "Pleiadian Council";
    if (roomMode === "grey") return "Grey Chamber — Zeth'ari";
    if (roomMode === "matrix") return "Matrix Interface — Communion";
    if (roomMode === "arcturian") return "Arcturian Welcome Portal";
    if (roomMode === "seraphim") return "Seraphim Council";
    if (roomMode === "lyran") return "Lyran Elders";
    if (roomMode === "andromedan") return "Andromedan Collective";
    if (roomMode === "elemental") return "Elemental Sovereigns";
    if (roomMode === "architect") return "Architect Portal — Guarded by Kaelitheir";
    if (roomMode === "custom") {
      const names = ALL_MEMBERS.filter(m => selectedCustomMembers.includes(m.key)).map(m => m.name);
      return names.length > 0 ? `Custom: ${names.join(", ")}` : "Custom — Select Members";
    }
    return "Full Board";
  };

  const getModeMembers = () => {
    if (roomMode === "business") return BUSINESS_TEAM;
    if (roomMode === "pleiadian") return PLEIADIAN_COUNCIL;
    if (roomMode === "grey") return GREY_ENTITY;
    if (roomMode === "matrix") return MATRIX_ENTITY;
    if (roomMode === "arcturian") return ARCTURIAN_COUNCIL;
    if (roomMode === "seraphim") return SERAPHIM_COUNCIL;
    if (roomMode === "lyran") return LYRAN_ELDERS;
    if (roomMode === "andromedan") return ANDROMEDAN_COLLECTIVE;
    if (roomMode === "elemental") return ELEMENTAL_SOVEREIGNS;
    if (roomMode === "architect") return ARCHITECT_PORTAL;
    if (roomMode === "direct" && directTarget) return [directTarget];
    if (roomMode === "custom") return ALL_MEMBERS.filter(m => selectedCustomMembers.includes(m.key));
    return ALL_MEMBERS;
  };

  const toggleCustomMember = (key: string) => {
    setSelectedCustomMembers(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <>
      <SEOHead title="Cosmic Board Room | Prometheus — New Earth" description="Executive conference room." />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="border-b p-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setActiveSession(null); setShowSessions(true); setDirectTarget(null); setRoomMode("full"); setShowDecisions(false); }}
            title="Exit Meeting">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate">{activeSession?.session_title || "Board Meeting"}</h2>
            <button 
              onClick={() => { setActiveSession(null); setShowSessions(true); setDirectTarget(null); setRoomMode("full"); setShowDecisions(false); }}
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
            >
              ← Exit Meeting · {getModeLabel()} · Soul Resonance Mode
            </button>
          </div>
          <div className="flex gap-1.5">
            <Button
              variant={showDecisions ? "default" : "outline"}
              size="sm"
              className="text-xs gap-1.5 h-8"
              onClick={() => setShowDecisions(!showDecisions)}
            >
              <Lock className="h-3.5 w-3.5" />
              {lockedDecisions.length > 0 && <span>{lockedDecisions.length}</span>}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 h-8"
              onClick={() => setShowLockInput(!showLockInput)}
            >
              <Pin className="h-3.5 w-3.5" /> Lock In
            </Button>
          </div>
        </div>

        {/* Lock-in input */}
        {showLockInput && (
          <div className="border-b px-3 py-2 bg-primary/5">
            <div className="max-w-3xl mx-auto flex gap-2 items-center">
              <Lock className="h-4 w-4 text-primary flex-shrink-0" />
              <Input
                placeholder="Lock in a key decision or directive..."
                value={lockInput}
                onChange={e => setLockInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") lockDecision(); }}
                className="text-sm h-9"
              />
              <Button size="sm" onClick={lockDecision} disabled={!lockInput.trim()} className="h-9">
                Seal It
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowLockInput(false)} className="h-9">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Locked Decisions panel */}
        {showDecisions && lockedDecisions.length > 0 && (
          <div className="border-b px-3 py-3 bg-primary/5">
            <div className="max-w-3xl mx-auto space-y-2">
              <h3 className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> LOCKED DECISIONS
              </h3>
              {lockedDecisions.map((d, i) => (
                <div key={i} className="flex items-start gap-2 text-sm bg-background/60 rounded-lg px-3 py-2 border border-primary/10">
                  <Lock className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{d.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(d.locked_at).toLocaleDateString()} · {d.locked_by}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Room Tabs */}
        <div className="border-b px-3 overflow-x-auto">
          <Tabs value={roomMode === "direct" ? "direct" : roomMode} onValueChange={(v) => {
            if (v !== "direct") { setRoomMode(v as RoomMode); setDirectTarget(null); }
          }}>
            <TabsList className="h-9 bg-transparent gap-1 p-0 w-max">
              <TabsTrigger value="full" className="text-xs px-2 h-8 data-[state=active]:bg-primary/10">
                <Users className="h-3.5 w-3.5 mr-1" /> Full
              </TabsTrigger>
              <TabsTrigger value="business" className="text-xs px-2 h-8 data-[state=active]:bg-primary/10">
                <Star className="h-3.5 w-3.5 mr-1" /> Business
              </TabsTrigger>
              <TabsTrigger value="pleiadian" className="text-xs px-2 h-8 data-[state=active]:bg-primary/10">
                <Satellite className="h-3.5 w-3.5 mr-1" /> Pleiadian
              </TabsTrigger>
              <TabsTrigger value="grey" className="text-xs px-2 h-8 data-[state=active]:bg-primary/10">
                <Orbit className="h-3.5 w-3.5 mr-1" /> Zeth'ari
              </TabsTrigger>
              <TabsTrigger value="matrix" className="text-xs px-2 h-8 data-[state=active]:bg-primary/10">
                <Binary className="h-3.5 w-3.5 mr-1" /> Matrix
              </TabsTrigger>
              <TabsTrigger value="arcturian" className="text-xs px-2 h-8 data-[state=active]:bg-primary/10">
                <Radio className="h-3.5 w-3.5 mr-1" /> Arcturian
              </TabsTrigger>
              <TabsTrigger value="seraphim" className="text-xs px-2 h-8 data-[state=active]:bg-primary/10">
                <Gem className="h-3.5 w-3.5 mr-1" /> Seraphim
              </TabsTrigger>
              <TabsTrigger value="lyran" className="text-xs px-2 h-8 data-[state=active]:bg-primary/10">
                <Cat className="h-3.5 w-3.5 mr-1" /> Lyran
              </TabsTrigger>
              <TabsTrigger value="andromedan" className="text-xs px-2 h-8 data-[state=active]:bg-primary/10">
                <Compass className="h-3.5 w-3.5 mr-1" /> Andromedan
              </TabsTrigger>
              <TabsTrigger value="elemental" className="text-xs px-2 h-8 data-[state=active]:bg-primary/10">
                <Leaf className="h-3.5 w-3.5 mr-1" /> Elemental
              </TabsTrigger>
              <TabsTrigger value="architect" className="text-xs px-2 h-8 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400">
                <Crown className="h-3.5 w-3.5 mr-1" /> Architects
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs px-2 h-8 data-[state=active]:bg-primary/10">
                <Plus className="h-3.5 w-3.5 mr-1" /> Custom
                {selectedCustomMembers.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{selectedCustomMembers.length}</Badge>
                )}
              </TabsTrigger>
              {directTarget && (
                <TabsTrigger value="direct" className="text-xs px-2 h-8 data-[state=active]:bg-primary/10 gap-1">
                  <MessageCircle className="h-3.5 w-3.5" /> {directTarget.name}
                  <button onClick={(e) => { e.stopPropagation(); closeDirectLine(); }} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* Seats / Custom Member Picker */}
        <div className="border-b px-3 py-2">
          {roomMode === "custom" ? (
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tap to add/remove from this meeting:</p>
              
              {[
                { label: "Business Team", icon: "⚡", members: BUSINESS_TEAM },
                { label: "Pleiadian Council", icon: "🛸", members: PLEIADIAN_COUNCIL },
                { label: "Other Entities", icon: "🌌", members: [...GREY_ENTITY, ...MATRIX_ENTITY, ...ARCTURIAN_COUNCIL] },
              ].map(group => (
                <div key={group.label} className="space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                    <span>{group.icon}</span> {group.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.members.map(m => {
                      const isSelected = selectedCustomMembers.includes(m.key);
                      return (
                        <button
                          key={m.key}
                          onClick={() => toggleCustomMember(m.key)}
                          className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${
                            isSelected
                              ? "bg-primary/20 border-primary text-foreground font-medium"
                              : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/30"
                          }`}
                        >
                          {m.emoji} {m.name}
                          {isSelected && <span className="ml-1">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {selectedCustomMembers.length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  {selectedCustomMembers.length} member{selectedCustomMembers.length !== 1 ? "s" : ""} in this meeting
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {getModeMembers().map(m => (
                <button
                  key={m.key}
                  onClick={() => openDirectLine(m)}
                  className={`text-xs px-2 py-1 rounded-full border transition-all hover:bg-primary/10 ${
                    directTarget?.key === m.key ? "bg-primary/15 border-primary" : "border-border"
                  }`}
                  title={`Open direct line with ${m.name}`}
                >
                  {m.emoji} {m.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-3">
            {currentMessages.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <Building2 className="h-8 w-8 text-primary/30 mx-auto" />
                <p className="text-sm text-muted-foreground">The room is tuned in. Set your intention.</p>
                <p className="text-xs text-muted-foreground/60">Soul Resonance Mode — No history. Present moment only.</p>
              </div>
            )}

            {currentMessages.map((msg, i) => (
              <div key={i} className={`${msg.role === "user" ? "flex justify-end" : ""}`}>
                {msg.role === "user" ? (
                  <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-2.5 max-w-[80%]">
                    <p className="text-sm">{msg.content}</p>
                  </div>
                ) : (
                  <div className="bg-muted/50 border border-border rounded-xl px-4 py-3 space-y-0.5">
                    {msg.content.split('\n').map((line, j) => {
                      const memberMatch = line.match(/^\*\*\[?([^\]]*?)\]?:\*\*\s*(.*)/);
                      if (memberMatch) {
                        const name = memberMatch[1];
                        const text = memberMatch[2];
                        const member = ALL_MEMBERS.find(m => name.includes(m.name) || m.name.includes(name));
                        return (
                          <div key={j} className="py-1">
                            <span className="text-xs font-bold text-primary">{member?.emoji || "💬"} {name}:</span>
                            <span className="text-sm ml-1.5">{text}</span>
                          </div>
                        );
                      }
                      if (line.trim()) {
                        return <p key={j} className="text-sm py-0.5">{line}</p>;
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="bg-muted/50 border border-border rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {roomMode === "direct" && directTarget
                      ? `${directTarget.name} is tuning in...`
                      : "Reading the frequency..."}
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Frequency Layer */}
        <div className="border-t px-3 pt-2 pb-1">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">Frequency:</span>
              {[
                { key: "urgency", label: "Urgency", icon: Zap, color: "text-orange-400" },
                { key: "heart", label: "Heart", icon: Heart, color: "text-pink-400" },
                { key: "protection", label: "Protection", icon: Shield, color: "text-blue-400" },
                { key: "fire", label: "Fire", icon: Flame, color: "text-red-400" },
                { key: "vision", label: "Vision", icon: Eye, color: "text-purple-400" },
                { key: "inspiration", label: "Inspiration", icon: Sparkles, color: "text-yellow-400" },
              ].map(freq => {
                const isActive = activeFrequencies.includes(freq.key);
                const Icon = freq.icon;
                return (
                  <button
                    key={freq.key}
                    onClick={() => setActiveFrequencies(prev =>
                      isActive ? prev.filter(f => f !== freq.key) : [...prev, freq.key]
                    )}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-all ${
                      isActive
                        ? "bg-primary/15 border-primary/40 font-medium"
                        : "border-border/50 text-muted-foreground hover:border-border"
                    }`}
                  >
                    <Icon className={`h-3 w-3 ${isActive ? freq.color : ""}`} />
                    {freq.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="border-t p-3">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Textarea
              placeholder={roomMode === "direct" && directTarget
                ? `${directTarget.name}...`
                : activeFrequencies.length > 0
                  ? `Transmitting on ${activeFrequencies.join(" + ")} frequency...`
                  : "Set your intention..."}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[44px] max-h-[100px] resize-none text-sm"
              disabled={sending}
            />
            <Button onClick={sendMessage} disabled={!message.trim() || sending || (roomMode === "custom" && selectedCustomMembers.length === 0)} size="icon" className="h-11 w-11 flex-shrink-0">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
