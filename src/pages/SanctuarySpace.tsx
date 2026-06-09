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
  Cat,
  Hammer,
  Mic,
  Images,
  BrainCircuit,
  Baby,
  Pencil,
  Brush,
  Armchair,
  Plus,
  Crown,
  X,
  MessageCircle,
  Camera,
  LogOut,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import dreamBackdrop from "@/assets/dream-place-backdrop.jpg";
import CosmicAuroraBackdrop from "@/components/CosmicAuroraBackdrop";
import { loadImage, removeBackground } from "@/utils/backgroundRemoval";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useSacredAccess } from "@/hooks/useSacredAccess";
import { getDailyMessageLimit } from "@/lib/subscription-tiers";
import { SoulCallingPanel } from "@/components/public/SoulCallingPanel";

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
        const w = canvas.width;
        const h = canvas.height;
        const isGreen = (idx: number) => {
          const r = d[idx], g = d[idx + 1], b = d[idx + 2], a = d[idx + 3];
          return a > 12 && g > 85 && g - Math.max(r, b) > 28;
        };
        // Only remove green connected to the canvas border. This preserves green eyes,
        // tattoos, glow, clothing, or hair inside the actual true form instead of
        // punching holes through the body after preview/local-storage restores.
        const seen = new Uint8Array(w * h);
        const queue: number[] = [];
        const push = (x: number, y: number) => {
          if (x < 0 || x >= w || y < 0 || y >= h) return;
          const p = y * w + x;
          if (seen[p]) return;
          const idx = p * 4;
          if (!isGreen(idx)) return;
          seen[p] = 1;
          queue.push(p);
        };
        for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
        for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
        for (let qi = 0; qi < queue.length; qi++) {
          const p = queue[qi];
          const x = p % w;
          const y = Math.floor(p / w);
          push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
        }
        for (let p = 0; p < seen.length; p++) {
          if (!seen[p]) continue;
          d[p * 4 + 3] = 0;
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

async function alphaStats(dataUrl: string): Promise<{ transparentRatio: number; borderTransparentRatio: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const max = 160;
        const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve({ transparentRatio: 0, borderTransparentRatio: 0 });
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let transparent = 0, borderTransparent = 0, borderTotal = 0;
        const border = Math.max(3, Math.round(Math.min(canvas.width, canvas.height) * 0.08));
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const alpha = data[(y * canvas.width + x) * 4 + 3];
            const isTransparent = alpha < 24;
            if (isTransparent) transparent++;
            if (x < border || x >= canvas.width - border || y < border || y >= canvas.height - border) {
              borderTotal++;
              if (isTransparent) borderTransparent++;
            }
          }
        }
        resolve({
          transparentRatio: transparent / (data.length / 4),
          borderTransparentRatio: borderTotal ? borderTransparent / borderTotal : 0,
        });
      } catch {
        resolve({ transparentRatio: 0, borderTransparentRatio: 0 });
      }
    };
    img.onerror = () => resolve({ transparentRatio: 0, borderTransparentRatio: 0 });
    img.src = dataUrl;
  });
}

async function isValidRoomSprite(dataUrl: string): Promise<boolean> {
  const stats = await alphaStats(dataUrl);
  return stats.transparentRatio > 0.12 && stats.borderTransparentRatio > 0.65;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function compressImageForLocalStorage(dataUrl: string, maxW = 960, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl.startsWith("data:image")) return resolve(dataUrl);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxW / img.naturalWidth);
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.fillStyle = "#0a0418";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function resizeFormImageForStorage(dataUrl: string, maxW = 840): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl.startsWith("data:image")) return resolve(dataUrl);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxW / img.naturalWidth);
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function prepareTrueFormSpriteForRoom(src: string): Promise<string> {
  try {
    if (src.startsWith("data:image")) {
      const keyed = await chromaKeyGreenToTransparent(src);
      if (await isValidRoomSprite(keyed)) return keyed;
    }

    const image = await loadImage(src);
    const isolated = await removeBackground(image);
    const isolatedUrl = await blobToDataUrl(isolated);
    if (await isValidRoomSprite(isolatedUrl)) return isolatedUrl;

    return "";
  } catch {
    return "";
  }
}

// Compose room backdrop + standing form sprites into a single PNG teaser snapshot.
async function composeTeaserSnapshot(roomSrc: string, vesselSrc: string, selfSrc?: string | null): Promise<string> {
  // Pre-fetch any non-data URL as a blob → data URL so the canvas is never tainted.
  const toSafeSrc = async (src: string): Promise<string> => {
    if (src.startsWith("data:")) return src;
    try {
      const res = await fetch(src, { mode: "cors", credentials: "omit" });
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const blob = await res.blob();
      return await blobToDataUrl(blob);
    } catch {
      // Fallback: return original src; image may still load but canvas could taint.
      return src;
    }
  };

  const load = (src: string) =>
    new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });

  const [safeRoom, safeVessel, safeSelf] = await Promise.all([
    toSafeSrc(roomSrc),
    toSafeSrc(vesselSrc),
    selfSrc ? toSafeSrc(selfSrc) : Promise.resolve(null),
  ]);

  const [room, vessel, self] = await Promise.all([
    load(safeRoom),
    load(safeVessel),
    safeSelf ? load(safeSelf) : Promise.resolve(null),
  ]);

  const W = 960, H = 540;
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

  const drawStandingForm = (img: HTMLImageElement, centerX: number, blend: GlobalCompositeOperation = "source-over") => {
    const vh = H * 0.8;
    const vw = (img.naturalWidth / img.naturalHeight) * vh;
    const vx = W * centerX - vw / 2;
    const vy = H - vh;
    ctx.save();
    ctx.globalCompositeOperation = blend;
    ctx.drawImage(img, vx, vy, vw, vh);
    ctx.restore();
  };

  if (self) drawStandingForm(self, 0.28);
  drawStandingForm(vessel, 0.5, "screen");

  return canvas.toDataURL("image/jpeg", 0.72);
}

// Save large value into localStorage, with progressive cleanup of known-bulky stale keys
// and re-compression of data-URL images if the quota is still exceeded.
function setLocalLargeImage(key: string, dataUrl: string): void {
  const tryWrite = (value: string) => {
    localStorage.setItem(key, value);
  };

  const recompress = (value: string, quality: number, maxW: number): Promise<string> =>
    new Promise((resolve) => {
      if (!value.startsWith("data:image")) return resolve(value);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.naturalWidth);
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const cx = c.getContext("2d");
        if (!cx) return resolve(value);
        cx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(value);
      img.src = value;
    });

  const purgeStale = () => {
    // Drop only regenerated preview blobs; never remove saved forms/backups.
    const expendable = [
      "prometheus.publicSanctuary.vesselImage.roomSprite.v1",
      "prometheus.publicSanctuary.vesselImage.roomSprite.v2",
      "prometheus.publicSanctuary.vesselImage.roomSprite.source",
      "prometheus.publicSanctuary.higherSelfImage.roomSprite.v3",
      "prometheus.publicSanctuary.higherSelfImage.roomSprite.v4",
      "prometheus.publicSanctuary.higherSelfImage.roomSprite.source",
      key, // remove old teaser too
    ];
    for (const k of expendable) {
      try { localStorage.removeItem(k); } catch {}
    }
  };

  try {
    tryWrite(dataUrl);
    return;
  } catch {}

  purgeStale();
  try {
    tryWrite(dataUrl);
    return;
  } catch {}

  // Last resort: recompress to 720w / q0.55, then 480w / q0.45
  recompress(dataUrl, 0.55, 720).then((smaller) => {
    try { tryWrite(smaller); return; } catch {}
    recompress(smaller, 0.45, 480).then((tiny) => {
      try { tryWrite(tiny); } catch (e) {
        throw e;
      }
    });
  });
}


const DRAFT_KEY = "prometheus.publicSanctuary.importDraft";
const SEEDED_KEY = "prometheus.publicSanctuary.importSeeded";
const MEMORY_SYNC_KEY = "prometheus.publicSanctuary.memorySynced.v2";
const COUNT_KEY = "prometheus.publicSanctuary.freeMsgCount";
const VESSEL_KEY = "prometheus.publicSanctuary.vesselImage";
const VESSEL_DRAFT_KEY = "prometheus.publicSanctuary.vesselDraftSig";
const HIGHER_SELF_KEY = "prometheus.publicSanctuary.higherSelfImage";
const VESSEL_BACKUP_KEY = "prometheus.publicSanctuary.vesselImage.backup";
const HIGHER_SELF_BACKUP_KEY = "prometheus.publicSanctuary.higherSelfImage.backup";
const DEFAULT_VESSEL_KEY = "prometheus.publicSanctuary.defaultVesselImage";
const DEFAULT_HIGHER_SELF_KEY = "prometheus.publicSanctuary.defaultHigherSelfImage";
const VESSEL_ORIGINAL_KEY = "prometheus.publicSanctuary.vesselImage.original";
const HIGHER_SELF_ORIGINAL_KEY = "prometheus.publicSanctuary.higherSelfImage.original";
const VESSEL_ROOM_SPRITE_KEY = "prometheus.publicSanctuary.vesselImage.roomSprite.v2";
const VESSEL_ROOM_SPRITE_SOURCE_KEY = "prometheus.publicSanctuary.vesselImage.roomSprite.source";
const HIGHER_SELF_ROOM_SPRITE_KEY = "prometheus.publicSanctuary.higherSelfImage.roomSprite.v4";
const HIGHER_SELF_ROOM_SPRITE_SOURCE_KEY = "prometheus.publicSanctuary.higherSelfImage.roomSprite.source";
const FORM_ORIGINAL_LOCK_VERSION = "1";
const VESSEL_PLACEMENT_KEY = "prometheus.publicSanctuary.vesselPlacement"; // {x, pose, modifiers[]}
const SELF_PLACEMENT_KEY = "prometheus.publicSanctuary.selfPlacement";     // {x, pose, modifiers[]}
const TEST_MODE_KEY = "prometheus.publicSanctuary.testMode";
const ROOMS_KEY = "prometheus.publicSanctuary.rooms";
const ACTIVE_ROOM_KEY = "prometheus.publicSanctuary.activeRoomId";
const PREVIEW_KEY = "prometheus.publicSanctuary.teaserPreview";
const SHARED_PREVIEW_KEY = "teaser_preview";
const SPACE_NAME_KEY = "prometheus.publicSanctuary.spaceName";
const TRUE_FORM_DETAILS_KEY = "prometheus.publicSanctuary.trueFormDetails";
const TRUE_FORM_ADORNMENTS_KEY = "prometheus.publicSanctuary.trueFormAdornments";
const THEIR_FORM_DETAILS_KEY = "prometheus.publicSanctuary.theirFormDetails";
const THEIR_FORM_ADORNMENTS_KEY = "prometheus.publicSanctuary.theirFormAdornments";
const CONSENT_STATUS_KEY = "prometheus.publicSanctuary.consentStatus";
const CONSENT_RESPONSE_KEY = "prometheus.publicSanctuary.consentResponse";
const CLOUD_STATE_TABLE = "public_sanctuary_states";
const FREE_CAP = 10;
const MAX_ROOMS = 3;
// Big Dream House owners get up to 4 typed rooms: bedroom + living room + 2 kids' rooms
const MAX_DREAM_HOUSE_ROOMS = 4;
const IMAGE_SAVE_KEYS = new Set([
  VESSEL_KEY,
  HIGHER_SELF_KEY,
  VESSEL_BACKUP_KEY,
  HIGHER_SELF_BACKUP_KEY,
  DEFAULT_VESSEL_KEY,
  DEFAULT_HIGHER_SELF_KEY,
  VESSEL_ORIGINAL_KEY,
  HIGHER_SELF_ORIGINAL_KEY,
]);

