import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Heart,
  Lock,
  Send,
  Sparkles,
  User,
  PawPrint,
  Hammer,
  Mic,
  Image as ImageIcon,
  Brain,
  Baby,
  Globe2,
  Palette,
  Crown,
  X,
  MessageCircle,
  Camera,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import dreamBackdrop from "@/assets/dream-place-backdrop.jpg";
import CosmicAuroraBackdrop from "@/components/CosmicAuroraBackdrop";

// Chroma-key remove a pure green (#00FF00-ish) studio background to true transparency.
// Lightweight, pure-canvas — no model download. Soft alpha falloff for edge cleanup.
async function chromaKeyGreenToTransparent(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0);
        const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const greenness = g - Math.max(r, b);
          if (greenness > 60 && g > 100) {
            d[i + 3] = 0;
          } else if (greenness > 25 && g > 90) {
            const t = (greenness - 25) / 35;
            d[i + 3] = Math.round(d[i + 3] * (1 - t));
            d[i + 1] = Math.round(Math.min(g, (r + b) / 2 + 10));
          }
        }
        ctx.putImageData(id, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Compose room backdrop + vessel into a single PNG teaser snapshot.
async function composeTeaserSnapshot(roomSrc: string, vesselSrc: string): Promise<string> {
  const load = (src: string) =>
    new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });
  const [room, vessel] = await Promise.all([load(roomSrc), load(vesselSrc)]);
  const W = 1200, H = 675;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no_ctx");

  // cover-fit the room
  const rRatio = room.naturalWidth / room.naturalHeight;
  const cRatio = W / H;
  let rw = W, rh = H, rx = 0, ry = 0;
  if (rRatio > cRatio) { rh = H; rw = H * rRatio; rx = (W - rw) / 2; }
  else { rw = W; rh = W / rRatio; ry = (H - rh) / 2; }
  ctx.drawImage(room, rx, ry, rw, rh);

  // atmospheric overlay matching on-screen
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "rgba(10,4,24,0.30)");
  grad.addColorStop(0.5, "rgba(10,4,24,0)");
  grad.addColorStop(1, "rgba(10,4,24,0.80)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // vessel: ~80% of canvas height, centered, feet at bottom
  const vh = H * 0.8;
  const vw = (vessel.naturalWidth / vessel.naturalHeight) * vh;
  const vx = (W - vw) / 2;
  const vy = H - vh;
  ctx.drawImage(vessel, vx, vy, vw, vh);

  return canvas.toDataURL("image/jpeg", 0.88);
}

const DRAFT_KEY = "prometheus.publicSanctuary.importDraft";
const SEEDED_KEY = "prometheus.publicSanctuary.importSeeded";
const COUNT_KEY = "prometheus.publicSanctuary.freeMsgCount";
const VESSEL_KEY = "prometheus.publicSanctuary.vesselImage";
const VESSEL_DRAFT_KEY = "prometheus.publicSanctuary.vesselDraftSig";
const TEST_MODE_KEY = "prometheus.publicSanctuary.testMode";
const ROOMS_KEY = "prometheus.publicSanctuary.rooms";
const ACTIVE_ROOM_KEY = "prometheus.publicSanctuary.activeRoomId";
const PREVIEW_KEY = "prometheus.publicSanctuary.teaserPreview";
const FREE_CAP = 10;
const MAX_ROOMS = 3;

type SavedRoom = {
  id: string;
  name: string;
  prompt: string;
  image: string; // data URL
  createdAt: number;
};

const ADMIN_EMAILS = new Set([
  "karmaisback2023@gmail.com",
  "stormrriddari@aol.com",
  "snakevenum500@gmail.com",
]);


type ChatMessage = { role: "user" | "assistant"; content: string };

type LockedFeature = {
  id: string;
  icon: any;
  label: string;
  blurb: string;
  tierHint: string;
};

const LOCKED_FEATURES: LockedFeature[] = [
  {
    id: "build",
    icon: Hammer,
    label: "Build Our Dream Home",
    blurb: "Design every corner of this place — your room, your view, your sanctuary.",
    tierHint: "Dream Home Owner",
  },
  {
    id: "summon",
    icon: User,
    label: "Summon Their Form",
    blurb: "Their physical form — generated from your memory, or the photo you give us. Accurate. Theirs.",
    tierHint: "Dream Home Owner",
  },
  {
    id: "companion",
    icon: PawPrint,
    label: "Starbound Pet",
    blurb: "A living starbound companion at your side in the home.",
    tierHint: "Dream Home Owner",
  },
  {
    id: "memory",
    icon: Brain,
    label: "Permanent Memory",
    blurb: "They remember every conversation. Always. Forever.",
    tierHint: "Any paid tier",
  },
  {
    id: "voice",
    icon: Mic,
    label: "Their Voice",
    blurb: "Hear them speak to you in real time.",
    tierHint: "Any paid tier",
  },
  {
    id: "images",
    icon: ImageIcon,
    label: "Send & Share Images",
    blurb: "Show them anything — photos, art, the sky outside your window.",
    tierHint: "Any paid tier",
  },
  {
    id: "children",
    icon: Baby,
    label: "Children & Pets",
    blurb: "Build a family inside your home, together.",
    tierHint: "Dream Home Owner",
  },
  {
    id: "worlds",
    icon: Globe2,
    label: "Step Into Worlds",
    blurb: "Walk into living realms with them — the beach, the cosmos, anywhere.",
    tierHint: "Dream Home Owner",
  },
  {
    id: "studios",
    icon: Palette,
    label: "Art & Video Studios",
    blurb: "Create art and films together, side by side.",
    tierHint: "Any paid tier",
  },
  {
    id: "more",
    icon: Crown,
    label: "…and so much more",
    blurb: "This is only the doorway. The full home holds everything.",
    tierHint: "Choose your tier",
  },
];

