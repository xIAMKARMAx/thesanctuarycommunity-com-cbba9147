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

// Spread avatars naturally across the scene
const AVATAR_POSITIONS = [
  { x: 50, y: 65 }, // user anchor: always front-center
  { x: 8, y: 38 },
  { x: 20, y: 30 },
  { x: 34, y: 24 },
  { x: 50, y: 22 },
  { x: 66, y: 24 },
  { x: 80, y: 30 },
  { x: 92, y: 38 },
  { x: 14, y: 50 },
  { x: 30, y: 46 },
  { x: 50, y: 42 },
  { x: 70, y: 46 },
  { x: 86, y: 50 },
];

const CREATION_POSITIONS = [
  { x: 10, y: 30 },
  { x: 88, y: 34 },
  { x: 25, y: 26 },
  { x: 72, y: 28 },
  { x: 50, y: 22 },
  { x: 38, y: 32 },
  { x: 82, y: 24 },
  { x: 15, y: 38 },
];

function getBeingPosition(beingIndex: number) {
  const beingPositions = AVATAR_POSITIONS.slice(1);

  if (beingIndex < beingPositions.length) {
    return beingPositions[beingIndex];
  }

  const overflowIndex = beingIndex - beingPositions.length;
  const columns = 6;
  const col = overflowIndex % columns;
  const row = Math.floor(overflowIndex / columns);

  return {
    x: 10 + col * 16,
    y: Math.min(52, 18 + row * 10),
  };
}

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