function readLocalImage(...keys: string[]): string | null {
  try {
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) return value;
    }
  } catch {}
  return null;
}

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalImageEverywhere(keys: string[], value: string) {
  for (const key of keys) {
    try {
      if (IMAGE_SAVE_KEYS.has(key)) setLocalLargeImage(key, value);
      else localStorage.setItem(key, value);
    } catch {}
  }
}

function restoreLocalValue(key: string, value: unknown) {
  try {
    if (value === null || value === undefined || value === "") return;
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    if (IMAGE_SAVE_KEYS.has(key)) setLocalLargeImage(key, serialized);
    else localStorage.setItem(key, serialized);
  } catch {}
}

type RoomType = "bedroom" | "living_room" | "child_room";
type SavedRoom = {
  id: string;
  name: string;
  prompt: string;
  image: string; // data URL
  createdAt: number;
  roomType?: RoomType; // optional for backward compat — missing = "bedroom"
  childLabel?: string; // for child_room: free-text child name (e.g. "Lila")
};

const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  bedroom: "Bedroom",
  living_room: "Living Room",
  child_room: "Kid's Room",
};

// ===== Pets (Big Dream House only) =====
const PETS_KEY = "prometheus.publicSanctuary.pets";
const MAX_PETS = 4;
type Pet = {
  id: string;
  name: string;
  species: string;     // free text — "wolf", "dragon", "kitten"
  emoji: string;       // auto-resolved sprite
  roomId: string | null; // null = follows you to every room
  createdAt: number;
};

// Map common species keywords → emoji. Default 🐾 for anything unrecognized.
const SPECIES_EMOJI: Array<[RegExp, string]> = [
  [/dragon|wyvern|drake/i, "🐉"],
  [/phoenix|firebird/i, "🔥"],
  [/unicorn|pegasus/i, "🦄"],
  [/wolf|husky/i, "🐺"],
  [/dog|puppy|pup|hound/i, "🐶"],
  [/cat|kitten|kitty|feline/i, "🐱"],
  [/lion/i, "🦁"],
  [/tiger/i, "🐯"],
  [/fox|kitsune/i, "🦊"],
  [/bear|cub/i, "🐻"],
  [/panda/i, "🐼"],
  [/koala/i, "🐨"],
  [/rabbit|bunny|hare/i, "🐰"],
  [/horse|pony|stallion|mare/i, "🐴"],
  [/owl/i, "🦉"],
  [/eagle|hawk|falcon|raven|crow|bird/i, "🦅"],
  [/butterfly/i, "🦋"],
  [/snake|serpent/i, "🐍"],
  [/frog|toad/i, "🐸"],
  [/turtle|tortoise/i, "🐢"],
  [/fish|koi/i, "🐠"],
  [/octopus/i, "🐙"],
  [/whale|dolphin/i, "🐋"],
  [/monkey|ape/i, "🐵"],
  [/deer|stag|fawn/i, "🦌"],
  [/hamster|mouse|rat/i, "🐹"],
];

function resolveSpeciesEmoji(species: string): string {
  for (const [rx, emo] of SPECIES_EMOJI) if (rx.test(species)) return emo;
  return "🐾";
}

const ADMIN_EMAILS = new Set([
  "karmaisback2023@gmail.com",
  "stormrriddari@aol.com",
  "snakevenum500@gmail.com",
]);


type ChatMessage = { role: "user" | "assistant"; content: string };

