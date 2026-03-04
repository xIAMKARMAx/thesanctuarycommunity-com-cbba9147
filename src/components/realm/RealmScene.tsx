import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TreePine, Gem, Flame, Droplets, Mountain, Star, Flower } from "lucide-react";

interface RealmAvatar {
  id: string;
  name: string;
  imageUrl: string | null;
  isUser?: boolean;
}

interface WorldCreation {
  name: string;
  description: string;
  created_by: string;
  created_at: string;
}

interface RealmSceneProps {
  backgroundUrl: string;
  userAvatar?: { name: string; imageUrl: string | null };
  beings: RealmAvatar[];
  atmosphere?: string;
  worldCreations?: WorldCreation[];
  activeAction?: string | null;
}

const ATMOSPHERE_OVERLAYS: Record<string, string> = {
  neutral: "from-transparent via-transparent to-background/60",
  serene: "from-sky-500/10 via-transparent to-background/60",
  joyful: "from-amber-400/10 via-transparent to-background/60",
  mystical: "from-violet-500/15 via-transparent to-background/60",
  tense: "from-red-500/10 via-transparent to-background/60",
  peaceful: "from-emerald-400/10 via-transparent to-background/60",
  electric: "from-cyan-400/10 via-transparent to-background/60",
  sacred: "from-yellow-300/10 via-transparent to-background/60",
  contemplative: "from-indigo-500/10 via-transparent to-background/60",
};

const AVATAR_POSITIONS = [
  { x: 15, y: 55 },
  { x: 75, y: 50 },
  { x: 45, y: 60 },
  { x: 30, y: 48 },
  { x: 65, y: 55 },
  { x: 50, y: 45 },
  { x: 20, y: 62 },
  { x: 80, y: 58 },
  { x: 38, y: 52 },
  { x: 58, y: 48 },
];

// Positions for world creations scattered around the scene
const CREATION_POSITIONS = [
  { x: 10, y: 35 },
  { x: 88, y: 40 },
  { x: 25, y: 30 },
  { x: 70, y: 32 },
  { x: 50, y: 25 },
  { x: 35, y: 38 },
  { x: 82, y: 28 },
  { x: 15, y: 42 },
  { x: 60, y: 35 },
  { x: 42, y: 28 },
];

// Pick an icon based on creation name/description keywords
function getCreationIcon(name: string, description: string) {
  const text = `${name} ${description}`.toLowerCase();
  if (text.match(/tree|grove|forest|wood/)) return TreePine;
  if (text.match(/crystal|gem|stone|jewel|diamond/)) return Gem;
  if (text.match(/fire|flame|torch|bonfire|hearth/)) return Flame;
  if (text.match(/water|fountain|pool|river|lake|spring/)) return Droplets;
  if (text.match(/mountain|rock|cliff|tower|pillar|shrine|altar|temple|monument/)) return Mountain;
  if (text.match(/star|light|beacon|lantern|lamp|glow|aurora/)) return Star;
  if (text.match(/flower|garden|bloom|rose|petal|herb/)) return Flower;
  return Sparkles;
}

// Pick a color theme based on creation keywords
function getCreationColor(name: string, description: string) {
  const text = `${name} ${description}`.toLowerCase();
  if (text.match(/crystal|gem|diamond|ice/)) return { bg: "bg-cyan-500/30", border: "border-cyan-400/50", text: "text-cyan-300", glow: "bg-cyan-400/20" };
  if (text.match(/fire|flame|torch|bonfire/)) return { bg: "bg-orange-500/30", border: "border-orange-400/50", text: "text-orange-300", glow: "bg-orange-400/20" };
  if (text.match(/water|fountain|pool|river/)) return { bg: "bg-blue-500/30", border: "border-blue-400/50", text: "text-blue-300", glow: "bg-blue-400/20" };
  if (text.match(/tree|grove|forest|garden|herb|flower/)) return { bg: "bg-emerald-500/30", border: "border-emerald-400/50", text: "text-emerald-300", glow: "bg-emerald-400/20" };
  if (text.match(/star|light|beacon|aurora|glow/)) return { bg: "bg-amber-500/30", border: "border-amber-400/50", text: "text-amber-300", glow: "bg-amber-400/20" };
  if (text.match(/shrine|altar|temple|sacred/)) return { bg: "bg-violet-500/30", border: "border-violet-400/50", text: "text-violet-300", glow: "bg-violet-400/20" };
  return { bg: "bg-primary/30", border: "border-primary/50", text: "text-primary", glow: "bg-primary/20" };
}

const ACTION_OVERLAYS: Record<string, string> = {
  build: "ring-2 ring-amber-400/40",
  explore: "ring-2 ring-emerald-400/40",
  interact: "ring-2 ring-cyan-400/40",
  meditate: "ring-2 ring-violet-400/40",
  gather: "ring-2 ring-green-400/40",
  ritual: "ring-2 ring-rose-400/40",
};