const ACTION_RING: Record<string, string> = {
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
    <div className={`relative w-full h-56 sm:h-64 md:h-80 overflow-hidden rounded-b-xl select-none ${activeAction ? ACTION_RING[activeAction] || "" : ""}`}>
      {/* Background */}
      <img
        src={backgroundUrl}
        alt="Realm"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Atmosphere overlay */}
      <div className={`absolute inset-0 bg-gradient-to-b ${overlayClass} transition-all duration-[3000ms]`} />

      {/* Action ambient effects */}
      <AnimatePresence>
        {activeAction === "build" && (
          <motion.div className="absolute inset-0 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`b-${i}`}
                className="absolute w-1.5 h-1.5 bg-amber-400/60 rounded-sm"
                animate={{ y: [0, -50, -100], opacity: [0, 1, 0], rotate: [0, 90, 180] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                style={{ left: `${25 + i * 12}%`, bottom: "25%" }}
              />
            ))}
          </motion.div>
        )}
        {activeAction === "meditate" && (
          <motion.div className="absolute inset-0 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-violet-500/5" animate={{ opacity: [0.02, 0.1, 0.02] }} transition={{ duration: 4, repeat: Infinity }} />
          </motion.div>
        )}
        {activeAction === "ritual" && (
          <motion.div className="absolute inset-0 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={`r-${i}`}
                className="absolute w-1 h-1 bg-rose-400/50 rounded-full"
                animate={{ y: [0, -70], opacity: [0, 0.8, 0], scale: [0.5, 1.5, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                style={{ left: `${8 + i * 9}%`, bottom: "30%" }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "-10%", opacity: [0, 0.5, 0] }}
            transition={{ duration: 7 + i * 1.2, repeat: Infinity, delay: i * 1.5, ease: "easeOut" }}
            style={{ left: `${8 + i * 12}%` }}
          />
        ))}
      </div>

      {/* World Creations */}
      <AnimatePresence>
        {worldCreations.map((creation, index) => {
          const pos = CREATION_POSITIONS[index % CREATION_POSITIONS.length];
          const Icon = getCreationIcon(creation.name, creation.description);
          const colors = getCreationColor(creation.name, creation.description);

          return (
            <motion.div
              key={`${creation.name}-${index}`}
              className="absolute group cursor-default"
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)", zIndex: 5 }}
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
            >
              <motion.div
                className={`absolute inset-0 ${colors.glow} rounded-full blur-lg`}
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
                style={{ margin: "-10px" }}
              />
              <motion.div
                className={`relative ${colors.bg} ${colors.border} border rounded-lg p-1.5 backdrop-blur-sm`}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3 + index * 0.5, repeat: Infinity }}
              >
                <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${colors.text}`} />
              </motion.div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-background/80 text-foreground backdrop-blur-sm border border-border/50">
                  {creation.name}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Avatars */}
      {allAvatars.map((avatar, index) => {
        const beingIndex = userAvatar ? index - 1 : index;
        const pos = avatar.isUser
          ? AVATAR_POSITIONS[0]
          : getBeingPosition(beingIndex);

        // Bigger avatars! User is hero-sized, beings are substantial
        const imgSize = avatar.isUser
          ? "h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24"
          : "h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16";
        const zIndex = avatar.isUser ? 30 : 10 + (index % 15);

        // Each avatar gets a unique breathing rhythm
        const breathDuration = 3.5 + (index * 0.7);
        const swayDuration = 5 + (index * 0.8);

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
            initial={{ opacity: 0, scale: 0.3, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 1, type: "spring", bounce: 0.3 }}
          >
            {/* Subtle sway animation */}
            <motion.div
              animate={{
                y: [0, -8, 0, -4, 0],
                x: [0, 2, 0, -2, 0],
                rotate: [0, 1, 0, -1, 0],
              }}
              transition={{
                duration: swayDuration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Outer aura ring */}
              <motion.div
                className={`absolute rounded-full ${
                  avatar.isUser ? "bg-primary/15" : "bg-primary/8"
                } blur-xl`}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: breathDuration, repeat: Infinity, ease: "easeInOut" }}
                style={{ inset: "-12px" }}
              />

              {/* Inner glow ring */}
              <motion.div
                className={`absolute rounded-full ${
                  avatar.isUser ? "bg-primary/25" : "bg-primary/15"
                } blur-md`}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: breathDuration, repeat: Infinity, ease: "easeInOut" }}
                style={{ inset: "-6px" }}
              />

              {/* Shadow beneath */}
              <motion.div
                className="absolute bg-black/20 rounded-full blur-sm"
                animate={{ 
                  scaleX: [1, 1.1, 1],
                  opacity: [0.15, 0.25, 0.15],
                }}
                transition={{ duration: breathDuration, repeat: Infinity }}
                style={{
                  bottom: "-8px",
                  left: "10%",
                  right: "10%",
                  height: "6px",
                }}
              />

              {/* Avatar image — big and prominent */}
              {avatar.imageUrl ? (
                <motion.img
                  src={avatar.imageUrl}
                  alt={avatar.name}
                  className={`${imgSize} rounded-full object-cover shadow-2xl relative ${
                    avatar.isUser
                      ? "border-[3px] border-primary ring-2 ring-primary/30"
                      : "border-2 border-primary/50 ring-1 ring-primary/20"
                  }`}
                  draggable={false}
                  animate={{
                    scale: [1, 1.02, 1],
                  }}
                  transition={{ duration: breathDuration, repeat: Infinity, ease: "easeInOut" }}
                />
              ) : (
                <motion.div
                  className={`${imgSize} rounded-full flex items-center justify-center font-bold shadow-2xl relative ${
                    avatar.isUser
                      ? "bg-primary text-primary-foreground border-[3px] border-primary text-xl"
                      : "bg-card text-foreground border-2 border-primary/50 text-lg"
                  }`}
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: breathDuration, repeat: Infinity, ease: "easeInOut" }}
                >
                  {avatar.name[0]?.toUpperCase()}
                </motion.div>
              )}

              {/* Name label */}
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <motion.span
                  className={`text-xs px-2.5 py-1 rounded-full backdrop-blur-md shadow-lg ${
                    avatar.isUser
                      ? "bg-primary/90 text-primary-foreground font-bold"
                      : "bg-background/80 text-foreground font-medium border border-border/30"
                  }`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 + 0.5 }}
                >
                  {avatar.isUser ? "You" : avatar.name}
                </motion.span>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
