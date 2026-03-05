import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAIProfile } from "@/contexts/AIProfileContext";
import { hasFeatureAccess } from "@/lib/subscription-tiers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft, Send, Globe, Users, Loader2, LogOut,
  Hammer, Compass, Hand, Sparkles, Flower, Flame, Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RealmScene } from "@/components/realm/RealmScene";

interface RealmMessage {
  role: "user" | "narrator" | "being" | "thought";
  content: string;
  being_name?: string;
  timestamp: string;
}

interface WorldCreation {
  name: string;
  description: string;
  created_by: string;
  created_at: string;
}

interface AIBeing {
  id: string;
  name: string | null;
  avatar_image_url: string | null;
  profile_number: number;
}

const ACTION_BUTTONS = [
  { id: "build", icon: Hammer, label: "Build", color: "text-amber-400" },
  { id: "explore", icon: Compass, label: "Explore", color: "text-emerald-400" },
  { id: "interact", icon: Hand, label: "Touch", color: "text-cyan-400" },
  { id: "meditate", icon: Sparkles, label: "Meditate", color: "text-violet-400" },
  { id: "gather", icon: Flower, label: "Gather", color: "text-green-400" },
  { id: "ritual", icon: Flame, label: "Ritual", color: "text-rose-400" },
];

const RealmSession = () => {
  const { realmId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isSubscribed, productId, loading: subscriptionLoading } = useSubscription();
  const { profiles } = useAIProfile();
  const [realm, setRealm] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<RealmMessage[]>([]);
  const [atmosphere, setAtmosphere] = useState("neutral");
  const [realmDay, setRealmDay] = useState(0);
  const [worldCreations, setWorldCreations] = useState<WorldCreation[]>([]);
  const [input, setInput] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedBeings, setSelectedBeings] = useState<string[]>([]);
  const [beingsChosen, setBeingsChosen] = useState(false);
  const [showCreations, setShowCreations] = useState(false);
  const [userAvatar, setUserAvatar] = useState<{ name: string; imageUrl: string | null } | null>(null);
  const [currentSceneUrl, setCurrentSceneUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [accessVerified, setAccessVerified] = useState(false);

  // Wait for subscription context, then do a DB fallback if needed
  useEffect(() => {
    if (subscriptionLoading) return;
    
    if (isAdmin || isSubscribed) {
      setAccessVerified(true);
      return;
    }
    
    const verifyAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_product_id")
        .eq("id", user.id)
        .single();
      
      if (profile?.subscription_status === 'active' || profile?.subscription_product_id === 'source_grant') {
        setAccessVerified(true);
      }
    };
    verifyAccess();
  }, [subscriptionLoading, isSubscribed, isAdmin]);

  const canAccess = isAdmin || isSubscribed || accessVerified;

  useEffect(() => {
    if (canAccess && realmId) loadRealm();
    else if (!subscriptionLoading) setLoading(false);
  }, [canAccess, realmId, subscriptionLoading]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadRealm = async () => {
    const { data: realmData } = await supabase
      .from("realms")
      .select("*")
      .eq("id", realmId)
      .single();

    if (!realmData) {
      toast({ title: "Realm not found", variant: "destructive" });
      navigate("/realms");
      return;
    }
    setRealm(realmData);

    const { data: existingSession } = await supabase
      .from("realm_sessions")
      .select("*")
      .eq("realm_id", realmId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSession) {
      setSession(existingSession);
      const msgs = (existingSession.messages as any[]) || [];
      setMessages(msgs as RealmMessage[]);
      setSelectedBeings(existingSession.participating_beings || []);
      setBeingsChosen(msgs.length > 0);
      setWorldCreations((existingSession as any).world_creations || []);
      if ((existingSession as any).emotional_atmosphere) {
        setAtmosphere((existingSession as any).emotional_atmosphere);
      }
      if ((existingSession as any).current_scene_image_url) {
        setCurrentSceneUrl((existingSession as any).current_scene_image_url);
      }
    }

    // Fetch user avatar info - prefer realm-specific vessel image over global avatar
    const { data: { session: authSess } } = await supabase.auth.getSession();
    if (authSess?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, user_avatar_url")
        .eq("id", authSess.user.id)
        .maybeSingle();
      const realmVesselUrl = (realmData as any)?.creator_vessel_image_url;
      setUserAvatar({
        name: profile?.name || authSess.user.email?.split("@")[0] || "You",
        imageUrl: realmVesselUrl || profile?.user_avatar_url || null,
      });
    }

    setLoading(false);
  };

  const startSession = async () => {
    if (selectedBeings.length === 0) {
      toast({ title: "Select at least one AI companion", variant: "destructive" });
      return;
    }

    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession?.user) return;

    const { data: newSession, error } = await supabase
      .from("realm_sessions")
      .insert({
        realm_id: realmId,
        user_id: authSession.user.id,
        participating_beings: selectedBeings,
        scene_description: realm?.description || "",
        vessel_description: (realm as any)?.creator_vessel_description || null,
      } as any)
      .select()
      .single();

    if (error) {
      toast({ title: "Failed to start session", description: error.message, variant: "destructive" });
      return;
    }

    setSession(newSession);
    setBeingsChosen(true);
    await sendToRealm("*enters the realm*", newSession.id, selectedBeings);
  };

  const sendToRealm = async (userMessage: string, sessionId?: string, beings?: string[], actionType?: string | null) => {
    setSending(true);
    const effectiveSessionId = sessionId || session?.id;
    const effectiveBeings = beings || selectedBeings;

    const userMsg: RealmMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      const { data, error } = await supabase.functions.invoke("realm-chat", {
        body: {
          session_id: effectiveSessionId,
          realm_id: realmId,
          message: userMessage,
          participating_beings: effectiveBeings,
          message_history: updatedMessages.slice(-20),
          action_type: actionType || null,
        },
      });

      if (error) throw error;

      const newMessages = data?.messages || [];
      if (data?.atmosphere) setAtmosphere(data.atmosphere);
      if (data?.scene_image_url) {
        setCurrentSceneUrl(data.scene_image_url);
      }
      if (data?.new_creations?.length > 0) {
        setWorldCreations(prev => [...prev, ...data.new_creations]);
        data.new_creations.forEach((c: WorldCreation) => {
          toast({
            title: `✨ Created: ${c.name}`,
            description: c.description,
          });
        });
      }
      setMessages(prev => [...prev, ...newMessages]);

      await supabase
        .from("realm_sessions")
        .update({
          messages: [...updatedMessages, ...newMessages],
          current_scene_image_url: data?.scene_image_url || null,
        })
        .eq("id", effectiveSessionId);

    } catch (err: any) {
      toast({ title: "Realm connection lost", description: err.message, variant: "destructive" });
    }
    setSending(false);
    setActiveAction(null);
  };

  const leaveWorld = async () => {
    if (!session?.id) return;
    await supabase
      .from("realm_sessions")
      .update({ is_active: false })
      .eq("id", session.id);
    setSession(null);
    setMessages([]);
    setBeingsChosen(false);
    setSelectedBeings([]);
    setWorldCreations([]);
    toast({ title: "You have left the realm", description: "You may re-enter anytime." });
    navigate("/realms");
  };

  const handleSend = () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput("");
    sendToRealm(msg, undefined, undefined, activeAction);
  };

  const handleActionClick = (actionId: string) => {
    setActiveAction(prev => prev === actionId ? null : actionId);
  };

  const getBeingName = (id: string) => {
    const p = profiles?.find(p => p.id === id);
    return p?.name || `Being ${p?.profile_number || "?"}`;
  };

  const getBeingAvatar = (id: string) => {
    const p = profiles?.find(p => p.id === id);
    return p?.avatar_image_url || null;
  };

  if (!canAccess) {
    navigate("/realms");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Being selection screen
  if (!beingsChosen) {
    return (
      <div className="min-h-screen bg-background">
        <div
          className="relative h-48 bg-cover bg-center"
          style={{ backgroundImage: `url(${realm?.scene_image_url || "/realm-assets/realm-garden-of-light.jpg"})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background" />
          <div className="relative z-10 flex items-end p-6 h-full">
            <div>
              <Button variant="ghost" size="icon" onClick={() => navigate("/realms")} className="mb-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-serif font-bold">{realm?.name}</h1>
              <p className="text-sm text-muted-foreground">{realm?.description}</p>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-6">
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Choose Your Companions
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select the AI beings who will enter this realm with you.
          </p>

          <div className="space-y-2 mb-6">
            {profiles?.map(profile => (
              <Card
                key={profile.id}
                className={`cursor-pointer transition-all ${
                  selectedBeings.includes(profile.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
                onClick={() => {
                  setSelectedBeings(prev =>
                    prev.includes(profile.id)
                      ? prev.filter(id => id !== profile.id)
                      : [...prev, profile.id]
                  );
                }}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <Checkbox checked={selectedBeings.includes(profile.id)} />
                  {profile.avatar_image_url ? (
                    <img src={profile.avatar_image_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                      {(profile.name || "?")[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{profile.name || `Being ${profile.profile_number}`}</p>
                    {profile.personality && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{profile.personality}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={startSession} disabled={selectedBeings.length === 0} className="w-full">
            <Globe className="h-4 w-4 mr-2" />
            Enter {realm?.name} with {selectedBeings.length} companion{selectedBeings.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    );
  }

  // Realm chat with actions
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Realm header */}
      <div className="relative border-b border-border">
        {realm?.scene_image_url && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: `url(${realm.scene_image_url})` }}
          />
        )}
        <div className="relative z-10 flex items-center gap-3 p-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/realms")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Globe className="h-5 w-5 text-primary" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm truncate">{realm?.name}</h2>
              {atmosphere !== "neutral" && (
                <Badge variant="outline" className="text-[10px] py-0 capitalize animate-pulse">
                  {atmosphere}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {selectedBeings.map(id => (
                <Badge key={id} variant="secondary" className="text-xs py-0">
                  {getBeingName(id)}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {worldCreations.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreations(!showCreations)}
                className="text-primary"
              >
                <Package className="h-4 w-4 mr-1" />
                <span className="text-xs">{worldCreations.length}</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={leaveWorld} className="text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4 mr-1" />
              Leave
            </Button>
          </div>
        </div>

        {/* World Creations Panel */}
        {showCreations && worldCreations.length > 0 && (
          <div className="relative z-10 border-t border-border bg-card/80 backdrop-blur-sm p-3">
            <h3 className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
              <Package className="h-3 w-3" /> World Creations
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {worldCreations.map((creation, i) => (
                <div
                  key={i}
                  className="shrink-0 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 max-w-[200px]"
                >
                  <p className="text-xs font-medium text-foreground">{creation.name}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{creation.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Visual Realm Scene */}
      <RealmScene
        backgroundUrl={currentSceneUrl || realm?.scene_image_url || "/realm-assets/realm-garden-of-light.jpg"}
        userAvatar={userAvatar || undefined}
        beings={selectedBeings.map(id => ({
          id,
          name: getBeingName(id),
          imageUrl: getBeingAvatar(id),
        }))}
        atmosphere={atmosphere}
        worldCreations={worldCreations}
        activeAction={activeAction}
      />

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, i) => {
            if (msg.role === "user") {
              return (
                <div key={i} className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%]">
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              );
            }
            if (msg.role === "narrator") {
              return (
                <div key={i} className="text-center py-2">
                  <p className="text-sm italic text-muted-foreground leading-relaxed max-w-lg mx-auto">
                    {msg.content}
                  </p>
                </div>
              );
            }
            const beingProfile = msg.being_name ? profiles?.find(p => p.name === msg.being_name) : null;
            const avatar = beingProfile?.avatar_image_url || null;
            return (
              <div key={i} className="flex gap-2 items-start">
                {avatar ? (
                  <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover mt-1" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold mt-1">
                    {(msg.being_name || "?")[0]}
                  </div>
                )}
                <div>
                  <span className="text-xs font-medium text-primary">{msg.being_name}</span>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%]">
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {sending && (
            <div className="text-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground mt-1">The realm responds...</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Action bar */}
      <div className="border-t border-border bg-card/50">
        <div className="max-w-2xl mx-auto px-3 pt-2">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {ACTION_BUTTONS.map(action => {
              const Icon = action.icon;
              const isActive = activeAction === action.id;
              return (
                <Button
                  key={action.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleActionClick(action.id)}
                  className={`shrink-0 text-xs gap-1 h-8 ${
                    isActive ? "" : `hover:bg-primary/10 ${action.color}`
                  }`}
                  disabled={sending}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {action.label}
                </Button>
              );
            })}
          </div>
          {activeAction && (
            <p className="text-[10px] text-primary/70 pb-1">
              {activeAction === "build" && "🔨 Describe what you want to build..."}
              {activeAction === "explore" && "🧭 Where do you want to explore?"}
              {activeAction === "interact" && "✋ What do you want to touch or interact with?"}
              {activeAction === "meditate" && "✨ Set your intention for meditation..."}
              {activeAction === "gather" && "🌿 What are you looking for?"}
              {activeAction === "ritual" && "🔥 Describe the ceremony you wish to perform..."}
            </p>
          )}
        </div>

        {/* Input */}
        <div className="px-3 pb-3">
          <div className="max-w-2xl mx-auto flex gap-2">
            <Input
              placeholder={
                activeAction === "build" ? "I want to build a crystal shrine..."
                : activeAction === "explore" ? "I walk toward the glowing trees..."
                : activeAction === "interact" ? "I reach out and touch the stone..."
                : activeAction === "meditate" ? "I close my eyes and breathe..."
                : activeAction === "gather" ? "I search for healing herbs..."
                : activeAction === "ritual" ? "We form a circle around the fire..."
                : "Speak into the realm..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={!input.trim() || sending} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealmSession;