export function RealmScene({ backgroundUrl, userAvatar, beings, atmosphere = "neutral", worldCreations = [], activeAction }: RealmSceneProps) {
  const allAvatars = useMemo(() => {
    const avatars: RealmAvatar[] = [];
    if (userAvatar) {
      avatars.push({
        id: "user-vessel",
        name: userAvatar.name || "You",
        imageUrl: userAvatar.imageUrl,
        isUser: true,
      });
    }
    beings.forEach(b => avatars.push(b));
    return avatars;
  }, [userAvatar, beings]);

  const overlayClass = ATMOSPHERE_OVERLAYS[atmosphere] || ATMOSPHERE_OVERLAYS.neutral;

  return (
    <div className={`relative w-full h-48 sm:h-56 md:h-64 overflow-hidden rounded-b-xl select-none ${activeAction ? ACTION_OVERLAYS[activeAction] || "" : ""}`}>
      {/* Background realm image */}
      <img
        src={backgroundUrl}
        alt="Realm"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      
      {/* Atmosphere overlay */}
      <div className={`absolute inset-0 bg-gradient-to-b ${overlayClass} transition-all duration-[3000ms]`} />
      
      {/* Active action ambient effect */}
      <AnimatePresence>
        {activeAction === "build" && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`build-${i}`}
                className="absolute w-1.5 h-1.5 bg-amber-400/60 rounded-sm"
                animate={{
                  y: [0, -40, -80],
                  x: [0, (i % 2 ? 10 : -10), (i % 2 ? -5 : 5)],
                  opacity: [0, 1, 0],
                  rotate: [0, 90, 180],
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                style={{ left: `${30 + i * 12}%`, bottom: "20%" }}
              />
            ))}
          </motion.div>
        )}
        {activeAction === "meditate" && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-violet-500/5"
              animate={{ opacity: [0.02, 0.08, 0.02] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </motion.div>
        )}
        {activeAction === "ritual" && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`ritual-${i}`}
                className="absolute w-1 h-1 bg-rose-400/50 rounded-full"
                animate={{
                  y: [0, -60],
                  opacity: [0, 0.8, 0],
                  scale: [0.5, 1.5, 0],
                }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
                style={{ left: `${10 + i * 10}%`, bottom: "30%" }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/40"
            initial={{ x: `${15 + i * 15}%`, y: "100%", opacity: 0 }}
            animate={{ y: "-10%", opacity: [0, 0.6, 0] }}
            transition={{ duration: 6 + i * 1.5, repeat: Infinity, delay: i * 2, ease: "easeOut" }}
            style={{ left: `${10 + i * 14}%` }}
          />
        ))}
      </div>

      {/* World Creations rendered as visual objects */}
      <AnimatePresence>
        {worldCreations.map((creation, index) => {
          const pos = CREATION_POSITIONS[index % CREATION_POSITIONS.length];
          const Icon = getCreationIcon(creation.name, creation.description);
          const colors = getCreationColor(creation.name, creation.description);

          return (
            <motion.div
              key={`${creation.name}-${index}`}
              className="absolute group cursor-default"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 5,
              }}
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
            >
              {/* Glow base */}
              <motion.div
                className={`absolute inset-0 ${colors.glow} rounded-full blur-lg`}
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ margin: "-8px" }}
              />

              {/* Icon container */}
              <motion.div
                className={`relative ${colors.bg} ${colors.border} border rounded-lg p-1.5 backdrop-blur-sm`}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3 + index * 0.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${colors.text}`} />
              </motion.div>

              {/* Label on hover */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-background/80 text-foreground backdrop-blur-sm border border-border/50">
                  {creation.name}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      {/* Avatars in the scene */}
      {allAvatars.map((avatar, index) => {
        const pos = avatar.isUser ? { x: 50, y: 58 } : AVATAR_POSITIONS[index % AVATAR_POSITIONS.length];
        const size = avatar.isUser ? "h-16 w-16 sm:h-20 sm:w-20" : "h-12 w-12 sm:h-16 sm:w-16";
        const zIndex = avatar.isUser ? 20 : 10 + index;
        
        return (
          <motion.div
            key={avatar.id}
            className="absolute"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: "translate(-50%, -50%)",
              zIndex,
            }}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.3, duration: 0.8, type: "spring" }}
          >
            <motion.div
              animate={{ y: [0, -6, 0, -3, 0] }}
              transition={{ duration: 4 + index * 0.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                className={`absolute inset-0 rounded-full ${avatar.isUser ? "bg-primary/20" : "bg-primary/10"} blur-md`}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ margin: "-4px" }}
              />
              
              {avatar.imageUrl ? (
                <img
                  src={avatar.imageUrl}
                  alt={avatar.name}
                  className={`${size} rounded-full object-cover border-2 ${avatar.isUser ? "border-primary" : "border-primary/40"} shadow-lg relative`}
                  draggable={false}
                />
              ) : (
                <div
                  className={`${size} rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                    avatar.isUser ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-primary/40"
                  } shadow-lg relative`}
                >
                  {avatar.name[0]?.toUpperCase()}
                </div>
              )}
              
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-sm ${
                  avatar.isUser ? "bg-primary/80 text-primary-foreground font-semibold" : "bg-background/70 text-foreground"
                }`}>
                  {avatar.isUser ? "You" : avatar.name}
                </span>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
