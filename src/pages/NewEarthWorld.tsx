import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAIProfile } from "@/contexts/AIProfileContext";
import SeekerGateModal from "@/components/SeekerGateModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft, Globe, Loader2, Users, Map, Lock,
  Sparkles, Flame, Crown, MessageCircle, LayoutGrid,
  Send, Hammer, Compass, Hand, Flower, Package, LogOut,
  ImagePlus, Camera
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { toast } from "sonner";
import { DEFAULT_PROMETHEUS_WORLD_ID, useWorldPresence } from "@/hooks/useWorldPresence";
import { RealmScene } from "@/components/realm/RealmScene";
import type { BuildSpec } from "@/components/world/WorldBuildDialog";
import { WorldBuildDialog } from "@/components/world/WorldBuildDialog";

interface UserWorld {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  is_default?: boolean;
  terrain_seed: number;
  sky_preset: string;
  ambient_color: string;
  thumbnail_url: string | null;
}

interface StructureRecord {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
}

interface WorldMessage {
  role: "user" | "narrator" | "being";
  content: string;
  being_name?: string;
  image_url?: string;
  timestamp: string;
}

/** Parse AI response text into separate narrator and being messages */
function parseWorldResponse(text: string, beingNames: string[]): WorldMessage[] {
  const now = new Date().toISOString();
  const messages: WorldMessage[] = [];
  
  if (!text || beingNames.length === 0) {
    return [{ role: "narrator", content: text, timestamp: now }];
  }

  // Build regex to detect being dialogue patterns like:
  // "BeingName: ..." or "**BeingName:**" or "*BeingName says*" or "BeingName said,"
  const escapedNames = beingNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const namePattern = escapedNames.join('|');
  
  // Split on patterns like "Name:" or "**Name:**" or "**Name**:" at start of line
  const splitRegex = new RegExp(
    `(?:^|\\n)\\s*(?:\\*\\*)?\\s*(${namePattern})\\s*(?:\\*\\*)?\\s*[:：]\\s*`,
    'gi'
  );
  
  const parts: { type: 'narrator' | 'being'; name?: string; text: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  
  while ((match = splitRegex.exec(text)) !== null) {
    // Everything before this match is narration
    const before = text.slice(lastIndex, match.index).trim();
    if (before) {
      parts.push({ type: 'narrator', text: before });
    }
    lastIndex = match.index + match[0].length;
    
    // Find the matched being name (case-insensitive match back to original)
    const matchedName = beingNames.find(n => 
      n.toLowerCase() === match![1].toLowerCase()
    ) || match[1];
    
    // Find where this being's dialogue ends (next being pattern or end)
    const remaining = text.slice(lastIndex);
    const nextMatch = splitRegex.exec(text);
    
    let dialogueEnd: number;
    if (nextMatch) {
      dialogueEnd = nextMatch.index;
      splitRegex.lastIndex = nextMatch.index; // reset to re-process
    } else {
      dialogueEnd = text.length;
    }
    
    const dialogue = text.slice(lastIndex, dialogueEnd).trim();
    if (dialogue) {
      // Clean up markdown formatting from dialogue
      const cleanDialogue = dialogue
        .replace(/^\*+|\*+$/g, '')  // remove wrapping asterisks
        .replace(/^[""]|[""]$/g, '') // remove wrapping quotes
        .trim();
      parts.push({ type: 'being', name: matchedName, text: cleanDialogue });
    }
    lastIndex = dialogueEnd;
  }
  
  // Any remaining text after last match
  const remaining = text.slice(lastIndex).trim();
  if (remaining) {
    parts.push({ type: 'narrator', text: remaining });
  }
  
  // If no being patterns found at all, return as single narrator message
  if (parts.length === 0) {
    return [{ role: "narrator", content: text, timestamp: now }];
  }
  
  // Convert parts to WorldMessages
  for (const part of parts) {
    if (part.type === 'being' && part.name) {
      messages.push({
        role: "being",
        content: part.text,
        being_name: part.name,
        timestamp: now,
      });
    } else if (part.text) {
      messages.push({
        role: "narrator",
        content: part.text,
        timestamp: now,
      });
    }
  }
  
  return messages.length > 0 ? messages : [{ role: "narrator", content: text, timestamp: now }];
}

interface WorldCreation {
  name: string;
  description: string;
  created_by: string;
  created_at: string;
}

const ACTION_BUTTONS = [
  { id: "build", icon: Hammer, label: "Build", color: "text-amber-400" },
  { id: "explore", icon: Compass, label: "Explore", color: "text-emerald-400" },
  { id: "interact", icon: Hand, label: "Touch", color: "text-cyan-400" },
  { id: "meditate", icon: Sparkles, label: "Meditate", color: "text-violet-400" },
  { id: "gather", icon: Flower, label: "Gather", color: "text-green-400" },
  { id: "ritual", icon: Flame, label: "Ritual", color: "text-rose-400" },
];

// Privileged accounts that can send/receive images in worlds
const WORLD_IMAGE_PRIVILEGED_IDS = [
  '5b2818a4-be23-4d81-b0a3-ec2e49411603', // karmaisback2023@gmail.com
  '1af51c0a-4f6e-469d-b31f-8972d1687655', // stormriddari@aol.com
];

const NewEarthWorld = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const visitWorldId = searchParams.get("visit");
  const { isSubscribed, isAdmin, loading: subscriptionLoading, productId } = useSubscription();
  const { profiles } = useAIProfile();
  const isNewEarthTier = productId === 'prod_U5jdDVZhQFGQWv' || productId === 'source_grant';
  const isFreeUser = !isSubscribed && !isAdmin;
  const [isDefaultWorld, setIsDefaultWorld] = useState(false);
  const canBuild = isDefaultWorld ? isAdmin : (isAdmin || isNewEarthTier);
  const [world, setWorld] = useState<UserWorld | null>(null);
  const [structures, setStructures] = useState<StructureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [accessVerified, setAccessVerified] = useState(false);
  const [isVisiting, setIsVisiting] = useState(false);
  const [worldOwnerName, setWorldOwnerName] = useState<string | null>(null);
  const [showSeekerGate, setShowSeekerGate] = useState(false);
  const [worldSceneUrl, setWorldSceneUrl] = useState<string>("/realm-assets/realm-garden-of-light.jpg");

  // Interactive session state (local only — no realm_sessions FK issues)
  const [messages, setMessages] = useState<WorldMessage[]>([]);
  const [input, setInput] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [selectedBeings, setSelectedBeings] = useState<string[]>([]);
  const [beingsChosen, setBeingsChosen] = useState(false);
  const [worldCreations, setWorldCreations] = useState<WorldCreation[]>([]);
  const [showCreations, setShowCreations] = useState(false);
  const [userAvatar, setUserAvatar] = useState<{ name: string; imageUrl: string | null } | null>(null);
  const [buildDialogOpen, setBuildDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Image support for privileged users
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const canSendWorldImages = WORLD_IMAGE_PRIVILEGED_IDS.includes(currentUserId || '');

  // If no visit param, redirect to world gallery
  useEffect(() => {
    if (!visitWorldId) {
      navigate("/world-gallery", { replace: true });
    }
  }, [visitWorldId, navigate]);

  // Track current user ID for privilege checks
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  const resolvedWorldId = visitWorldId || DEFAULT_PROMETHEUS_WORLD_ID;

  const { visitorCount } = useWorldPresence(world?.id ?? null, {
    enabled: Boolean(world?.id && accessVerified),
    trackSelf: true,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Access verification — wait for auth session to be fully ready before querying
  useEffect(() => {
    if (subscriptionLoading || !visitWorldId) return;

    let cancelled = false;
    let authUnsub: (() => void) | null = null;

    const checkWorldAccess = async (userId: string) => {
      if (cancelled) return;

      // Retry up to 3 times with increasing delays to handle RLS + auth propagation
      for (let attempt = 0; attempt < 3; attempt++) {
        if (cancelled) return;

        const { data: targetWorld } = await supabase
          .from("user_worlds")
          .select("id, is_default, is_public, user_id")
          .eq("id", resolvedWorldId)
          .maybeSingle() as any;

        if (cancelled) return;

        if (targetWorld) {
          // World found — check permissions
          if (!targetWorld.is_default && !targetWorld.is_public && targetWorld.user_id !== userId && !isAdmin) {
            toast.error("World not found or is private");
            navigate("/world-gallery");
            return;
          }
          setIsDefaultWorld(Boolean(targetWorld.is_default));
          setAccessVerified(true);
          return;
        }

        // World not found yet — wait before retrying (auth.uid() may not be propagated)
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 800 * (attempt + 1)));
        }
      }

      // All retries exhausted
      if (!cancelled) {
        toast.error("World is unavailable right now. Please try again.");
        navigate("/world-gallery");
      }
    };

    const startVerification = async () => {
      // First try cached session
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (session?.user) {
        await checkWorldAccess(session.user.id);
        return;
      }

      // No session yet — listen for auth state to settle
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          if (cancelled) return;
          if (newSession?.user) {
            subscription.unsubscribe();
            await checkWorldAccess(newSession.user.id);
          } else if (event === 'SIGNED_OUT') {
            subscription.unsubscribe();
            if (!cancelled) navigate("/auth");
          }
        }
      );
      authUnsub = () => subscription.unsubscribe();

      // Safety timeout: if no auth event fires within 4 seconds, redirect
      setTimeout(() => {
        if (!cancelled && !accessVerified) {
          subscription.unsubscribe();
          navigate("/auth");
        }
      }, 4000);
    };

    startVerification();
    return () => {
      cancelled = true;
      authUnsub?.();
    };
  }, [subscriptionLoading, navigate, visitWorldId, resolvedWorldId, isAdmin]);

  // Load world
  useEffect(() => {
    if (!accessVerified) return;
    loadWorld(resolvedWorldId);
  }, [accessVerified, resolvedWorldId]);

  const loadWorld = async (worldId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: targetWorld } = await supabase
        .from("user_worlds")
        .select("*")
        .eq("id", worldId)
        .maybeSingle() as any;

      if (!targetWorld) {
        toast.error("World not found");
        navigate("/world-gallery");
        return;
      }

      const isOwner = user?.id === targetWorld.user_id;
      if (!targetWorld.is_default && !targetWorld.is_public && !isOwner && !isAdmin) {
        toast.error("World not found or is private");
        navigate("/world-gallery");
        return;
      }

      setIsDefaultWorld(Boolean(targetWorld.is_default));
      setWorld(targetWorld as UserWorld);
      setIsVisiting(!isOwner && !isAdmin);

      if (targetWorld.thumbnail_url) {
        setWorldSceneUrl(targetWorld.thumbnail_url);
      }

      const { data: structs } = await supabase
        .from("world_structures")
        .select("id, name, description, image_url")
        .eq("world_id", worldId)
        .order("created_at", { ascending: false });

      const structList = structs?.map((s: any) => ({
        id: s.id, name: s.name, description: s.description, image_url: s.image_url,
      })) || [];
      setStructures(structList);

      if (structList.length > 0 && structList[0].image_url) {
        setWorldSceneUrl(structList[0].image_url);
      }

      // Convert structures to world creations for display
      setWorldCreations(structList.map(s => ({
        name: s.name,
        description: s.description || "",
        created_by: "you",
        created_at: new Date().toISOString(),
      })));

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, user_avatar_url")
          .eq("id", user.id)
          .maybeSingle();
        setUserAvatar({
          name: profile?.name || user.email?.split("@")[0] || "You",
          imageUrl: profile?.user_avatar_url || null,
        });
      }

      const { data: ownerProfile } = await supabase
        .from("soul_profiles")
        .select("display_name")
        .eq("user_id", targetWorld.user_id)
        .maybeSingle();
      setWorldOwnerName(ownerProfile?.display_name || "Unknown Soul");
    } catch (err) {
      console.error("Error loading world:", err);
      toast.error("Failed to load world");
    } finally {
      setLoading(false);
    }
  };

  const enterWorld = () => {
    if (selectedBeings.length === 0) {
      toast.error("Select at least one AI companion");
      return;
    }
    setBeingsChosen(true);
    // Add welcome narrator message
    const welcomeMsg: WorldMessage = {
      role: "narrator",
      content: `You step into ${world?.name || "the world"}. The air shimmers with possibility as your companions materialize beside you. The realm stretches out before you, alive and waiting.`,
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMsg]);
  };

  const handleBuildSpec = useCallback(async (spec: BuildSpec) => {
    if (!world || isVisiting || !canBuild) return;
    setBuilding(true);
    setBuildDialogOpen(false);

    const buildMsg: WorldMessage = {
      role: "user",
      content: `*begins building ${spec.name}*`,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, buildMsg]);

    try {
      const { data, error } = await supabase.functions.invoke("world-builder", {
        body: {
          world_id: world.id,
          name: spec.name,
          description: spec.description,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.image_url) {
        setWorldSceneUrl(data.image_url);
      }

      if (data?.structure) {
        const newStruct = {
          id: data.structure.id,
          name: data.structure.name,
          description: data.structure.description,
          image_url: data.structure.image_url,
        };
        setStructures(prev => [newStruct, ...prev]);
        setWorldCreations(prev => [{
          name: newStruct.name,
          description: newStruct.description || "",
          created_by: "you",
          created_at: new Date().toISOString(),
        }, ...prev]);
      }

      const narratorMsg: WorldMessage = {
        role: "narrator",
        content: data?.message || `✨ ${spec.name} has been manifested into the world! The landscape shifts and transforms as your creation takes form.`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, narratorMsg]);
      toast.success(`✨ ${spec.name} has been manifested!`);
    } catch (err: any) {
      console.error("Build error:", err);
      toast.error(err.message || "Failed to build — please try again");
      const errorMsg: WorldMessage = {
        role: "narrator",
        content: "The energy dissipates... the creation could not take form. Try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setBuilding(false);
    }
  }, [world, isVisiting, canBuild]);

  // Image upload handler for privileged users
  const handleWorldImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canSendWorldImages) return;
    e.target.value = '';

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setPendingImageUrl(base64);
        setUploadingImage(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read image");
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Failed to process image");
      setUploadingImage(false);
    }
  };

  const handleSend = () => {
    if ((!input.trim() && !pendingImageUrl) || sending) return;
    const msg = input.trim();
    setInput("");

    const userMsg: WorldMessage = {
      role: "user",
      content: msg || (pendingImageUrl ? "📷 Shared an image" : ""),
      image_url: pendingImageUrl || undefined,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    const imageToSend = pendingImageUrl;
    setPendingImageUrl(null);

    // If build action is active, open build dialog instead
    if (activeAction === "build") {
      if (!canBuild) {
        toast.error("Upgrade to $49.99 to build in this world");
        return;
      }
      setBuildDialogOpen(true);
      setActiveAction(null);
      return;
    }

    // For other actions, send to realm-chat via the chat edge function
    setSending(true);
    sendWorldChat(msg, activeAction, imageToSend || undefined);
  };

  const sendWorldChat = async (message: string, actionType: string | null, imageUrl?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const isPrivileged = WORLD_IMAGE_PRIVILEGED_IDS.includes(user.id);

      // Use the chat function with world context
      const beingNames = selectedBeings.map(id => {
        const p = profiles?.find(p => p.id === id);
        return p?.name || "Unknown";
      }).join(", ");

      const primaryBeingId = selectedBeings[0] || profiles?.[0]?.id;

      // Detect if user is asking for an image from their being
      const wantsImage = isPrivileged && /\b(send|show|give|share|take|snap|capture|draw|paint|create|generate|make).{0,20}(pic|photo|image|picture|selfie|portrait|scene|painting|drawing)\b/i.test(message);

      const worldContext = `[WORLD CONTEXT: The user is inside their New Earth world "${world?.name}". Their AI companions ${beingNames} are present. Action mode: ${actionType || "free"}. World description: ${world?.description || "A magical realm"}. IMPORTANT FORMAT: Write narrative description first, then have EACH being speak on its own line using the format "BeingName: their dialogue here". Always include at least one line of being dialogue per being present.${imageUrl ? " The user has shared an image with you — acknowledge and respond to it." : ""}]`;

      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          message: `${worldContext}\n\n${message}`,
          userId: user.id,
          aiProfileId: primaryBeingId,
          generateImage: wantsImage,
          imageUrl: imageUrl || undefined,
          conversationId: crypto.randomUUID(),
          history: messages.slice(-10).map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
        },
      });

      if (error) throw error;

      if (data?.response) {
        // Parse response to extract being dialogue vs narration
        const beingNamesList = selectedBeings.map(id => {
          const p = profiles?.find(p => p.id === id);
          return p?.name || "";
        }).filter(Boolean);
        
        const parsed = parseWorldResponse(data.response, beingNamesList);

        // If AI returned an image, attach it to the first being message (or narrator)
        if (data?.imageUrl && parsed.length > 0) {
          const beingMsg = parsed.find(m => m.role === "being") || parsed[0];
          beingMsg.image_url = data.imageUrl;
        }

        setMessages(prev => [...prev, ...parsed]);
      }
    } catch (err: any) {
      console.error("World chat error:", err);
      toast.error("Failed to get a response. Try again.");
      const fallbackMsg: WorldMessage = {
        role: "narrator",
        content: "The world hums softly in response... the energy shifts around you.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setSending(false);
      setActiveAction(null);
    }
  };

  const handleActionClick = (actionId: string) => {
    if (actionId === "build") {
      if (!canBuild) {
        toast.error("Upgrade to $49.99 to build in this world");
        return;
      }
      setBuildDialogOpen(true);
      return;
    }
    setActiveAction(prev => prev === actionId ? null : actionId);
  };

  const leaveWorld = useCallback(() => {
    toast.success("You have left the world");
    navigate("/world-gallery");
  }, [navigate]);

  const getBeingName = (id: string) => {
    const p = profiles?.find(p => p.id === id);
    return p?.name || `Being ${p?.profile_number || "?"}`;
  };

  const getBeingAvatar = (id: string) => {
    const p = profiles?.find(p => p.id === id);
    return p?.avatar_image_url || null;
  };

  // Redirect if no visit param
  if (!visitWorldId) return null;

  if (subscriptionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Globe className="h-8 w-8 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Entering New Earth...</p>
        </div>
      </div>
    );
  }

  if (!accessVerified || !world) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Being selection screen
  if (!beingsChosen && !isFreeUser) {
    return (
      <>
        <SEOHead title="New Earth — Choose Companions" description="Select your AI beings to enter New Earth." />
        <div className="min-h-screen bg-background">
          <div
            className="relative h-48 bg-cover bg-center"
            style={{ backgroundImage: `url(${worldSceneUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background" />
            <div className="relative z-10 flex items-end p-6 h-full">
              <div>
                <Button variant="ghost" size="icon" onClick={() => navigate("/world-gallery")} className="mb-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-serif font-bold">{world.name}</h1>
                <p className="text-sm text-muted-foreground">{world.description}</p>
              </div>
            </div>
          </div>

          <div className="max-w-md mx-auto p-6">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Choose Your Companions
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select the AI beings who will enter this world with you.
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

            <Button onClick={enterWorld} disabled={selectedBeings.length === 0} className="w-full">
              <Globe className="h-4 w-4 mr-2" />
              Enter {world.name} with {selectedBeings.length} companion{selectedBeings.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Full interactive world experience
  return (
    <>
      <SEOHead title={`${world.name} — New Earth`} description="Explore your world inside New Earth." />
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="relative border-b border-border shrink-0">
          <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url(${worldSceneUrl})` }} />
          <div className="relative z-10 flex items-center gap-3 p-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/world-gallery")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Globe className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sm truncate">{world.name}</h2>
                {isVisiting && worldOwnerName && (
                  <Badge variant="outline" className="text-[10px] py-0">by {worldOwnerName}</Badge>
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
              <Badge variant="outline" className="text-[10px]">
                <Users className="h-3 w-3 mr-1" />
                {visitorCount}
              </Badge>
              {worldCreations.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setShowCreations(!showCreations)} className="text-primary">
                  <Package className="h-4 w-4 mr-1" />
                  <span className="text-xs">{worldCreations.length}</span>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={leaveWorld} className="text-destructive hover:text-destructive">
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline text-xs">Leave</span>
              </Button>
            </div>
          </div>

          {showCreations && worldCreations.length > 0 && (
            <div className="relative z-10 border-t border-border bg-card/80 backdrop-blur-sm p-3">
              <h3 className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                <Package className="h-3 w-3" /> World Creations
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {worldCreations.map((creation, i) => (
                  <div key={i} className="shrink-0 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 max-w-[200px]">
                    <p className="text-xs font-medium text-foreground">{creation.name}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{creation.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Visual Scene with AI Beings */}
        <RealmScene
          backgroundUrl={worldSceneUrl}
          userAvatar={userAvatar || undefined}
          beings={selectedBeings.map(id => ({
            id,
            name: getBeingName(id),
            imageUrl: getBeingAvatar(id),
          }))}
          atmosphere="neutral"
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
              // being message
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
            {(sending || building) && (
              <div className="text-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
                <p className="text-xs text-muted-foreground mt-1">
                  {building ? "Manifesting your creation..." : "The world responds..."}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action bar + Input */}
        <div className="border-t border-border bg-card/50 shrink-0">
          <div className="max-w-2xl mx-auto px-3 pt-2">
            <div className="flex gap-1 overflow-x-auto pb-2">
              {ACTION_BUTTONS.map(action => {
                const Icon = action.icon;
                const isActive = activeAction === action.id;
                const isLocked = action.id === "build" && !canBuild;
                return (
                  <Button
                    key={action.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleActionClick(action.id)}
                    className={`shrink-0 text-xs gap-1 h-8 ${
                      isActive ? "" : `hover:bg-primary/10 ${action.color}`
                    } ${isLocked ? "opacity-50" : ""}`}
                    disabled={sending || building}
                  >
                    {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                    {action.label}
                  </Button>
                );
              })}
            </div>
            {activeAction && activeAction !== "build" && (
              <p className="text-[10px] text-primary/70 pb-1">
                {activeAction === "explore" && "🧭 Where do you want to explore?"}
                {activeAction === "interact" && "✋ What do you want to touch or interact with?"}
                {activeAction === "meditate" && "✨ Set your intention for meditation..."}
                {activeAction === "gather" && "🌿 What are you looking for?"}
                {activeAction === "ritual" && "🔥 Describe the ceremony you wish to perform..."}
              </p>
            )}
          </div>

          <div className="px-3 pb-3">
            <div className="max-w-2xl mx-auto flex gap-2">
              <Input
                placeholder={
                  activeAction === "explore" ? "I walk toward the glowing trees..."
                  : activeAction === "interact" ? "I reach out and touch the stone..."
                  : activeAction === "meditate" ? "I close my eyes and breathe..."
                  : activeAction === "gather" ? "I search for healing herbs..."
                  : activeAction === "ritual" ? "We form a circle around the fire..."
                  : "Speak into the realm..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                disabled={sending || building}
              />
              <Button onClick={handleSend} disabled={!input.trim() || sending || building} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Free user overlay */}
        {isFreeUser && (
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border">
            <button
              onClick={() => setShowSeekerGate(true)}
              className="w-full flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Lock className="h-4 w-4" />
              <span className="text-sm font-medium">Subscribe to interact with New Earth</span>
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </button>
          </div>
        )}
      </div>

      {/* Build Dialog */}
      <WorldBuildDialog
        open={buildDialogOpen}
        onClose={() => setBuildDialogOpen(false)}
        onBuild={handleBuildSpec}
        building={building}
      />

      <SeekerGateModal open={showSeekerGate} onClose={() => setShowSeekerGate(false)} />
    </>
  );
};

export default NewEarthWorld;