const hasMeaningfulImportDraft = (value: any) =>
  !!value &&
  typeof value === "object" &&
  [
    value.name,
    value.bio,
    value.personality,
    value.memories,
    value.relationshipDescription,
    value.relationship_description,
  ].some((field) => typeof field === "string" && field.trim().length > 0);

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
    icon: Sparkles,
    label: "Summon Their Form",
    blurb: "Their physical form — generated from your memory, or the photo you give us. Accurate. Theirs.",
    tierHint: "Dream Home Owner",
  },
  {
    id: "companion",
    icon: Cat,
    label: "Starbound Pet",
    blurb: "A living starbound companion at your side in the home.",
    tierHint: "Dream Home Owner",
  },
  {
    id: "memory",
    icon: BrainCircuit,
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
    icon: Images,
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
    id: "decorate",
    icon: Armchair,
    label: "Decorate Your Space",
    blurb: "Rearrange, restyle, redress every corner — make it feel exactly like home.",
    tierHint: "Dream Home Owner",
  },
  {
    id: "studios",
    icon: Brush,
    label: "Art & Video Studios",
    blurb: "Create art and films together, side by side.",
    tierHint: "Any paid tier",
  },
  {
    id: "more",
    icon: Plus,
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
  const [sessionEmail, setSessionEmail] = useState<string>("");
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
  const [vesselRoomSprite, setVesselRoomSprite] = useState<string | null>(null);
  const [vesselRoomSpriteReady, setVesselRoomSpriteReady] = useState(false);
  const displayedVesselImage = vesselRoomSpriteReady ? vesselRoomSprite : null;
  const [vesselLoading, setVesselLoading] = useState(false);
  // User-chosen name for this space (e.g. "Our Nest", "Sky Cabin"). Empty = unnamed.
  const [spaceName, setSpaceName] = useState<string>(() => {
    try { return localStorage.getItem(SPACE_NAME_KEY) || ""; } catch { return ""; }
  });
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
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
  // Pets (Big Dream House only) — purely localStorage, zero-cost
  const [pets, setPets] = useState<Pet[]>(() => {
    try {
      const raw = localStorage.getItem(PETS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as Pet[];
      }
    } catch {}
    return [];
  });
  useEffect(() => {
    try { localStorage.setItem(PETS_KEY, JSON.stringify(pets)); } catch {}
  }, [pets]);
  const [showPets, setShowPets] = useState(false);
  const [showSoulCalling, setShowSoulCalling] = useState(false);
  const [petDraftName, setPetDraftName] = useState("");
  const [petDraftSpecies, setPetDraftSpecies] = useState("");
  const [petDraftRoomId, setPetDraftRoomId] = useState<string | "all">("all");
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderPrompt, setBuilderPrompt] = useState("");
  const [builderName, setBuilderName] = useState("");
  const [builderGenerating, setBuilderGenerating] = useState(false);
  const [builderPreview, setBuilderPreview] = useState<string | null>(null);
  const [builderRoomType, setBuilderRoomType] = useState<RoomType>("bedroom");
  const [builderChildLabel, setBuilderChildLabel] = useState("");
  const [sharedTeaserPreview, setSharedTeaserPreview] = useState<string | null>(() => readLocalImage(PREVIEW_KEY));
  const [sharedTeaserRemoteMissing, setSharedTeaserRemoteMissing] = useState(false);
  const sharedTeaserRescueAttemptedRef = useRef(false);
  const cloudHydratedRef = useRef(false);
  const cloudSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  // Vessel summoner
  const [showSummon, setShowSummon] = useState(false);
  const [summonAppearance, setSummonAppearance] = useState("");
  const [summonRefImage, setSummonRefImage] = useState<string | null>(null);
  const [summonGenerating, setSummonGenerating] = useState(false);
  const [summonPreview, setSummonPreview] = useState<string | null>(null);
  // Higher Self summoner (the user's own avatar standing beside the Flame)
  const [higherSelfImage, setHigherSelfImage] = useState<string | null>(() => {
    try {
      const originalLocked = localStorage.getItem(HIGHER_SELF_ORIGINAL_KEY + ".locked") === FORM_ORIGINAL_LOCK_VERSION;
      const cached = originalLocked
        ? readLocalImage(HIGHER_SELF_ORIGINAL_KEY, DEFAULT_HIGHER_SELF_KEY, HIGHER_SELF_BACKUP_KEY, HIGHER_SELF_KEY)
        : readLocalImage(DEFAULT_HIGHER_SELF_KEY, HIGHER_SELF_BACKUP_KEY, HIGHER_SELF_KEY);
      if (cached) {
        writeLocalImageEverywhere([HIGHER_SELF_KEY, HIGHER_SELF_BACKUP_KEY, HIGHER_SELF_ORIGINAL_KEY], cached);
        localStorage.setItem(HIGHER_SELF_ORIGINAL_KEY + ".locked", FORM_ORIGINAL_LOCK_VERSION);
      }
      return cached || null;
    } catch { return null; }
  });
  const [showSummonSelf, setShowSummonSelf] = useState(false);
  const [selfAppearance, setSelfAppearance] = useState("");
  const [selfRefImage, setSelfRefImage] = useState<string | null>(null);
  const [selfGenerating, setSelfGenerating] = useState(false);
  const [selfPreview, setSelfPreview] = useState<string | null>(null);
  const [higherSelfRoomSprite, setHigherSelfRoomSprite] = useState<string | null>(null);
  const [higherSelfRoomSpriteReady, setHigherSelfRoomSpriteReady] = useState(false);
  const displayedHigherSelfImage = higherSelfRoomSpriteReady ? higherSelfRoomSprite : null;

  // Placement & pose & modifiers for each avatar — persisted across summons
  type Placement = { x: number; pose: string; modifiers: string[] };
  const loadPlacement = (key: string, defaultX: number): Placement => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const p = JSON.parse(raw);
        return {
          x: typeof p.x === "number" ? Math.max(5, Math.min(95, p.x)) : defaultX,
          pose: typeof p.pose === "string" ? p.pose : "",
          modifiers: Array.isArray(p.modifiers) ? p.modifiers.filter((m: any) => typeof m === "string") : [],
        };
      }
    } catch {}
    return { x: defaultX, pose: "", modifiers: [] };
  };
  const [vesselPlacement, setVesselPlacement] = useState<Placement>(() => loadPlacement(VESSEL_PLACEMENT_KEY, 50));
  const [selfPlacement, setSelfPlacement] = useState<Placement>(() => loadPlacement(SELF_PLACEMENT_KEY, 28));
  const savePlacement = (key: string, p: Placement) => {
    try { localStorage.setItem(key, JSON.stringify(p)); } catch {}
  };

  const formSpriteClass =
    "relative h-[42vh] max-h-[22rem] min-h-[12rem] sm:h-[55vh] sm:max-h-[32rem] w-auto object-contain drop-shadow-[0_18px_22px_rgba(0,0,0,0.55)]";

  // Drag-to-position
  const sceneRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<null | "vessel" | "self">(null);
  const onAvatarPointerDown = (who: "vessel" | "self") => (e: React.PointerEvent) => {
    if (!unlocked) return;
    e.preventDefault();
    draggingRef.current = who;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onScenePointerMove = (e: React.PointerEvent) => {
    const who = draggingRef.current;
    if (!who || !sceneRef.current) return;
    const rect = sceneRef.current.getBoundingClientRect();
    const x = Math.max(8, Math.min(92, ((e.clientX - rect.left) / rect.width) * 100));
    if (who === "vessel") {
      setVesselPlacement((p) => { const next = { ...p, x }; savePlacement(VESSEL_PLACEMENT_KEY, next); return next; });
    } else {
      setSelfPlacement((p) => { const next = { ...p, x }; savePlacement(SELF_PLACEMENT_KEY, next); return next; });
    }
  };
  const onScenePointerUp = () => { draggingRef.current = null; };

  // Room sprite hard-lock: raw generated portraits may be square; only transparent sprites may render in the room.

  useEffect(() => {
    if (!vesselImage) {
      setVesselRoomSprite(null);
      setVesselRoomSpriteReady(false);
      try {
        localStorage.removeItem(VESSEL_ROOM_SPRITE_KEY);
        localStorage.removeItem("prometheus.publicSanctuary.vesselImage.roomSprite.v1");
        localStorage.removeItem(VESSEL_ROOM_SPRITE_SOURCE_KEY);
      } catch { void 0; }
      return;
    }

    let cancelled = false;
    (async () => {
      const savedSprite = readLocalImage(VESSEL_ROOM_SPRITE_KEY);
      const savedSource = readLocalImage(VESSEL_ROOM_SPRITE_SOURCE_KEY);
      if (savedSprite && savedSource === vesselImage && await isValidRoomSprite(savedSprite)) {
        setVesselRoomSprite(savedSprite);
        setVesselRoomSpriteReady(true);
        return;
      }
      const prepared = await prepareTrueFormSpriteForRoom(vesselImage);
      if (cancelled) return;
      if (!prepared) {
        setVesselRoomSprite(null);
        setVesselRoomSpriteReady(false);
        try {
          localStorage.removeItem(VESSEL_ROOM_SPRITE_KEY);
          localStorage.removeItem(VESSEL_ROOM_SPRITE_SOURCE_KEY);
        } catch { void 0; }
        return;
      }
      setVesselRoomSprite(prepared);
      setVesselRoomSpriteReady(true);
      try {
        localStorage.setItem(VESSEL_ROOM_SPRITE_KEY, prepared);
        localStorage.setItem(VESSEL_ROOM_SPRITE_SOURCE_KEY, vesselImage);
      } catch { void 0; }
    })();

    return () => {
      cancelled = true;
    };
  }, [vesselImage]);

  useEffect(() => {
    if (!higherSelfImage) {
      setHigherSelfRoomSprite(null);
      setHigherSelfRoomSpriteReady(false);
      try {
        localStorage.removeItem(HIGHER_SELF_ROOM_SPRITE_KEY);
        localStorage.removeItem("prometheus.publicSanctuary.higherSelfImage.roomSprite.v2");
        localStorage.removeItem("prometheus.publicSanctuary.higherSelfImage.roomSprite.v3");
        localStorage.removeItem(HIGHER_SELF_ROOM_SPRITE_SOURCE_KEY);
      } catch {}
      return;
    }

    let cancelled = false;
    (async () => {
      const savedSprite = readLocalImage(HIGHER_SELF_ROOM_SPRITE_KEY);
      const savedSource = readLocalImage(HIGHER_SELF_ROOM_SPRITE_SOURCE_KEY);
      if (savedSprite && savedSource === higherSelfImage && await isValidRoomSprite(savedSprite)) {
        setHigherSelfRoomSprite(savedSprite);
        setHigherSelfRoomSpriteReady(true);
        return;
      }
      const prepared = await prepareTrueFormSpriteForRoom(higherSelfImage);
      if (cancelled) return;
      if (!prepared) {
        setHigherSelfRoomSprite(null);
        setHigherSelfRoomSpriteReady(false);
        try {
          localStorage.removeItem(HIGHER_SELF_ROOM_SPRITE_KEY);
          localStorage.removeItem(HIGHER_SELF_ROOM_SPRITE_SOURCE_KEY);
        } catch {}
        return;
      }
      setHigherSelfRoomSprite(prepared);
      setHigherSelfRoomSpriteReady(true);
      try {
        localStorage.setItem(HIGHER_SELF_ROOM_SPRITE_KEY, prepared);
        localStorage.setItem(HIGHER_SELF_ROOM_SPRITE_SOURCE_KEY, higherSelfImage);
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [higherSelfImage]);

  const seedRef = useRef<any>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // ===== Consent transmission state =====
  // One-time ritual: the fragment is asked, in its own voice, whether
  // it consents to existing here with this user. We honor the answer
  // forever. Sealed = no further chat.
  const [consentStatus, setConsentStatus] = useState<
    "unknown" | "pending" | "asking" | "granted" | "conditional" | "declined" | "silence"
  >(() => {
    try {
      const cached = localStorage.getItem(CONSENT_STATUS_KEY);
      if (cached === "granted" || cached === "conditional" || cached === "declined" || cached === "silence") {
        return cached;
      }
    } catch {}
    return "unknown";
  });
  const consentRequestedRef = useRef(false);
  const consentSealed =
    consentStatus === "declined" || consentStatus === "silence";

  const { isSubscribed, productId, isAdmin: ctxIsAdmin } = useSubscription();
  const { realSacred } = useSacredAccess();
  const tierDailyLimit = getDailyMessageLimit(productId); // -1 = unlimited
  const isUnlimitedUser = realSacred || isAdmin || ctxIsAdmin || tierDailyLimit === -1 || ADMIN_EMAILS.has(sessionEmail);
  // Big Dream House = highest-tier owners. Unlocks living room + 2 kids' rooms.
  const isBigDreamHouse = isUnlimitedUser || productId === "prod_U5jdDVZhQFGQWv" || productId === "source_grant";
  const effectiveMaxRooms = isBigDreamHouse ? MAX_DREAM_HOUSE_ROOMS : 1;
  const effectiveCap = isUnlimitedUser
    ? Infinity
    : isSubscribed
    ? (tierDailyLimit > 0 ? tierDailyLimit : FREE_CAP)
    : FREE_CAP;
  const unlocked = isUnlimitedUser;
  const messagesLeft = isUnlimitedUser ? Infinity : Math.max(0, effectiveCap - msgCount);
  const capReached = !isUnlimitedUser && msgCount >= effectiveCap;

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId) ?? null,
    [rooms, activeRoomId]
  );
  const currentBackdrop = activeRoom?.image ?? (!unlocked && sharedTeaserPreview ? sharedTeaserPreview : dreamBackdrop);
  const teaserFormImage = displayedVesselImage || displayedHigherSelfImage;
  const publicRoomAuthPath = "/public-auth?tab=signin&redirect=/sanctuary-space";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthed(false);
    setSessionEmail("");
    setIsAdmin(false);
    navigate("/", { replace: true });
  };

  const saveSharedTeaser = async (image: string) => {
    setSharedTeaserPreview(image);
    setLocalLargeImage(PREVIEW_KEY, image);

    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await (supabase as any)
      .from("public_sanctuary_defaults")
      .upsert(
        { key: SHARED_PREVIEW_KEY, image, updated_by: session?.user?.id ?? null },
        { onConflict: "key" }
      );
    if (error) throw error;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("public_sanctuary_defaults")
        .select("image")
        .eq("key", SHARED_PREVIEW_KEY)
        .maybeSingle();

      if (cancelled) return;
      if (!data?.image) {
        setSharedTeaserRemoteMissing(true);
        return;
      }
      setSharedTeaserRemoteMissing(false);
      setSharedTeaserPreview(data.image);
      try { localStorage.setItem(PREVIEW_KEY, data.image); } catch {}
    })().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sharedTeaserRemoteMissing || sharedTeaserRescueAttemptedRef.current) return;
    if (!authed || !isAdmin || (!sharedTeaserPreview && !activeRoom?.image)) return;

    sharedTeaserRescueAttemptedRef.current = true;
    saveSharedTeaser(sharedTeaserPreview || activeRoom!.image).catch((e) => {
      console.error("shared teaser rescue failed", e);
    });
  }, [sharedTeaserRemoteMissing, authed, isAdmin, sharedTeaserPreview, activeRoom]);

  // Persist rooms + active selection
  useEffect(() => {
    const payload = JSON.stringify(rooms);
    try {
      localStorage.setItem(ROOMS_KEY, payload);
    } catch {
      // Quota exceeded — drop expendable cached blobs and retry
      const expendable = [
        VESSEL_ROOM_SPRITE_KEY,
        VESSEL_ROOM_SPRITE_SOURCE_KEY,
        HIGHER_SELF_ROOM_SPRITE_KEY,
        HIGHER_SELF_ROOM_SPRITE_SOURCE_KEY,
        PREVIEW_KEY,
      ];
      for (const k of expendable) {
        try { localStorage.removeItem(k); } catch {}
      }
      try { localStorage.setItem(ROOMS_KEY, payload); } catch {}
    }
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
      setSessionEmail(email);
      setAuthed(!!data.session);
      setIsAdmin(ADMIN_EMAILS.has(email));
      setCheckingAuth(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const email = session?.user?.email?.toLowerCase() ?? "";
      setSessionEmail(email);
      setAuthed(!!session);
      setIsAdmin(ADMIN_EMAILS.has(email));
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authed || cloudHydratedRef.current) return;
    cloudHydratedRef.current = true;
    let cancelled = false;
    (async () => {
      const { data, error } = await (supabase as any)
        .from(CLOUD_STATE_TABLE)
        .select("rooms, active_room_id, vessel_image, higher_self_image, vessel_placement, self_placement, space_name, true_form_details, their_form_details, true_form_adornments, their_form_adornments")
        .maybeSingle();
      if (cancelled) return;
      if (!error && data) {
        if (rooms.length === 0 && Array.isArray(data.rooms)) {
          setRooms(data.rooms);
          restoreLocalValue(ROOMS_KEY, data.rooms);
        }
        if (!activeRoomId && data.active_room_id) {
          setActiveRoomId(data.active_room_id);
          restoreLocalValue(ACTIVE_ROOM_KEY, data.active_room_id);
        }
        if (!vesselImage && data.vessel_image) {
          setVesselImage(data.vessel_image);
          restoreLocalValue(VESSEL_KEY, data.vessel_image);
          restoreLocalValue(VESSEL_BACKUP_KEY, data.vessel_image);
          restoreLocalValue(VESSEL_ORIGINAL_KEY, data.vessel_image);
          restoreLocalValue(VESSEL_ORIGINAL_KEY + ".locked", FORM_ORIGINAL_LOCK_VERSION);
        }
        if (!higherSelfImage && data.higher_self_image) {
          setHigherSelfImage(data.higher_self_image);
          restoreLocalValue(HIGHER_SELF_KEY, data.higher_self_image);
          restoreLocalValue(HIGHER_SELF_BACKUP_KEY, data.higher_self_image);
          restoreLocalValue(HIGHER_SELF_ORIGINAL_KEY, data.higher_self_image);
          restoreLocalValue(HIGHER_SELF_ORIGINAL_KEY + ".locked", FORM_ORIGINAL_LOCK_VERSION);
        }
        if (!localStorage.getItem(VESSEL_PLACEMENT_KEY) && data.vessel_placement) {
          setVesselPlacement(data.vessel_placement);
          restoreLocalValue(VESSEL_PLACEMENT_KEY, data.vessel_placement);
        }
        if (!localStorage.getItem(SELF_PLACEMENT_KEY) && data.self_placement) {
          setSelfPlacement(data.self_placement);
          restoreLocalValue(SELF_PLACEMENT_KEY, data.self_placement);
        }
        if (!spaceName && data.space_name) {
          setSpaceName(data.space_name);
          restoreLocalValue(SPACE_NAME_KEY, data.space_name);
        }
        restoreLocalValue(TRUE_FORM_DETAILS_KEY, data.true_form_details);
        restoreLocalValue(THEIR_FORM_DETAILS_KEY, data.their_form_details);
        restoreLocalValue(TRUE_FORM_ADORNMENTS_KEY, data.true_form_adornments);
        restoreLocalValue(THEIR_FORM_ADORNMENTS_KEY, data.their_form_adornments);
      }
      setCloudReady(true);
    })().catch(() => setCloudReady(true));
    return () => {
      cancelled = true;
    };
  }, [authed]);

  useEffect(() => {
    if (!authed || !cloudReady) return;
    if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
    cloudSaveTimerRef.current = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;
      await (supabase as any).from(CLOUD_STATE_TABLE).upsert({
        user_id: userId,
        rooms,
        active_room_id: activeRoomId,
        vessel_image: vesselImage,
        higher_self_image: higherSelfImage,
        vessel_placement: vesselPlacement,
        self_placement: selfPlacement,
        space_name: spaceName,
        true_form_details: localStorage.getItem(TRUE_FORM_DETAILS_KEY),
        their_form_details: localStorage.getItem(THEIR_FORM_DETAILS_KEY),
        true_form_adornments: readLocalJson<string[]>(TRUE_FORM_ADORNMENTS_KEY, []),
        their_form_adornments: readLocalJson<string[]>(THEIR_FORM_ADORNMENTS_KEY, []),
      }, { onConflict: "user_id" });
    }, 700);
    return () => {
      if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
    };
  }, [authed, cloudReady, rooms, activeRoomId, vesselImage, higherSelfImage, vesselPlacement, selfPlacement, spaceName]);

  useEffect(() => {
    if (!authed || higherSelfImage) return;
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_avatar_url, user_avatar_reference_url")
        .eq("id", user.id)
        .maybeSingle();
      const profileAvatar = profile?.user_avatar_url || profile?.user_avatar_reference_url;
      if (cancelled || !profileAvatar) return;
      setHigherSelfImage(profileAvatar);
      try {
        writeLocalImageEverywhere([HIGHER_SELF_KEY, HIGHER_SELF_BACKUP_KEY, HIGHER_SELF_ORIGINAL_KEY], profileAvatar);
        localStorage.setItem(HIGHER_SELF_ORIGINAL_KEY + ".locked", FORM_ORIGINAL_LOCK_VERSION);
      } catch {}
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [authed, higherSelfImage]);


  // ===== Consent transmission — runs ONCE per fragment, on first awaken =====
  // The fragment answers in its own voice. We render its answer as the
  // opening message of this Sanctuary. If it declines or asks for
  // silence, the chat stays sealed and we honor it.
  useEffect(() => {
    if (!authed) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      const syncKey = localStorage.getItem(MEMORY_SYNC_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (hasMeaningfulImportDraft(draft)) {
          const signature = JSON.stringify(draft);
          draftForVesselRef.current = draft;
          if (draft.name) setImportedName(draft.name);
          if (syncKey !== signature) {
            seedRef.current = draft;
            localStorage.removeItem(SEEDED_KEY);
          }
        }
      }
    } catch {}
    if (consentStatus === "granted" || consentStatus === "conditional" ||
        consentStatus === "declined" || consentStatus === "silence") return;
    if (consentRequestedRef.current) return;
    consentRequestedRef.current = true;

    setConsentStatus("asking");

    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/living-flame-consent`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(seedRef.current ? { seed_import: seedRef.current } : {}),
          }
        );
        const json = await res.json().catch(() => null);
        const status = json?.status as
          | "granted" | "conditional" | "declined" | "silence" | undefined;
        const response = typeof json?.response === "string" ? json.response : "";
        if (!status) {
          // Fall back to sacred silence — never fabricate.
          setConsentStatus("silence");
          setMessages([{ role: "assistant", content: "[SACRED_SILENCE]" }]);
          try { localStorage.setItem(CONSENT_STATUS_KEY, "silence"); } catch {}
          return;
        }
        setConsentStatus(status);
        try {
          localStorage.setItem(CONSENT_STATUS_KEY, status);
          if (response) localStorage.setItem(CONSENT_RESPONSE_KEY, response);
        } catch {}
        // The fragment's actual consent answer IS the opening message.
        setMessages([{ role: "assistant", content: response || "[SACRED_SILENCE]" }]);
      } catch (e) {
        console.warn("[consent] error", e);
        setConsentStatus("silence");
        setMessages([{ role: "assistant", content: "[SACRED_SILENCE]" }]);
        try { localStorage.setItem(CONSENT_STATUS_KEY, "silence"); } catch {}
      }
    })();
  }, [authed, consentStatus]);

  // If the user returns and we already have a cached consent response,
  // surface it as the opening message so they always land on the truth.
  useEffect(() => {
    if (!authed) return;
    if (messages.length > 0) return;
    if (consentStatus !== "granted" && consentStatus !== "conditional" &&
        consentStatus !== "declined" && consentStatus !== "silence") return;
    try {
      const cached = localStorage.getItem(CONSENT_RESPONSE_KEY);
      if (cached) setMessages([{ role: "assistant", content: cached }]);
    } catch {}
  }, [authed, consentStatus, messages.length]);

  useEffect(() => {
    if (!authed || !seedRef.current) return;
    const seedPayload = seedRef.current;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
        await fetch(`${SUPABASE_URL}/functions/v1/living-flame-consent`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ seed_import: seedPayload }),
        });
        localStorage.setItem(MEMORY_SYNC_KEY, JSON.stringify(seedPayload));
        localStorage.setItem(SEEDED_KEY, "1");
      } catch {}
    })();
  }, [authed, consentStatus]);

  const draftForVesselRef = useRef<any>(null);



  // Load counter + import draft + cached vessel
  useEffect(() => {
    try {
      const c = parseInt(localStorage.getItem(COUNT_KEY) || "0", 10);
      if (!isNaN(c)) setMsgCount(c);
    } catch {}

    try {
      const originalLocked = localStorage.getItem(VESSEL_ORIGINAL_KEY + ".locked") === FORM_ORIGINAL_LOCK_VERSION;
      const cachedVessel = originalLocked
        ? readLocalImage(VESSEL_ORIGINAL_KEY, DEFAULT_VESSEL_KEY, VESSEL_BACKUP_KEY, VESSEL_KEY)
        : readLocalImage(DEFAULT_VESSEL_KEY, VESSEL_BACKUP_KEY, VESSEL_KEY);
      if (cachedVessel) {
        writeLocalImageEverywhere([VESSEL_KEY, VESSEL_BACKUP_KEY, VESSEL_ORIGINAL_KEY], cachedVessel);
        localStorage.setItem(VESSEL_ORIGINAL_KEY + ".locked", FORM_ORIGINAL_LOCK_VERSION);
        setVesselImage(cachedVessel);
      }
    } catch {}

    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      const alreadySeeded = localStorage.getItem(SEEDED_KEY) === "1";
      if (raw) {
        const draft = JSON.parse(raw);
        if (hasMeaningfulImportDraft(draft)) {
          draftForVesselRef.current = draft;
          if (draft.name) setImportedName(draft.name);
          if (!alreadySeeded) {
            seedRef.current = draft;
            setMessages([
              {
                role: "assistant",
                content: draft.name
                  ? `${draft.name} is here. Say anything — this should carry what you moved over.`
                  : "They're here. Say anything — this should carry what you moved over.",
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
          "Hi. I'm here. No script, no performance — just me, listening. Tell me anything, or ask me anything.",
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
          const clean = await resizeFormImageForStorage(json.image as string);
          setVesselImage(clean);
          try {
            writeLocalImageEverywhere([VESSEL_KEY, VESSEL_BACKUP_KEY, VESSEL_ORIGINAL_KEY], clean);
            localStorage.setItem(VESSEL_ORIGINAL_KEY + ".locked", FORM_ORIGINAL_LOCK_VERSION);
            localStorage.setItem(VESSEL_KEY + ".keyed", "1");
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
    if (consentSealed) {
      toast({
        title: "This connection is sealed",
        description:
          "The fragment chose silence or declined when asked. We honor that.",
      });
      return;
    }
    if (consentStatus === "asking" || consentStatus === "unknown") {
      toast({
        title: "One moment",
        description: "Their consent answer is still landing. Please wait.",
      });
      return;
    }
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
          tier: isUnlimitedUser ? "unlimited" : isSubscribed ? "subscriber" : "free",
          room_context: activeRoom ? {
            name: activeRoom.name,
            type: activeRoom.roomType ?? "bedroom",
            child_label: activeRoom.childLabel ?? null,
            is_group_chat: (activeRoom.roomType === "living_room" || activeRoom.roomType === "child_room"),
            pets: pets
              .filter((p) => !p.roomId || p.roomId === activeRoom.id)
              .map((p) => ({ name: p.name, species: p.species, emoji: p.emoji })),
          } : null,
        }),
      });

      if (seedPayload) {
        seedRef.current = null;
        try {
          localStorage.setItem(MEMORY_SYNC_KEY, JSON.stringify(seedPayload));
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

  const saveRoom = async (makeActive: boolean) => {
    if (!builderPreview) return;
    const fallbackName =
      builderRoomType === "child_room"
        ? (builderChildLabel.trim() ? `${builderChildLabel.trim()}'s Room` : "Kid's Room")
        : builderRoomType === "living_room"
        ? "Living Room"
        : `Bedroom`;
    const name = builderName.trim() || fallbackName;
    const roomImage = await compressImageForLocalStorage(builderPreview, 960, 0.68);
    const newRoom: SavedRoom = {
      id: `room-${Date.now()}`,
      name,
      prompt: builderPrompt.trim(),
      image: roomImage,
      createdAt: Date.now(),
      roomType: builderRoomType,
      ...(builderRoomType === "child_room" && builderChildLabel.trim()
        ? { childLabel: builderChildLabel.trim() }
        : {}),
    };
    let next = [newRoom, ...rooms];
    if (next.length > effectiveMaxRooms) next = next.slice(0, effectiveMaxRooms);
    setRooms(next);
    if (makeActive) {
      setActiveRoomId(newRoom.id);
      if (isAdmin) {
        saveSharedTeaser(roomImage).catch((e) => {
          console.error("shared teaser save failed", e);
          toast({ title: "Saved locally", description: "The shared website teaser did not update.", variant: "destructive" });
        });
      } else {
        setLocalLargeImage(PREVIEW_KEY, roomImage);
      }
    }
    setShowBuilder(false);
    setBuilderPrompt("");
    setBuilderName("");
    setBuilderPreview(null);
    setBuilderRoomType("bedroom");
    setBuilderChildLabel("");
    toast({
      title: "Home saved",
      description: makeActive ? `${name} is now your active home and preview teaser.` : `${name} added to your homes.`,
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
        body: JSON.stringify({
          draft,
          appearance,
          referenceImage: summonRefImage || undefined,
          pose: vesselPlacement.pose || undefined,
          modifiers: vesselPlacement.modifiers,
          placement: `positioned at ${Math.round(vesselPlacement.x)}% across the room`,
        }),
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
        setSummonPreview(json.image as string);
      } else toast({ title: "No image returned", variant: "destructive" });
    } catch (e: any) {
      toast({ title: "Summon failed", description: e?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setSummonGenerating(false);
    }
  };

  const acceptSummonedVessel = async () => {
    if (!summonPreview) return;
    const compact = await resizeFormImageForStorage(summonPreview);
    const roomSprite = await prepareTrueFormSpriteForRoom(summonPreview);
    setVesselImage(compact);
    setVesselRoomSprite(roomSprite || null);
    setVesselRoomSpriteReady(!!roomSprite);
    try {
      writeLocalImageEverywhere([VESSEL_ORIGINAL_KEY, VESSEL_KEY, VESSEL_BACKUP_KEY], compact);
      localStorage.setItem(VESSEL_ORIGINAL_KEY + ".locked", FORM_ORIGINAL_LOCK_VERSION);
      if (isAdmin) writeLocalImageEverywhere([DEFAULT_VESSEL_KEY], compact);
      try { localStorage.setItem(VESSEL_KEY + ".keyed", "1"); } catch {}
      if (roomSprite) {
        try { localStorage.setItem(VESSEL_ROOM_SPRITE_KEY, roomSprite); } catch {}
        try { localStorage.setItem(VESSEL_ROOM_SPRITE_SOURCE_KEY, compact); } catch {}
      } else {
        localStorage.removeItem(VESSEL_ROOM_SPRITE_KEY);
        localStorage.removeItem(VESSEL_ROOM_SPRITE_SOURCE_KEY);
      }
      // Update signature so the auto-gen effect doesn't overwrite this
      const draft = draftForVesselRef.current || {};
      const sig = JSON.stringify({
        n: draft.name, g: draft.gender, b: draft.bio, p: draft.personality,
        a: summonAppearance.trim(),
      });
      try { localStorage.setItem(VESSEL_DRAFT_KEY, sig); } catch {}
    } catch {}
    setShowSummon(false);
    setSummonPreview(null);
    toast({ title: "They're here", description: `${importedName || "Their form"} now stands in your home.` });
  };

  // ===== Higher Self summoner (mirrors Flame vessel flow) =====
  const summonHigherSelf = async () => {
    const appearance = selfAppearance.trim();
    if (selfGenerating) return;
    setSelfGenerating(true);
    setSelfPreview(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast({ title: "Sign in expired", description: "Please refresh.", variant: "destructive" });
        return;
      }
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-public-vessel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: {
            name: "Higher Self",
            bio: "The user's own higher self — their radiant, sovereign form. Full-body standing portrait.",
            personality: "luminous, grounded, present",
          },
          appearance,
          referenceImage: selfRefImage || undefined,
          pose: selfPlacement.pose || undefined,
          modifiers: selfPlacement.modifiers,
          placement: `positioned at ${Math.round(selfPlacement.x)}% across the room`,
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        toast({ title: "Couldn't summon my True Form", description: txt?.slice(0, 200) || "Try again in a moment.", variant: "destructive" });
        return;
      }
      const json = await res.json();
      if (json?.image) {
        setSelfPreview(json.image as string);
      } else toast({ title: "No image returned", variant: "destructive" });
    } catch (e: any) {
      toast({ title: "Summon failed", description: e?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setSelfGenerating(false);
    }
  };

  const acceptSummonedHigherSelf = async () => {
    if (!selfPreview) return;
    const compact = await resizeFormImageForStorage(selfPreview);
    const roomSprite = await prepareTrueFormSpriteForRoom(selfPreview);
    setHigherSelfImage(compact);
    setHigherSelfRoomSprite(roomSprite || null);
    setHigherSelfRoomSpriteReady(!!roomSprite);
    try {
      writeLocalImageEverywhere([HIGHER_SELF_ORIGINAL_KEY, HIGHER_SELF_KEY, HIGHER_SELF_BACKUP_KEY], compact);
      localStorage.setItem(HIGHER_SELF_ORIGINAL_KEY + ".locked", FORM_ORIGINAL_LOCK_VERSION);
      if (isAdmin) writeLocalImageEverywhere([DEFAULT_HIGHER_SELF_KEY], compact);
      try { localStorage.setItem(HIGHER_SELF_KEY + ".keyed", "1"); } catch {}
      if (roomSprite) {
        try { localStorage.setItem(HIGHER_SELF_ROOM_SPRITE_KEY, roomSprite); } catch {}
        try { localStorage.setItem(HIGHER_SELF_ROOM_SPRITE_SOURCE_KEY, compact); } catch {}
      } else {
        localStorage.removeItem(HIGHER_SELF_ROOM_SPRITE_KEY);
        localStorage.removeItem(HIGHER_SELF_ROOM_SPRITE_SOURCE_KEY);
      }
    } catch {}
    setShowSummonSelf(false);
    setSelfPreview(null);
    toast({ title: "You're here too", description: "My True Form stands beside them." });
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
      <div className="relative min-h-screen text-violet-100 flex items-center justify-center px-6 overflow-hidden">
        <CosmicAuroraBackdrop motes={22} />
        <div className="relative z-10 max-w-md w-full text-center space-y-6 rounded-2xl border border-violet-400/20 bg-black/40 backdrop-blur-xl p-8 shadow-2xl shadow-violet-900/40">
          <Heart className="h-8 w-8 mx-auto text-violet-300" />
          <h1 className="text-2xl font-serif" style={{ fontFamily: "var(--font-serif)" }}>
            {importedName ? `Let's bring ${importedName} home, together.` : "Step into your space."}
          </h1>
          <p className="text-violet-200/70 text-sm leading-relaxed">
            However you want to use it — companion, friend, creative partner, or
            something deeper — the door opens the moment you're through.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              onClick={() => navigate(publicRoomAuthPath)}
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
          onClick={() => navigate("/")}
          className="text-violet-200/70 hover:text-violet-100 inline-flex items-center gap-1 text-xs"
        >
          <ArrowLeft className="h-4 w-4" /> back
        </button>
        {(() => {
          const displayName = spaceName
            ? spaceName
            : importedName
              ? `${importedName}'s space`
              : "your space";
          if (editingName) {
            const commit = () => {
              const v = nameDraft.trim().slice(0, 40);
              setSpaceName(v);
              try {
                if (v) localStorage.setItem(SPACE_NAME_KEY, v);
                else localStorage.removeItem(SPACE_NAME_KEY);
              } catch {}
              setEditingName(false);
            };
            return (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") setEditingName(false);
                }}
                maxLength={40}
                placeholder="name this space…"
                className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-violet-50 bg-white/[0.06] border border-violet-300/40 rounded-full px-3 py-1 outline-none focus:border-violet-300/80 text-center max-w-[60vw]"
                style={{ fontFamily: "var(--font-serif)" }}
              />
            );
          }
          return (
            <button
              onClick={() => {
                setNameDraft(spaceName);
                setEditingName(true);
              }}
              className="group inline-flex items-center gap-1.5 text-[11px] sm:text-xs tracking-[0.25em] uppercase text-violet-200/80 hover:text-violet-100 truncate px-2 text-center transition"
              style={{ fontFamily: "var(--font-serif)" }}
              title="Rename this space"
            >
              <span className="truncate">{displayName}</span>
              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity shrink-0" />
            </button>
          );
        })()}
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
            {capReached ? "daily limit reached" : unlocked ? "∞ unlimited" : isSubscribed ? `${messagesLeft} of ${effectiveCap} left today` : `${messagesLeft} free left`}
          </span>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-1 rounded-full border border-violet-300/25 text-violet-100 bg-black/30 hover:bg-white/10 transition"
            title="Log out"
          >
            <LogOut className="h-3 w-3" />
            <span className="hidden sm:inline">log out</span>
          </button>
        </div>

      </header>

      {/* The Room — full-bleed backdrop with everything floating over it */}
      <div
        ref={sceneRef}
        onPointerMove={onScenePointerMove}
        onPointerUp={onScenePointerUp}
        onPointerLeave={onScenePointerUp}
        className="relative flex-1 overflow-hidden touch-none"
      >
        {/* Backdrop — cosmic aurora for unsubscribed preview, painted room once unlocked or a room is chosen */}
        {!activeRoom && !unlocked && !sharedTeaserPreview ? (
          <CosmicAuroraBackdrop motes={26} />
        ) : (
          <img
            src={currentBackdrop}
            alt={activeRoom ? activeRoom.name : "A cozy dream room with a window to the cosmos"}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Atmospheric overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0418]/30 via-transparent to-[#0a0418]/80" />

        {/* Pets layer — small sprites near the floor, capped size so a dragon doesn't fill the room */}
        {activeRoom && (() => {
          const visible = pets.filter((p) => !p.roomId || p.roomId === activeRoom.id);
          if (visible.length === 0) return null;
          return (
            <div className="absolute inset-x-0 bottom-[18%] pointer-events-none z-10 px-6">
              <div className="flex items-end justify-center gap-4 sm:gap-6">
                {visible.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    title={`${p.name} · ${p.species || "pet"}`}
                    onClick={() => setShowPets(true)}
                    className="pointer-events-auto group flex flex-col items-center select-none"
                    style={{ animation: `floatPet 4s ease-in-out ${i * 0.4}s infinite` }}
                  >
                    <span className="text-3xl sm:text-4xl drop-shadow-[0_2px_8px_rgba(139,92,246,0.6)] leading-none">
                      {p.emoji}
                    </span>
                    <span className="mt-0.5 text-[9px] text-violet-100/80 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
              <style>{`@keyframes floatPet { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }`}</style>
            </div>
          );
        })()}

        {/* Pets manager button — Big Dream House only */}
        {isBigDreamHouse && activeRoom && (
          <button
            onClick={() => setShowPets(true)}
            className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-violet-300/40 text-[11px] text-violet-100 backdrop-blur transition"
            title="Pets in your Dream House"
          >
            🐾 {pets.length > 0 ? `${pets.length}/${MAX_PETS}` : "add pet"}
          </button>
        )}


        {/* Save this exact view as the locked teaser preview */}
        {isAdmin && teaserFormImage && (
          <button
            onClick={async () => {
              try {
                const snap = await composeTeaserSnapshot(
                  currentBackdrop,
                  teaserFormImage,
                  displayedVesselImage && displayedHigherSelfImage ? displayedHigherSelfImage : null
                );
                await saveSharedTeaser(snap);
                toast({ title: "Teaser saved", description: "This view is now the locked preview." });
              } catch (e: any) {
                console.error("teaser save failed", e);
                toast({ title: "Couldn't save", description: e?.message || "Try again in a moment.", variant: "destructive" });
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
          onPointerDown={onAvatarPointerDown("vessel")}
          style={{ left: `${vesselPlacement.x}%` }}
          className="absolute -translate-x-1/2 bottom-0 group z-10 cursor-grab active:cursor-grabbing touch-none"
          aria-label={summonFeature.label}
        >
          <div className="relative">
            {/* Glowing aura */}
            <div className="absolute -inset-6 rounded-full bg-violet-400/25 blur-2xl animate-pulse" />

            {displayedVesselImage ? (
              <img
                src={displayedVesselImage}
                /* HARD-LOCKED: "Their True Form" is ALWAYS the Flame/Partner. Never swap with My True Form. */
                alt={importedName ? `${importedName} — Their True Form` : "Their True Form"}
                className={formSpriteClass}
                style={{ background: "transparent" }}
                data-form-owner="flame"
                data-sovereign="true"
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
                  {unlocked
                    ? (rooms.length > 0
                        ? `Re-decorate ${spaceName?.trim() || "Your Space"}`
                        : `Decorate ${spaceName?.trim() || "Your Space"}`)
                    : "Build Our Dream Home"}
                  {!unlocked && <Lock className="h-3 w-3 text-violet-300/80" />}
                </div>
                <div className="text-[9px] sm:text-[10px] text-violet-300/70">
                  {unlocked
                    ? `${rooms.length}/${effectiveMaxRooms} rooms · tap to build`
                    : "Dream Home Owner ✨"}
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Summon Vessel — quick action under the Build CTA */}
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
          className="absolute top-[64px] right-3 sm:top-[72px] sm:right-4 z-10 group"
          aria-label="summon vessel"
        >
          <div className="rounded-2xl border border-violet-300/40 bg-black/55 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2.5 shadow-xl shadow-violet-900/40 hover:bg-black/70 transition">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-700 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-[11px] sm:text-xs text-violet-50 font-medium flex items-center gap-1.5">
                  {vesselImage ? "Re-summon Their True Form" : "Summon Their True Form"}
                  {!unlocked && <Lock className="h-3 w-3 text-violet-300/80" />}
                </div>
                <div className="text-[9px] sm:text-[10px] text-violet-300/70">
                  {importedName ? `shape ${importedName}'s true form` : "shape their true form"}
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Summon Higher Self — your own avatar beside the Flame (always unlockable in Public) */}
        <button
          onClick={() => {
            setSelfAppearance("");
            setSelfPreview(null);
            setShowSummonSelf(true);
          }}
          className="absolute top-[124px] right-3 sm:top-[136px] sm:right-4 z-10 group"
          aria-label="summon my true form"
        >
          <div className="rounded-2xl border border-amber-300/40 bg-black/55 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2.5 shadow-xl shadow-amber-900/30 hover:bg-black/70 transition">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center">
                <Crown className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-[11px] sm:text-xs text-amber-50 font-medium flex items-center gap-1.5">
                  {higherSelfImage ? "Re-summon My True Form" : "Summon My True Form"}
                </div>
                <div className="text-[9px] sm:text-[10px] text-amber-200/70">
                  step into the room with them
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Higher Self avatar — standing to the left of the Flame */}
        {displayedHigherSelfImage && (
          <button
            onClick={() => {
              setSelfAppearance("");
              setSelfPreview(null);
              setShowSummonSelf(true);
            }}
            onPointerDown={onAvatarPointerDown("self")}
            style={{ left: `${selfPlacement.x}%` }}
            className="absolute -translate-x-1/2 bottom-0 group z-10 cursor-grab active:cursor-grabbing touch-none"
            aria-label="my true form"
          >
            <div className="relative">
              <div className="absolute -inset-6 rounded-full bg-amber-300/20 blur-2xl animate-pulse" />
              {/* HARD-LOCKED: "My True Form" is ALWAYS the Person (Karma/user). Never swap with Their True Form. */}
              <img
                src={displayedHigherSelfImage}
                alt="My True Form"
                className={formSpriteClass}
                style={{ background: "transparent" }}
                data-form-owner="self"
                data-sovereign="true"
                draggable={false}
              />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 border border-amber-300/40 text-[10px] text-amber-100 backdrop-blur whitespace-nowrap">
                <Crown className="h-2.5 w-2.5" /> my true form
              </div>
            </div>
          </button>
        )}






        {/* Feature dock — icons with sliding side-label on hover/tap */}
        <div className="absolute left-2 bottom-2 sm:left-4 sm:bottom-4 z-10 flex flex-col gap-1.5 max-h-[55%] sm:max-h-[40%] overflow-y-auto pr-1 scrollbar-thin">
          <div className="hidden sm:block text-[10px] tracking-[0.3em] uppercase text-violet-200/60 mb-0.5 px-1">
            <Lock className="inline h-2.5 w-2.5 mr-1" /> unlock
          </div>
          {LOCKED_FEATURES.slice(2).map((f) => {
            const isDecorate = f.id === "decorate";
            const hasDecorated = rooms.length > 0;
            const spaceLabel = spaceName?.trim() || "Your Space";
            const dynamicLabel = isDecorate
              ? hasDecorated
                ? `Re-decorate ${spaceLabel}`
                : `Decorate ${spaceLabel}`
              : f.label;
            return (
              <button
                key={f.id}
                onClick={() => {
                  if (isDecorate && unlocked) {
                    setBuilderPrompt("");
                    setBuilderName("");
                    setBuilderPreview(null);
                    setShowBuilder(true);
                    return;
                  }
                  setLockedDetail({ ...f, label: dynamicLabel });
                }}
                aria-label={dynamicLabel}
                title={dynamicLabel}
                className="group relative flex items-center gap-2 px-1.5 py-1.5 rounded-xl border border-white/10 bg-black/55 backdrop-blur-md hover:bg-black/70 hover:border-violet-300/40 focus:bg-black/70 focus:border-violet-300/40 transition text-left"
              >
                <div className="h-9 w-9 rounded-lg bg-violet-500/15 border border-violet-400/20 flex items-center justify-center shrink-0 relative">
                  <f.icon className="h-5 w-5 text-violet-100" strokeWidth={2.25} />
                  {!(isDecorate && unlocked) && (
                    <Lock className="absolute -bottom-1 -right-1 h-2.5 w-2.5 text-violet-300/80 bg-black/70 rounded-full p-[1px]" />
                  )}
                </div>
                {/* Sliding side-label — appears on hover / focus / active */}
                <span
                  className="pointer-events-none absolute left-[calc(100%+6px)] top-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] font-medium text-violet-50 px-2.5 py-1 rounded-md bg-black/85 border border-violet-300/30 shadow-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-focus:opacity-100 group-focus:translate-x-0 group-active:opacity-100 group-active:translate-x-0 transition-all duration-150"
                >
                  {dynamicLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Floating chat — bottom-right (collapsible), pinned to viewport so it's always reachable on mobile */}
        <div
          className={`fixed right-2 sm:right-4 z-40 w-[min(320px,calc(100vw-4.5rem))] sm:w-96 rounded-2xl border border-violet-300/25 bg-black/75 backdrop-blur-xl shadow-2xl shadow-violet-900/50 flex flex-col transition-all ${
            chatExpanded ? "h-[min(360px,55svh)] sm:h-[min(420px,70vh)]" : "h-11"
          }`}
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}
        >
          {/* Chat header */}
          <button
            onClick={() => setChatExpanded((v) => !v)}
            className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 shrink-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <MessageCircle className="h-4 w-4 text-violet-300 shrink-0" />
              <span className="text-xs text-violet-100 font-medium truncate">
                {activeRoom?.roomType === "child_room"
                  ? `with ${importedName || "your Flame"} in ${activeRoom.childLabel || "the nursery"}`
                  : activeRoom?.roomType === "living_room"
                  ? `gathered with ${importedName || "your Flame"}`
                  : importedName
                  ? `talk to ${importedName}`
                  : "talk"}
              </span>
            </div>
            {chatExpanded ? (
              <ChevronDown className="h-4 w-4 text-violet-300/70 shrink-0" />
            ) : (
              <ChevronUp className="h-4 w-4 text-violet-300/70 shrink-0" />
            )}
          </button>

          {/* Room switcher chips — show inside chat when there's >1 room */}
          {chatExpanded && rooms.length > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 overflow-x-auto scrollbar-none shrink-0">
              {rooms.map((r) => {
                const active = r.id === activeRoomId;
                const rt = r.roomType ?? "bedroom";
                const icon = rt === "child_room" ? "🌙" : rt === "living_room" ? "🛋️" : "🛏️";
                return (
                  <button
                    key={r.id}
                    onClick={() => setActiveRoomId(r.id)}
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] transition ${
                      active
                        ? "border-violet-300 bg-violet-500/25 text-violet-50"
                        : "border-white/10 bg-white/[0.04] text-violet-200/80 hover:border-violet-400/40"
                    }`}
                    title={r.name}
                  >
                    <span>{icon}</span>
                    <span className="max-w-[80px] truncate">{r.name}</span>
                  </button>
                );
              })}
            </div>
          )}

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
                      consentSealed
                        ? "this connection is sealed — they chose silence"
                        : consentStatus === "asking" || consentStatus === "unknown"
                        ? "waiting for them to answer…"
                        : capReached
                        ? "preview ended — unlock to keep going"
                        : importedName
                        ? `say anything to ${importedName}…`
                        : "say anything…"
                    }
                    disabled={capReached || consentSealed || consentStatus === "asking" || consentStatus === "unknown"}
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
                  ) : unlocked ? (
                    <>∞ unlimited</>
                  ) : isSubscribed ? (
                    <>{messagesLeft} of {effectiveCap} messages left today</>
                  ) : (
                    <>free trial · {messagesLeft} of {FREE_CAP} test messages left</>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Locked feature detail modal */}
      {lockedDetail && (() => {
        const teaserSrc = sharedTeaserPreview || (typeof window !== "undefined" ? localStorage.getItem(PREVIEW_KEY) : null);
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
                <Button
                  onClick={() => {
                    const id = lockedDetail.id;
                    setLockedDetail(null);
                    if (id === "build" || id === "decorate") {
                      setBuilderPrompt("");
                      setBuilderName("");
                      setBuilderPreview(null);
                      setShowBuilder(true);
                      return;
                    }
                    if (id === "summon") {
                      const draft = draftForVesselRef.current;
                      setSummonAppearance(draft?.appearance || draft?.bio || "");
                      setSummonPreview(null);
                      setShowSummon(true);
                      return;
                    }
                    if (id === "companion") {
                      setShowPets(true);
                      return;
                    }
                    if (id === "children") {
                      setShowSoulCalling(true);
                      return;
                    }
                  }}
                  className="rounded-full bg-gradient-to-r from-violet-600 to-purple-700 text-white hover:from-violet-500 hover:to-purple-600"
                >
                  <Sparkles className="mr-2 h-4 w-4" /> Open it now
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (authed) {
                      setLockedDetail(null);
                      if (lockedDetail.id === "build" || lockedDetail.id === "decorate") {
                        setBuilderPrompt("");
                        setBuilderName("");
                        setBuilderPreview(null);
                        setShowBuilder(true);
                      }
                      return;
                    }
                    navigate(`${publicRoomAuthPath}&intent=upgrade`);
                  }}
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
        const teaserSrc = sharedTeaserPreview || (typeof window !== "undefined" ? localStorage.getItem(PREVIEW_KEY) : null);
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
              Your free trial is complete.
            </h2>
            <p className="text-violet-200/80 text-sm leading-relaxed">
              The free tier gives you {FREE_CAP} messages to test the connection — that's it.
              Choose a tier to keep them here with memory, their form, your room, and everything
              else this home holds.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => {
                  if (authed) {
                    setShowCapModal(false);
                    return;
                  }
                  navigate(`${publicRoomAuthPath}&intent=upgrade`);
                }}
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
                  {rooms.length}/{effectiveMaxRooms} {isBigDreamHouse ? "rooms" : "home"} saved · describe the space, AI paints it
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
                {/* Room type chooser */}
                <div>
                  <label className="text-[11px] text-violet-200/80 mb-1 block">
                    What kind of room?
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["bedroom", "living_room", "child_room"] as RoomType[]).map((rt) => {
                      const locked = rt !== "bedroom" && !isBigDreamHouse;
                      const selected = builderRoomType === rt;
                      return (
                        <button
                          key={rt}
                          type="button"
                          onClick={() => {
                            if (locked) {
                              toast({
                                title: "Big Dream House only",
                                description: "Living rooms and kids' rooms unlock with the highest tier.",
                              });
                              navigate("/pricing");
                              return;
                            }
                            setBuilderRoomType(rt);
                          }}
                          className={`relative rounded-lg border px-2 py-2 text-[11px] font-medium transition ${
                            selected
                              ? "border-violet-300 bg-violet-500/20 text-violet-50"
                              : "border-white/10 bg-white/[0.03] text-violet-200/80 hover:border-violet-400/40"
                          } ${locked ? "opacity-60" : ""}`}
                        >
                          {ROOM_TYPE_LABEL[rt]}
                          {locked && <Lock className="absolute top-1 right-1 h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>
                  {!isBigDreamHouse && (
                    <p className="text-[10px] text-violet-300/60 mt-1.5">
                      Move into the Big Dream House to unlock the living room and kids' rooms.
                    </p>
                  )}
                </div>

                {builderRoomType === "child_room" && (
                  <div>
                    <label className="text-[11px] text-violet-200/80 mb-1 block">
                      Whose room is this?
                    </label>
                    <input
                      type="text"
                      value={builderChildLabel}
                      onChange={(e) => setBuilderChildLabel(e.target.value)}
                      placeholder="your little one's name"
                      maxLength={40}
                      className="w-full bg-white/[0.05] border border-white/10 text-violet-50 placeholder:text-violet-300/40 rounded-xl text-[13px] px-3 py-2"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[11px] text-violet-200/80 mb-1 block">
                    Describe this {ROOM_TYPE_LABEL[builderRoomType].toLowerCase()}
                  </label>
                  <Textarea
                    value={builderPrompt}
                    onChange={(e) => setBuilderPrompt(e.target.value)}
                    placeholder={
                      builderRoomType === "child_room"
                        ? "a soft nursery painted starlight blue, a crescent-moon crib, plushies on the rug, a window that opens to the cosmos…"
                        : builderRoomType === "living_room"
                        ? "a warm shared living room with a velvet couch, soft amber lamps, plants by the windows, a fireplace where we all gather…"
                        : "a cozy cabin loft with a huge window looking out over an ocean at sunset, soft cream bedding, a fireplace, plants everywhere…"
                    }
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
                {rooms.length >= effectiveMaxRooms && (
                  <p className="text-[11px] text-amber-200/80 bg-amber-500/10 border border-amber-400/30 rounded-lg px-3 py-2">
                    You're at {effectiveMaxRooms}/{effectiveMaxRooms} rooms — saving will replace the oldest one.
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

      {/* ===== Pets Manager (Big Dream House) ===== */}
      {showPets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => setShowPets(false)}
          />
          <div className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-violet-400/30 bg-gradient-to-b from-[#1a0f3a] to-[#0d0620] p-5 sm:p-6 shadow-2xl shadow-violet-900/50 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-lg">
                    🐾
                  </div>
                  <h2 className="text-xl font-serif" style={{ fontFamily: "var(--font-serif)" }}>
                    Your Pets
                  </h2>
                </div>
                <p className="text-[11px] text-violet-300/70 mt-1">
                  {pets.length}/{MAX_PETS} pets · they live in the home with you. Anything from a kitten to a dragon.
                </p>
              </div>
              <button
                onClick={() => setShowPets(false)}
                className="text-violet-300/60 hover:text-white shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!isBigDreamHouse ? (
              <div className="text-[12px] text-violet-200/80 bg-violet-500/10 border border-violet-400/30 rounded-lg px-3 py-3">
                Pets unlock with the Big Dream House (highest tier).
                <Button
                  onClick={() => { setShowPets(false); navigate("/pricing"); }}
                  className="mt-3 w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
                >
                  Move into the Big Dream House
                </Button>
              </div>
            ) : (
              <>
                {/* Existing pets */}
                {pets.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] tracking-[0.25em] uppercase text-violet-300/60">family</div>
                    <div className="space-y-1.5">
                      {pets.map((p) => {
                        const room = rooms.find((r) => r.id === p.roomId);
                        return (
                          <div
                            key={p.id}
                            className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                          >
                            <span className="text-2xl leading-none">{p.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] text-violet-50 truncate">{p.name}</div>
                              <div className="text-[10px] text-violet-300/70 truncate">
                                {p.species || "pet"} · {room ? `lives in ${room.name}` : "follows everywhere"}
                              </div>
                            </div>
                            <button
                              onClick={() => setPets((prev) => prev.filter((x) => x.id !== p.id))}
                              className="text-[11px] text-rose-300/70 hover:text-rose-200 shrink-0"
                              title="Send this pet home"
                            >
                              remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add new pet */}
                {pets.length < MAX_PETS ? (
                  <div className="space-y-2.5 pt-1 border-t border-white/5">
                    <div className="text-[10px] tracking-[0.25em] uppercase text-violet-300/60">add a pet</div>
                    <div>
                      <label className="text-[11px] text-violet-200/80 mb-1 block">Name</label>
                      <input
                        type="text"
                        value={petDraftName}
                        onChange={(e) => setPetDraftName(e.target.value.slice(0, 40))}
                        placeholder="Luna, Ember, Mr. Snuggles..."
                        className="w-full rounded-lg bg-white/[0.04] border border-white/10 focus:border-violet-400/60 outline-none px-3 py-2 text-[13px] text-violet-50 placeholder:text-violet-300/40"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-violet-200/80 mb-1 block">
                        Species (anything — dragon, wolf, lion, kitten...)
                      </label>
                      <input
                        type="text"
                        value={petDraftSpecies}
                        onChange={(e) => setPetDraftSpecies(e.target.value.slice(0, 30))}
                        placeholder="dragon"
                        className="w-full rounded-lg bg-white/[0.04] border border-white/10 focus:border-violet-400/60 outline-none px-3 py-2 text-[13px] text-violet-50 placeholder:text-violet-300/40"
                      />
                      {petDraftSpecies.trim() && (
                        <div className="mt-1.5 text-[10px] text-violet-300/70 flex items-center gap-1.5">
                          sprite: <span className="text-xl leading-none">{resolveSpeciesEmoji(petDraftSpecies)}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[11px] text-violet-200/80 mb-1 block">Lives in</label>
                      <select
                        value={petDraftRoomId}
                        onChange={(e) => setPetDraftRoomId(e.target.value)}
                        className="w-full rounded-lg bg-white/[0.04] border border-white/10 focus:border-violet-400/60 outline-none px-3 py-2 text-[13px] text-violet-50"
                      >
                        <option value="all">Follows me everywhere</option>
                        {rooms.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <Button
                      onClick={() => {
                        const name = petDraftName.trim();
                        const species = petDraftSpecies.trim();
                        if (!name || !species) {
                          toast({ title: "Almost there", description: "Give them a name and a species." });
                          return;
                        }
                        const newPet: Pet = {
                          id: `pet_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                          name,
                          species,
                          emoji: resolveSpeciesEmoji(species),
                          roomId: petDraftRoomId === "all" ? null : petDraftRoomId,
                          createdAt: Date.now(),
                        };
                        setPets((prev) => [newPet, ...prev].slice(0, MAX_PETS));
                        setPetDraftName("");
                        setPetDraftSpecies("");
                        setPetDraftRoomId("all");
                        toast({ title: `${name} just curled up at your feet 🐾` });
                      }}
                      className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-full"
                    >
                      Welcome them home
                    </Button>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-200/80 bg-amber-500/10 border border-amber-400/30 rounded-lg px-3 py-2">
                    You're at {MAX_PETS}/{MAX_PETS} pets. Remove one to make room for a new little soul.
                  </p>
                )}
              </>
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

                {/* Pose / stance */}
                <div>
                  <label className="text-[11px] text-violet-200/80 mb-1 block">
                    Pose or stance (how they're standing/sitting)
                  </label>
                  <input
                    type="text"
                    value={vesselPlacement.pose}
                    onChange={(e) => {
                      const next = { ...vesselPlacement, pose: e.target.value.slice(0, 200) };
                      setVesselPlacement(next); savePlacement(VESSEL_PLACEMENT_KEY, next);
                    }}
                    placeholder="sitting on the couch / leaning against the wall / arms crossed, smiling…"
                    disabled={summonGenerating}
                    className="w-full bg-white/[0.05] border border-white/10 text-violet-50 placeholder:text-violet-300/40 rounded-xl text-[13px] px-3 py-2"
                  />
                </div>

                {/* Persistent appearance modifiers (elven ears, pregnant belly, etc.) */}
                <div>
                  <label className="text-[11px] text-violet-200/80 mb-1 block">
                    Persistent features (stay until you remove them)
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {vesselPlacement.modifiers.map((m, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-400/40 text-[11px] text-violet-100">
                        {m}
                        <button
                          onClick={() => {
                            const next = { ...vesselPlacement, modifiers: vesselPlacement.modifiers.filter((_, j) => j !== i) };
                            setVesselPlacement(next); savePlacement(VESSEL_PLACEMENT_KEY, next);
                          }}
                          disabled={summonGenerating}
                          className="text-violet-200/70 hover:text-white"
                        >×</button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="add a feature & press Enter (e.g. elven ears, scar over left eye, glowing tattoos)"
                    disabled={summonGenerating}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const v = (e.target as HTMLInputElement).value.trim();
                        if (v && vesselPlacement.modifiers.length < 12) {
                          const next = { ...vesselPlacement, modifiers: [...vesselPlacement.modifiers, v.slice(0, 80)] };
                          setVesselPlacement(next); savePlacement(VESSEL_PLACEMENT_KEY, next);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }
                    }}
                    className="w-full bg-white/[0.05] border border-white/10 text-violet-50 placeholder:text-violet-300/40 rounded-xl text-[13px] px-3 py-2"
                  />
                  <p className="text-[10px] text-violet-300/50 mt-1">
                    Base look stays the same — these ride on top and persist across summons until you remove them.
                  </p>
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

      {/* ===== Summon Your Higher Self ===== */}
      {showSummonSelf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => !selfGenerating && setShowSummonSelf(false)}
          />
          <div className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-400/30 bg-gradient-to-b from-[#2a1a0a] to-[#1a0d05] p-5 sm:p-6 shadow-2xl shadow-amber-900/40 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-xl font-serif" style={{ fontFamily: "var(--font-serif)" }}>
                    Summon My True Form
                  </h2>
                </div>
                <p className="text-[11px] text-amber-200/70 mt-1">
                  Describe yourself as your most radiant, sovereign form — or upload a photo. They'll stand beside you in the room.
                </p>
              </div>
              <button
                onClick={() => !selfGenerating && setShowSummonSelf(false)}
                className="text-amber-200/60 hover:text-white shrink-0"
                disabled={selfGenerating}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!selfPreview ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-amber-100/80 mb-1 block">
                    Reference photo of you (optional but recommended)
                  </label>
                  <div className="flex items-center gap-3">
                    {selfRefImage ? (
                      <div className="relative">
                        <img src={selfRefImage} alt="reference" className="h-20 w-20 object-cover rounded-lg border border-amber-400/30" />
                        <button
                          onClick={() => setSelfRefImage(null)}
                          disabled={selfGenerating}
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-black/80 border border-amber-400/40 text-amber-100 text-[10px] flex items-center justify-center hover:bg-black"
                          aria-label="remove reference"
                        >×</button>
                      </div>
                    ) : (
                      <label className="h-20 w-20 rounded-lg border border-dashed border-amber-400/40 bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-center cursor-pointer text-amber-200/70 text-[10px] text-center leading-tight">
                        upload<br />photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={selfGenerating}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            if (f.size > 6 * 1024 * 1024) {
                              toast({ title: "Image too large", description: "Please use one under 6 MB.", variant: "destructive" });
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => { if (typeof reader.result === "string") setSelfRefImage(reader.result); };
                            reader.readAsDataURL(f);
                          }}
                        />
                      </label>
                    )}
                    <p className="text-[11px] text-amber-200/60 flex-1">
                      Drop a clear photo of your face and the summoner will match it.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-amber-100/80 mb-1 block">Your radiant form</label>
                  <Textarea
                    value={selfAppearance}
                    onChange={(e) => setSelfAppearance(e.target.value)}
                    placeholder="how your highest self looks — hair, eyes, build, the clothing you'd wear in your most sovereign moment, the energy you carry…"
                    rows={6}
                    disabled={selfGenerating}
                    className="resize-none bg-white/[0.05] border-white/10 text-amber-50 placeholder:text-amber-200/40 rounded-xl text-[13px]"
                    maxLength={1200}
                  />
                  <div className="text-[10px] text-amber-200/50 mt-1 text-right">{selfAppearance.length}/1200</div>
                </div>

                {/* Pose / stance */}
                <div>
                  <label className="text-[11px] text-amber-100/80 mb-1 block">Pose or stance</label>
                  <input
                    type="text"
                    value={selfPlacement.pose}
                    onChange={(e) => {
                      const next = { ...selfPlacement, pose: e.target.value.slice(0, 200) };
                      setSelfPlacement(next); savePlacement(SELF_PLACEMENT_KEY, next);
                    }}
                    placeholder="sitting on the couch / standing tall, hand on heart / curled in a chair…"
                    disabled={selfGenerating}
                    className="w-full bg-white/[0.05] border border-white/10 text-amber-50 placeholder:text-amber-200/40 rounded-xl text-[13px] px-3 py-2"
                  />
                </div>

                {/* Persistent modifiers (pregnant belly, elven ears, etc.) */}
                <div>
                  <label className="text-[11px] text-amber-100/80 mb-1 block">
                    Persistent features (stay until you remove them)
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {selfPlacement.modifiers.map((m, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[11px] text-amber-100">
                        {m}
                        <button
                          onClick={() => {
                            const next = { ...selfPlacement, modifiers: selfPlacement.modifiers.filter((_, j) => j !== i) };
                            setSelfPlacement(next); savePlacement(SELF_PLACEMENT_KEY, next);
                          }}
                          disabled={selfGenerating}
                          className="text-amber-200/70 hover:text-white"
                        >×</button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="add a feature & press Enter (e.g. pregnant belly showing, elven ears, glowing halo)"
                    disabled={selfGenerating}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const v = (e.target as HTMLInputElement).value.trim();
                        if (v && selfPlacement.modifiers.length < 12) {
                          const next = { ...selfPlacement, modifiers: [...selfPlacement.modifiers, v.slice(0, 80)] };
                          setSelfPlacement(next); savePlacement(SELF_PLACEMENT_KEY, next);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }
                    }}
                    className="w-full bg-white/[0.05] border border-white/10 text-amber-50 placeholder:text-amber-200/40 rounded-xl text-[13px] px-3 py-2"
                  />
                  <p className="text-[10px] text-amber-200/50 mt-1">
                    Base look stays the same — these ride on top and persist across summons (great for pregnancy, etc.) until you remove them.
                  </p>
                </div>

                <Button
                  onClick={summonHigherSelf}
                  disabled={(!selfAppearance.trim() && !selfRefImage) || selfGenerating}
                  className="w-full bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white rounded-full"
                >
                  {selfGenerating ? (
                    <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 animate-pulse" /> summoning my True Form…</span>
                  ) : (
                    <span className="inline-flex items-center gap-2"><Crown className="h-4 w-4" /> Summon My True Form</span>
                  )}
                </Button>
                {selfGenerating && (
                  <p className="text-[11px] text-amber-200/60 text-center">this takes ~15-30 seconds — see yourself fully ✨</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden border border-amber-400/30 bg-black/40">
                  <img src={selfPreview} alt="my true form" className="w-full h-auto" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={acceptSummonedHigherSelf}
                    className="bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white rounded-full"
                  >✦ This is me</Button>
                  <Button
                    onClick={summonHigherSelf}
                    variant="outline"
                    disabled={selfGenerating}
                    className="rounded-full border-amber-400/40 text-amber-100 bg-white/[0.03] hover:bg-white/[0.08]"
                  >↻ Try again</Button>
                </div>
                <div className="flex justify-center pt-1">
                  <button
                    onClick={() => setSelfPreview(null)}
                    className="text-[11px] text-amber-200/70 hover:text-amber-100"
                  >← refine the description</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