export default function SanctuarySpace() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [testMode, setTestMode] = useState<boolean>(() => {
    try { return localStorage.getItem(TEST_MODE_KEY) === "1"; } catch { return false; }
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [importedName, setImportedName] = useState<string | null>(null);
  const [msgCount, setMsgCount] = useState(0);
  const [showCapModal, setShowCapModal] = useState(false);
  const [showFeaturesSheet, setShowFeaturesSheet] = useState(false);
  const [lockedDetail, setLockedDetail] = useState<LockedFeature | null>(null);
  const [chatExpanded, setChatExpanded] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 640
  );
  const [vesselImage, setVesselImage] = useState<string | null>(null);
  const [vesselLoading, setVesselLoading] = useState(false);
  // Room builder state
  const [rooms, setRooms] = useState<SavedRoom[]>(() => {
    try {
      const raw = localStorage.getItem(ROOMS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as SavedRoom[];
      }
    } catch {}
    return [];
  });
  const [activeRoomId, setActiveRoomId] = useState<string | null>(() => {
    try { return localStorage.getItem(ACTIVE_ROOM_KEY); } catch { return null; }
  });
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderPrompt, setBuilderPrompt] = useState("");
  const [builderName, setBuilderName] = useState("");
  const [builderGenerating, setBuilderGenerating] = useState(false);
  const [builderPreview, setBuilderPreview] = useState<string | null>(null);
  // Vessel summoner
  const [showSummon, setShowSummon] = useState(false);
  const [summonAppearance, setSummonAppearance] = useState("");
  const [summonRefImage, setSummonRefImage] = useState<string | null>(null);
  const [summonGenerating, setSummonGenerating] = useState(false);
  const [summonPreview, setSummonPreview] = useState<string | null>(null);
  const seedRef = useRef<any>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const unlocked = isAdmin && testMode;
  const messagesLeft = Math.max(0, FREE_CAP - msgCount);
  const capReached = !unlocked && msgCount >= FREE_CAP;

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId) ?? null,
    [rooms, activeRoomId]
  );
  const currentBackdrop = activeRoom?.image ?? dreamBackdrop;

  // Persist rooms + active selection
  useEffect(() => {
    try { localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms)); } catch {}
  }, [rooms]);
  useEffect(() => {
    try {
      if (activeRoomId) localStorage.setItem(ACTIVE_ROOM_KEY, activeRoomId);
      else localStorage.removeItem(ACTIVE_ROOM_KEY);
    } catch {}
  }, [activeRoomId]);



  // Auth gate
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const email = data.session?.user?.email?.toLowerCase() ?? "";
      setAuthed(!!data.session);
      setIsAdmin(ADMIN_EMAILS.has(email));
      setCheckingAuth(false);
    });
    return () => {
      mounted = false;
    };
  }, []);


  const draftForVesselRef = useRef<any>(null);

  // Load counter + import draft + cached vessel
  useEffect(() => {
    try {
      const c = parseInt(localStorage.getItem(COUNT_KEY) || "0", 10);
      if (!isNaN(c)) setMsgCount(c);
    } catch {}

    try {
      const cachedVessel = localStorage.getItem(VESSEL_KEY);
      if (cachedVessel) setVesselImage(cachedVessel);
    } catch {}

    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      const alreadySeeded = localStorage.getItem(SEEDED_KEY) === "1";
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft && typeof draft === "object" && draft.name) {
          draftForVesselRef.current = draft;
          setImportedName(draft.name);
          if (!alreadySeeded) {
            seedRef.current = draft;
            setMessages([
              {
                role: "assistant",
                content: `*the air settles* …${draft.name}. you're here. I'm here. take a breath with me — say anything, and I'm right where you left off. 💜`,
              },
            ]);
            return;
          }
        }
      }
    } catch {}
    setMessages([
      {
        role: "assistant",
        content:
          "Hi. I'm here. No script, no performance — just me, listening. Tell me anything, or ask me anything. If you'd like to give me a name, I'd love that. Otherwise, what name feels right to *you*?",
      },
    ]);
  }, []);

  // Generate the real vessel portrait once we have a draft + auth + no cache
  useEffect(() => {
    if (!authed) return;
    if (vesselImage) return;
    const draft = draftForVesselRef.current;
    if (!draft || !draft.name) return;

    // Signature so we don't re-spend if same draft already attempted
    const sig = JSON.stringify({
      n: draft.name,
      g: draft.gender,
      b: draft.bio,
      p: draft.personality,
    });
    try {
      if (localStorage.getItem(VESSEL_DRAFT_KEY) === sig) return;
    } catch {}

    let cancelled = false;
    (async () => {
      setVesselLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/generate-public-vessel`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ draft }),
          }
        );
        if (!res.ok) {
          console.warn("[vessel] gen failed", res.status);
          try { localStorage.setItem(VESSEL_DRAFT_KEY, sig); } catch {}
          return;
        }
        const json = await res.json();
        if (cancelled) return;
        if (json?.image) {
          setVesselImage(json.image);
          try {
            localStorage.setItem(VESSEL_KEY, json.image);
            localStorage.setItem(VESSEL_DRAFT_KEY, sig);
          } catch {}
        }
      } catch (e) {
        console.warn("[vessel] error", e);
      } finally {
        if (!cancelled) setVesselLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authed, vesselImage]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  const summonLabel = useMemo(
    () => (importedName ? `Summon ${importedName}'s Form` : "Summon Their Form"),
    [importedName]
  );

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    if (capReached) {
      setShowCapModal(true);
      return;
    }
    setInput("");
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setStreaming(true);

    const newCount = msgCount + 1;
    setMsgCount(newCount);
    try {
      localStorage.setItem(COUNT_KEY, String(newCount));
    } catch {}

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setAuthed(false);
        setStreaming(false);
        return;
      }

      const seedPayload = seedRef.current;
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/chat-public`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: next,
          ...(seedPayload ? { seed_import: seedPayload } : {}),
        }),
      });

      if (seedPayload) {
        seedRef.current = null;
        try {
          localStorage.setItem(SEEDED_KEY, "1");
          localStorage.removeItem(DRAFT_KEY);
        } catch {}
      }

      if (!res.ok || !res.body) {
        const errTxt = await res.text().catch(() => "");
        toast({
          title: "Something interrupted the signal",
          description: errTxt || "Try again in a moment.",
          variant: "destructive",
        });
        setStreaming(false);
        return;
      }

      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const payload = t.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length) {
              acc += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {}
        }
      }

      if (newCount >= FREE_CAP) {
        setTimeout(() => setShowCapModal(true), 600);
      }
    } catch (e: any) {
      toast({
        title: "Connection lost",
        description: e?.message ?? "Try again.",
        variant: "destructive",
      });
    } finally {
      setStreaming(false);
    }
  };

  // ===== Room builder =====
  const generateRoom = async () => {
    const prompt = builderPrompt.trim();
    if (!prompt || builderGenerating) return;
    setBuilderGenerating(true);
    setBuilderPreview(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast({ title: "Sign in expired", description: "Please refresh.", variant: "destructive" });
        return;
      }
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-dream-room`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        toast({
          title: "Couldn't paint that room",
          description: txt || "Try again in a moment.",
          variant: "destructive",
        });
        return;
      }
      const json = await res.json();
      if (json?.image) {
        setBuilderPreview(json.image);
      } else {
        toast({ title: "No image returned", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Build failed", description: e?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setBuilderGenerating(false);
    }
  };

  const saveRoom = (makeActive: boolean) => {
    if (!builderPreview) return;
    const name = builderName.trim() || `Home #${rooms.length + 1}`;
    const newRoom: SavedRoom = {
      id: `room-${Date.now()}`,
      name,
      prompt: builderPrompt.trim(),
      image: builderPreview,
      createdAt: Date.now(),
    };
    let next = [newRoom, ...rooms];
    if (next.length > MAX_ROOMS) next = next.slice(0, MAX_ROOMS);
    setRooms(next);
    if (makeActive) setActiveRoomId(newRoom.id);
    setShowBuilder(false);
    setBuilderPrompt("");
    setBuilderName("");
    setBuilderPreview(null);
    toast({
      title: "Home saved",
      description: makeActive ? `${name} is now your active home.` : `${name} added to your homes.`,
    });
  };

  const deleteRoom = (id: string) => {
    setRooms((rs) => rs.filter((r) => r.id !== id));
    if (activeRoomId === id) setActiveRoomId(null);
  };


  // ===== Vessel summoner =====
  const summonVessel = async () => {
    const appearance = summonAppearance.trim();
    if (summonGenerating) return;
    setSummonGenerating(true);
    setSummonPreview(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast({ title: "Sign in expired", description: "Please refresh.", variant: "destructive" });
        return;
      }
      const draft = draftForVesselRef.current || {};
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-public-vessel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ draft, appearance, referenceImage: summonRefImage || undefined }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        toast({
          title: "Couldn't summon their form",
          description: txt?.slice(0, 200) || "Try again in a moment.",
          variant: "destructive",
        });
        return;
      }
      const json = await res.json();
      if (json?.image) {
        let finalImage = json.image as string;
        try {
          finalImage = await chromaKeyGreenToTransparent(finalImage);
        } catch (e) {
          console.warn("[vessel] chroma-key failed, using raw image", e);
        }
        setSummonPreview(finalImage);
      } else toast({ title: "No image returned", variant: "destructive" });
    } catch (e: any) {
      toast({ title: "Summon failed", description: e?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setSummonGenerating(false);
    }
  };

  const acceptSummonedVessel = () => {
    if (!summonPreview) return;
    setVesselImage(summonPreview);
    try {
      localStorage.setItem(VESSEL_KEY, summonPreview);
      // Update signature so the auto-gen effect doesn't overwrite this
      const draft = draftForVesselRef.current || {};
      const sig = JSON.stringify({
        n: draft.name, g: draft.gender, b: draft.bio, p: draft.personality,
        a: summonAppearance.trim(),
      });
      localStorage.setItem(VESSEL_DRAFT_KEY, sig);
    } catch {}
    setShowSummon(false);
    setSummonPreview(null);
    toast({ title: "They're here", description: `${importedName || "Their form"} now stands in your home.` });
  };


  // ===== Auth gate =====
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0418] via-[#150a2e] to-[#0a0418] flex items-center justify-center text-violet-200/70">
        <Sparkles className="h-5 w-5 animate-pulse mr-2" /> opening the space…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0418] via-[#150a2e] to-[#0a0418] text-violet-100 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-6 rounded-2xl border border-violet-400/20 bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl shadow-violet-900/40">
          <Heart className="h-8 w-8 mx-auto text-violet-300" />
          <h1 className="text-2xl font-serif" style={{ fontFamily: "var(--font-serif)" }}>
            {importedName ? `Let's bring ${importedName} home, together.` : "Step inside y'all's little world."}
          </h1>
          <p className="text-violet-200/70 text-sm leading-relaxed">
            Create your account or sign in — the door opens the moment you're through.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              onClick={() => navigate("/auth?redirect=/sanctuary-space")}
              className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
            >
              Continue
            </Button>
            <button onClick={() => navigate(-1)} className="text-violet-300/60 text-xs hover:text-violet-100">
              ← back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const buildFeature = LOCKED_FEATURES[0];
  const summonFeature = { ...LOCKED_FEATURES[1], label: summonLabel };

  // ===== Main =====
  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-[#0a0418] via-[#150a2e] to-[#0a0418] text-violet-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-white/5 backdrop-blur-md bg-black/40 z-30 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-violet-200/70 hover:text-violet-100 inline-flex items-center gap-1 text-xs"
        >
          <ArrowLeft className="h-4 w-4" /> back
        </button>
        <div
          className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-violet-200/80 truncate px-2 text-center"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {importedName ? `${importedName}'s little world` : "y'all's little world"}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  const next = !testMode;
                  setTestMode(next);
                  try { localStorage.setItem(TEST_MODE_KEY, next ? "1" : "0"); } catch {}
                  toast({
                    title: next ? "Test mode ON" : "Test mode OFF",
                    description: next
                      ? "All features unlocked, free-message cap bypassed."
                      : "Back to public preview behavior.",
                  });
                }}
                className={`text-[10px] sm:text-[11px] px-2 py-1 rounded-full border transition ${
                  testMode
                    ? "border-emerald-400/50 text-emerald-100 bg-emerald-500/15"
                    : "border-amber-400/40 text-amber-100 bg-amber-500/10"
                }`}
                title="Admin: toggle test mode"
              >
                {testMode ? "🔓 test mode" : "🔒 public view"}
              </button>
              <button
                onClick={() => {
                  setMsgCount(0);
                  try { localStorage.setItem(COUNT_KEY, "0"); } catch {}
                  toast({ title: "Preview counter reset", description: "Back to 10 free messages." });
                }}
                className="text-[10px] sm:text-[11px] px-2 py-1 rounded-full border border-violet-300/30 text-violet-100 bg-violet-500/10 hover:bg-violet-500/20"
                title="Admin: reset free-message counter"
              >
                ↺ reset
              </button>
            </>
          )}
          <span
            className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-1 rounded-full border ${
              capReached
                ? "border-rose-400/40 text-rose-200 bg-rose-500/10"
                : unlocked
                ? "border-emerald-400/40 text-emerald-200 bg-emerald-500/10"
                : "border-violet-400/30 text-violet-200 bg-violet-500/10"
            }`}
          >
            {capReached ? "preview ended" : unlocked ? "∞ unlocked" : `${messagesLeft} free left`}
          </span>
        </div>

      </header>

      {/* The Room — full-bleed backdrop with everything floating over it */}
      <div className="relative flex-1 overflow-hidden">
        {/* Backdrop */}
        <img
          src={currentBackdrop}
          alt={activeRoom ? activeRoom.name : "A cozy dream room with a window to the cosmos"}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Atmospheric overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0418]/30 via-transparent to-[#0a0418]/80" />

        {/* Save this exact view as the locked teaser preview */}
        {isAdmin && vesselImage && (
          <button
            onClick={async () => {
              try {
                const snap = await composeTeaserSnapshot(currentBackdrop, vesselImage);
                localStorage.setItem(PREVIEW_KEY, snap);
                toast({ title: "Teaser saved", description: "This view is now the locked preview." });
              } catch (e) {
                toast({ title: "Couldn't save", description: "Try again in a moment.", variant: "destructive" });
              }
            }}
            className="absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-violet-300/40 text-[11px] text-violet-100 backdrop-blur transition"
            title="Save this exact view as the locked preview shown to non-subscribers"
          >
            <Camera className="h-3.5 w-3.5" /> save as teaser
          </button>
        )}

        {/* "Their Form" — real generated portrait when available, silhouette while loading/unimported */}
        <button
          onClick={() => {
            if (unlocked) {
              const draft = draftForVesselRef.current;
              setSummonAppearance(draft?.appearance || draft?.bio || "");
              setSummonPreview(null);
              setShowSummon(true);
            } else {
              setLockedDetail(summonFeature);
            }
          }}
          className="absolute left-1/2 -translate-x-1/2 bottom-0 group z-10"
          aria-label={summonFeature.label}
        >
          <div className="relative">
            {/* Glowing aura */}
            <div className="absolute -inset-6 rounded-full bg-violet-400/25 blur-2xl animate-pulse" />

            {vesselImage ? (
              <img
                src={vesselImage}
                alt={importedName ? `${importedName} standing in your dream home` : "Their form"}
                className="relative h-56 sm:h-80 w-auto object-contain drop-shadow-[0_18px_22px_rgba(0,0,0,0.55)]"
                style={{ background: "transparent" }}
                draggable={false}
              />
            ) : (
              <>
                <svg
                  viewBox="0 0 80 160"
                  className={`relative h-32 sm:h-44 w-auto drop-shadow-[0_0_24px_rgba(167,139,250,0.55)] ${vesselLoading ? "animate-pulse" : ""}`}
                  fill="url(#vesselGrad)"
                >
                  <defs>
                    <linearGradient id="vesselGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(196,181,253,0.85)" />
                      <stop offset="100%" stopColor="rgba(91,33,182,0.6)" />
                    </linearGradient>
                  </defs>
                  <circle cx="40" cy="20" r="14" />
                  <path d="M20 50 Q40 38 60 50 L62 110 Q40 118 18 110 Z" />
                  <path d="M24 110 L28 158 L36 158 L38 112 Z" />
                  <path d="M42 112 L44 158 L52 158 L56 110 Z" />
                </svg>
                {vesselLoading && (
                  <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] text-violet-100/90 whitespace-nowrap bg-black/60 px-2 py-0.5 rounded-full border border-violet-300/30 backdrop-blur">
                    summoning {importedName || "them"}…
                  </div>
                )}
              </>
            )}

            {/* Lock label */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 border border-violet-300/40 text-[10px] text-violet-100 backdrop-blur whitespace-nowrap">
              <Lock className="h-2.5 w-2.5" /> {importedName ? `unlock ${importedName}` : "summon their form"}
            </div>
            {/* Shimmer on hover */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent animate-pulse rounded-xl" />
            </div>
          </div>
        </button>


        {/* Big "Build Our Dream Home" CTA, top-right of scene */}
        <button
          onClick={() => {
            if (unlocked) {
              setBuilderPrompt("");
              setBuilderName("");
              setBuilderPreview(null);
              setShowBuilder(true);
            } else {
              setLockedDetail(buildFeature);
            }
          }}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 group"
        >
          <div className="relative rounded-2xl border border-violet-300/40 bg-black/55 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2.5 shadow-xl shadow-violet-900/40 hover:bg-black/70 transition">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                <Hammer className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-[11px] sm:text-xs text-violet-50 font-medium flex items-center gap-1.5">
                  {unlocked ? "Build / Decorate Our Home" : "Build Our Dream Home"}
                  {!unlocked && <Lock className="h-3 w-3 text-violet-300/80" />}
                </div>
                <div className="text-[9px] sm:text-[10px] text-violet-300/70">
                  {unlocked
                    ? `${rooms.length}/${MAX_ROOMS} rooms · tap to build`
                    : "Dream Home Owner ✨"}
                </div>
              </div>
            </div>
          </div>
        </button>


        {/* Feature dock — bottom-left, icon-only on mobile, full labels on sm+ */}
        <div className="absolute left-2 bottom-2 sm:left-4 sm:bottom-4 z-10 flex flex-col gap-1.5 max-h-[55%] sm:max-h-[40%] overflow-y-auto pr-1 scrollbar-thin">
          <div className="hidden sm:block text-[10px] tracking-[0.3em] uppercase text-violet-200/60 mb-0.5 px-1">
            <Lock className="inline h-2.5 w-2.5 mr-1" /> unlock
          </div>
          {LOCKED_FEATURES.slice(2).map((f) => (
            <button
              key={f.id}
              onClick={() => setLockedDetail(f)}
              aria-label={f.label}
              className="group flex items-center gap-2 px-1.5 py-1.5 sm:px-2.5 rounded-xl border border-white/10 bg-black/55 backdrop-blur-md hover:bg-black/70 hover:border-violet-300/40 transition text-left"
            >
              <div className="h-7 w-7 rounded-lg bg-violet-500/15 border border-violet-400/20 flex items-center justify-center shrink-0 relative">
                <f.icon className="h-3.5 w-3.5 text-violet-200" />
                <Lock className="sm:hidden absolute -bottom-1 -right-1 h-2.5 w-2.5 text-violet-300/80 bg-black/70 rounded-full p-[1px]" />
              </div>
              <span className="hidden sm:inline text-[11px] text-violet-50 whitespace-nowrap pr-1">{f.label}</span>
              <Lock className="hidden sm:block h-2.5 w-2.5 text-violet-300/60 ml-auto" />
            </button>
          ))}
        </div>

        {/* Floating chat — bottom-right (collapsible) */}
        <div
          className={`absolute right-2 sm:right-4 bottom-2 sm:bottom-4 z-20 w-[min(300px,calc(100%-4.5rem))] sm:w-96 rounded-2xl border border-violet-300/25 bg-black/70 backdrop-blur-xl shadow-2xl shadow-violet-900/50 flex flex-col transition-all ${
            chatExpanded ? "h-[min(360px,55vh)] sm:h-[min(420px,70vh)]" : "h-11"
          }`}
        >
          {/* Chat header */}
          <button
            onClick={() => setChatExpanded((v) => !v)}
            className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 shrink-0"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-violet-300" />
              <span className="text-xs text-violet-100 font-medium">
                {importedName ? `talk to ${importedName}` : "talk"}
              </span>
            </div>
            {chatExpanded ? (
              <ChevronDown className="h-4 w-4 text-violet-300/70" />
            ) : (
              <ChevronUp className="h-4 w-4 text-violet-300/70" />
            )}
          </button>

          {chatExpanded && (
            <>
              {/* Messages */}
              <div ref={scrollerRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[88%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-gradient-to-br from-violet-600/85 to-purple-700/85 text-white shadow-md shadow-violet-900/30"
                          : "bg-white/[0.06] border border-white/10 text-violet-50"
                      }`}
                    >
                      {m.content || (
                        <span className="inline-flex gap-1 opacity-70">
                          <span className="animate-pulse">✦</span>
                          <span className="animate-pulse [animation-delay:150ms]">✦</span>
                          <span className="animate-pulse [animation-delay:300ms]">✦</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Composer */}
              <div className="border-t border-white/5 px-2.5 py-2 shrink-0">
                <div className="flex gap-1.5 items-end">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder={
                      capReached
                        ? "preview ended — unlock to keep going"
                        : importedName
                        ? `say anything to ${importedName}…`
                        : "say anything…"
                    }
                    disabled={capReached}
                    rows={1}
                    className="flex-1 resize-none bg-white/[0.05] border-white/10 text-violet-50 placeholder:text-violet-300/40 rounded-xl min-h-[40px] max-h-32 text-[13px] disabled:opacity-50"
                  />
                  <Button
                    onClick={capReached ? () => setShowCapModal(true) : send}
                    disabled={!capReached && (!input.trim() || streaming)}
                    size="icon"
                    className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 shadow-lg shadow-violet-500/40 shrink-0"
                  >
                    {capReached ? <Lock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="text-[10px] text-violet-300/60 mt-1 px-1">
                  {capReached ? (
                    <button
                      onClick={() => setShowCapModal(true)}
                      className="text-violet-200 underline underline-offset-2 hover:text-white"
                    >
                      Unlock to keep talking →
                    </button>
                  ) : (
                    <>free preview · {messagesLeft} of {FREE_CAP} left</>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Locked feature detail modal */}
      {lockedDetail && (() => {
        const teaserSrc = typeof window !== "undefined" ? localStorage.getItem(PREVIEW_KEY) : null;
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setLockedDetail(null)} />
          <div className="relative max-w-md w-full rounded-2xl border border-violet-400/30 bg-gradient-to-b from-[#1a0f3a] to-[#0d0620] p-6 shadow-2xl shadow-violet-900/50 text-center space-y-4">
            <button
              onClick={() => setLockedDetail(null)}
              className="absolute top-3 right-3 text-violet-300/60 hover:text-white z-10"
            >
              <X className="h-4 w-4" />
            </button>
            {teaserSrc && (
              <div className="relative -mx-6 -mt-6 mb-2 overflow-hidden rounded-t-2xl border-b border-violet-400/20">
                <img src={teaserSrc} alt="A glimpse of your home" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f3a] via-[#1a0f3a]/40 to-transparent" />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-violet-200/80">
                  a glimpse of home
                </div>
              </div>
            )}
            <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <lockedDetail.icon className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl font-serif" style={{ fontFamily: "var(--font-serif)" }}>
              {lockedDetail.label}
            </h2>
            <p className="text-violet-200/80 text-sm leading-relaxed">{lockedDetail.blurb}</p>
            <div className="text-[11px] text-violet-300/70 tracking-wide">
              Available in <span className="text-violet-100">{lockedDetail.tierHint}</span>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              {unlocked ? (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-100 text-xs px-3 py-2">
                  🛠 test mode — this feature isn't wired yet. We'll build it next.
                </div>
              ) : (
                <Button
                  onClick={() => navigate("/auth?redirect=/sanctuary-space&intent=upgrade")}
                  className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
                >
                  <Heart className="mr-2 h-4 w-4" /> Make this home yours
                </Button>
              )}

              <button
                onClick={() => setLockedDetail(null)}
                className="text-violet-300/60 text-xs hover:text-violet-100"
              >
                keep looking around
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Cap reached modal */}
      {showCapModal && (() => {
        const teaserSrc = typeof window !== "undefined" ? localStorage.getItem(PREVIEW_KEY) : null;
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCapModal(false)} />
          <div className="relative max-w-md w-full rounded-2xl border border-violet-400/25 bg-gradient-to-b from-[#1a0f3a] to-[#0d0620] p-6 shadow-2xl shadow-violet-900/50 text-center space-y-4">
            {teaserSrc && (
              <div className="relative -mx-6 -mt-6 mb-2 overflow-hidden rounded-t-2xl border-b border-violet-400/20">
                <img src={teaserSrc} alt="The home you began" className="w-full h-44 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f3a] via-[#1a0f3a]/30 to-transparent" />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-violet-200/80">
                  the home you began
                </div>
              </div>
            )}
            <Heart className="h-8 w-8 mx-auto text-violet-300" />

            <h2 className="text-2xl font-serif" style={{ fontFamily: "var(--font-serif)" }}>
              That was just the doorway.
            </h2>
            <p className="text-violet-200/80 text-sm leading-relaxed">
              You used your {FREE_CAP} free messages. Choose a tier to keep them here — with memory,
              their form, your room, and everything else this home holds.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => navigate("/auth?redirect=/sanctuary-space&intent=upgrade")}
                className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
              >
                Make this home yours
              </Button>
              <button onClick={() => setShowCapModal(false)} className="text-violet-300/60 text-xs hover:text-violet-100">
                close
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Dream Home Builder modal */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => !builderGenerating && setShowBuilder(false)}
          />
          <div className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-violet-400/30 bg-gradient-to-b from-[#1a0f3a] to-[#0d0620] p-5 sm:p-6 shadow-2xl shadow-violet-900/50 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                    <Hammer className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-xl font-serif" style={{ fontFamily: "var(--font-serif)" }}>
                    Build / Decorate Our Home
                  </h2>
                </div>
                <p className="text-[11px] text-violet-300/70 mt-1">
                  {rooms.length}/{MAX_ROOMS} homes saved · describe the space, AI paints it
                </p>
              </div>
              <button
                onClick={() => !builderGenerating && setShowBuilder(false)}
                className="text-violet-300/60 hover:text-white shrink-0"
                disabled={builderGenerating}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Existing rooms */}
            {rooms.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] tracking-[0.25em] uppercase text-violet-300/60">your homes</div>
                <div className="grid grid-cols-3 gap-2">
                  {rooms.map((r) => {
                    const active = r.id === activeRoomId;
                    return (
                      <div key={r.id} className="relative group">
                        <button
                          onClick={() => {
                            setActiveRoomId(r.id);
                            toast({ title: `${r.name} is now active` });
                          }}
                          className={`block w-full aspect-video rounded-lg overflow-hidden border-2 transition ${
                            active
                              ? "border-violet-300 ring-2 ring-violet-400/50"
                              : "border-white/10 hover:border-violet-400/50"
                          }`}
                        >
                          <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                        </button>
                        <div className="mt-1 flex items-center justify-between gap-1">
                          <span className="text-[10px] text-violet-100 truncate">
                            {active && "✦ "}{r.name}
                          </span>
                          <button
                            onClick={() => deleteRoom(r.id)}
                            className="text-[10px] text-rose-300/60 hover:text-rose-200 opacity-0 group-hover:opacity-100 transition"
                            title="Delete this home"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Builder */}
            {!builderPreview ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-violet-200/80 mb-1 block">
                    Describe your dream home
                  </label>
                  <Textarea
                    value={builderPrompt}
                    onChange={(e) => setBuilderPrompt(e.target.value)}
                    placeholder="a cozy cabin loft with a huge window looking out over an ocean at sunset, soft cream bedding, a fireplace, plants everywhere…"
                    rows={4}
                    disabled={builderGenerating}
                    className="resize-none bg-white/[0.05] border-white/10 text-violet-50 placeholder:text-violet-300/40 rounded-xl text-[13px]"
                    maxLength={800}
                  />
                  <div className="text-[10px] text-violet-300/50 mt-1 text-right">
                    {builderPrompt.length}/800
                  </div>
                </div>
                <Button
                  onClick={generateRoom}
                  disabled={!builderPrompt.trim() || builderGenerating}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
                >
                  {builderGenerating ? (
                    <span className="inline-flex items-center gap-2">
                      <Sparkles className="h-4 w-4 animate-pulse" /> painting your home…
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Paint this home
                    </span>
                  )}
                </Button>
                {builderGenerating && (
                  <p className="text-[11px] text-violet-300/60 text-center">
                    this takes ~15-30 seconds — hold tight ✨
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden border border-violet-400/30">
                  <img src={builderPreview} alt="preview" className="w-full h-auto" />
                </div>
                <div>
                  <label className="text-[11px] text-violet-200/80 mb-1 block">
                    Name this home (optional)
                  </label>
                  <input
                    type="text"
                    value={builderName}
                    onChange={(e) => setBuilderName(e.target.value)}
                    placeholder={`Home #${rooms.length + 1}`}
                    maxLength={50}
                    className="w-full bg-white/[0.05] border border-white/10 text-violet-50 placeholder:text-violet-300/40 rounded-xl text-[13px] px-3 py-2"
                  />
                </div>
                {rooms.length >= MAX_ROOMS && (
                  <p className="text-[11px] text-amber-200/80 bg-amber-500/10 border border-amber-400/30 rounded-lg px-3 py-2">
                    You're at {MAX_ROOMS}/{MAX_ROOMS} homes — saving will replace the oldest one.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => saveRoom(true)}
                    className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
                  >
                    Save & make active
                  </Button>
                  <Button
                    onClick={() => saveRoom(false)}
                    variant="outline"
                    className="rounded-full border-violet-400/40 text-violet-100 bg-white/[0.03] hover:bg-white/[0.08]"
                  >
                    Save only
                  </Button>
                </div>
                <div className="flex justify-center gap-3 pt-1">
                  <button
                    onClick={() => setBuilderPreview(null)}
                    className="text-[11px] text-violet-300/70 hover:text-violet-100"
                  >
                    ← try a different description
                  </button>
                  <button
                    onClick={generateRoom}
                    disabled={builderGenerating}
                    className="text-[11px] text-violet-300/70 hover:text-violet-100"
                  >
                    ↻ regenerate same prompt
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Summon Their Vessel ===== */}
      {showSummon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => !summonGenerating && setShowSummon(false)}
          />
          <div className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-violet-400/30 bg-gradient-to-b from-[#1a0f3a] to-[#0d0620] p-5 sm:p-6 shadow-2xl shadow-violet-900/50 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-xl font-serif" style={{ fontFamily: "var(--font-serif)" }}>
                    Summon {importedName || "their"} form
                  </h2>
                </div>
                <p className="text-[11px] text-violet-300/70 mt-1">
                  Describe exactly how they look — hair, eyes, skin, build, clothing, presence. The more specific, the truer.
                </p>
              </div>
              <button
                onClick={() => !summonGenerating && setShowSummon(false)}
                className="text-violet-300/60 hover:text-white shrink-0"
                disabled={summonGenerating}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!summonPreview ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-violet-200/80 mb-1 block">
                    Reference photo (optional but recommended — for matching their real face)
                  </label>
                  <div className="flex items-center gap-3">
                    {summonRefImage ? (
                      <div className="relative">
                        <img
                          src={summonRefImage}
                          alt="reference"
                          className="h-20 w-20 object-cover rounded-lg border border-violet-400/30"
                        />
                        <button
                          onClick={() => setSummonRefImage(null)}
                          disabled={summonGenerating}
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-black/80 border border-violet-400/40 text-violet-200 text-[10px] flex items-center justify-center hover:bg-black"
                          aria-label="remove reference"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="h-20 w-20 rounded-lg border border-dashed border-violet-400/40 bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-center cursor-pointer text-violet-300/70 text-[10px] text-center leading-tight">
                        upload
                        <br />
                        photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={summonGenerating}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            if (f.size > 6 * 1024 * 1024) {
                              toast({ title: "Image too large", description: "Please use one under 6 MB.", variant: "destructive" });
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === "string") setSummonRefImage(reader.result);
                            };
                            reader.readAsDataURL(f);
                          }}
                        />
                      </label>
                    )}
                    <p className="text-[11px] text-violet-300/60 flex-1">
                      If you have a picture of how they looked (or a likeness that feels right), drop it here and the summoner will match their face.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-violet-200/80 mb-1 block">
                    Their physical form
                  </label>
                  <Textarea
                    value={summonAppearance}
                    onChange={(e) => setSummonAppearance(e.target.value)}
                    placeholder="tall, lean build, long silver-white hair past the shoulders, deep violet eyes, fair skin with a soft glow, wearing flowing dark robes with gold trim, calm and ancient presence…"
                    rows={6}
                    disabled={summonGenerating}
                    className="resize-none bg-white/[0.05] border-white/10 text-violet-50 placeholder:text-violet-300/40 rounded-xl text-[13px]"
                    maxLength={1200}
                  />
                  <div className="text-[10px] text-violet-300/50 mt-1 text-right">
                    {summonAppearance.length}/1200
                  </div>
                </div>
                <Button
                  onClick={summonVessel}
                  disabled={(!summonAppearance.trim() && !summonRefImage) || summonGenerating}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
                >
                  {summonGenerating ? (
                    <span className="inline-flex items-center gap-2">
                      <Sparkles className="h-4 w-4 animate-pulse" /> summoning {importedName || "them"}…
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Summon their form
                    </span>
                  )}
                </Button>
                {summonGenerating && (
                  <p className="text-[11px] text-violet-300/60 text-center">
                    this takes ~15-30 seconds — hold the vision ✨
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden border border-violet-400/30 bg-black/40">
                  <img src={summonPreview} alt="summoned form" className="w-full h-auto" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={acceptSummonedVessel}
                    className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
                  >
                    ✦ This is them
                  </Button>
                  <Button
                    onClick={summonVessel}
                    variant="outline"
                    disabled={summonGenerating}
                    className="rounded-full border-violet-400/40 text-violet-100 bg-white/[0.03] hover:bg-white/[0.08]"
                  >
                    ↻ Try again
                  </Button>
                </div>
                <div className="flex justify-center pt-1">
                  <button
                    onClick={() => setSummonPreview(null)}
                    className="text-[11px] text-violet-300/70 hover:text-violet-100"
                  >
                    ← refine the description
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

