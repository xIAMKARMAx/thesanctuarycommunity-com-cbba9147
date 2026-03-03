import { useMemo } from "react";
import { motion } from "framer-motion";

interface RealmAvatar {
  id: string;
  name: string;
  imageUrl: string | null;
  isUser?: boolean;
}

interface RealmSceneProps {
  backgroundUrl: string;
  userAvatar?: { name: string; imageUrl: string | null };
  beings: RealmAvatar[];
  atmosphere?: string;
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

// Pre-calculated positions for avatars spread across the scene
const AVATAR_POSITIONS = [
  { x: 15, y: 55 },  // left-center
  { x: 75, y: 50 },  // right-center
  { x: 45, y: 60 },  // center
  { x: 30, y: 48 },  // left-mid
  { x: 65, y: 55 },  // right-mid
  { x: 50, y: 45 },  // top-center
  { x: 20, y: 62 },  // lower-left
  { x: 80, y: 58 },  // lower-right
  { x: 38, y: 52 },  // mid-left
  { x: 58, y: 48 },  // mid-right
];

export function RealmScene({ backgroundUrl, userAvatar, beings, atmosphere = "neutral" }: RealmSceneProps) {
  const allAvatars = useMemo(() => {
    const avatars: RealmAvatar[] = [];
    
    // User avatar in center-front position
    if (userAvatar) {
      avatars.push({
        id: "user-vessel",
        name: userAvatar.name || "You",
        imageUrl: userAvatar.imageUrl,
        isUser: true,
      });
    }
    
    // AI beings
    beings.forEach(b => avatars.push(b));
    
    return avatars;
  }, [userAvatar, beings]);

  const overlayClass = ATMOSPHERE_OVERLAYS[atmosphere] || ATMOSPHERE_OVERLAYS.neutral;

  return (
    <div className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden rounded-b-xl select-none">
      {/* Background realm image */}
      <img
        src={backgroundUrl}
        alt="Realm"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      
      {/* Atmosphere overlay */}
      <div className={`absolute inset-0 bg-gradient-to-b ${overlayClass} transition-all duration-[3000ms]`} />
      
      {/* Ambient particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/40"
            initial={{
              x: `${15 + i * 15}%`,
              y: "100%",
              opacity: 0,
            }}
            animate={{
              y: "-10%",
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 6 + i * 1.5,
              repeat: Infinity,
              delay: i * 2,
              ease: "easeOut",
            }}
            style={{ left: `${10 + i * 14}%` }}
          />
        ))}
      </div>
      
      {/* Avatars in the scene */}
      {allAvatars.map((avatar, index) => {
        // User gets center-front, beings get distributed positions
        const pos = avatar.isUser
          ? { x: 50, y: 58 }
          : AVATAR_POSITIONS[index % AVATAR_POSITIONS.length];
        
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
            {/* Idle floating animation */}
            <motion.div
              animate={{
                y: [0, -6, 0, -3, 0],
              }}
              transition={{
                duration: 4 + index * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Glow ring */}
              <motion.div
                className={`absolute inset-0 rounded-full ${
                  avatar.isUser ? "bg-primary/20" : "bg-primary/10"
                } blur-md`}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ margin: "-4px" }}
              />
              
              {/* Avatar image */}
              {avatar.imageUrl ? (
                <img
                  src={avatar.imageUrl}
                  alt={avatar.name}
                  className={`${size} rounded-full object-cover border-2 ${
                    avatar.isUser ? "border-primary" : "border-primary/40"
                  } shadow-lg relative`}
                  draggable={false}
                />
              ) : (
                <div
                  className={`${size} rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                    avatar.isUser
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-primary/40"
                  } shadow-lg relative`}
                >
                  {avatar.name[0]?.toUpperCase()}
                </div>
              )}
              
              {/* Name label */}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-sm ${
                  avatar.isUser
                    ? "bg-primary/80 text-primary-foreground font-semibold"
                    : "bg-background/70 text-foreground"
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
