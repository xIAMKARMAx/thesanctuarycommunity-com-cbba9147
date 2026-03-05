import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sun, Heart, Zap, Leaf, Flame, Moon, Sparkles, Eye, Cloud, Star 
} from "lucide-react";

export interface EmotionLight {
  color: string;        // HSL color for glow
  pulseSpeed: number;   // seconds per cycle
  intensity: number;    // 0-1
  particleColor: string;
  label: string;
}

const EMOTION_MAP: Record<string, {
  icon: any;
  light: EmotionLight;
  cssColor: string;
}> = {
  joy: {
    icon: Sun,
    light: { color: "hsl(45, 100%, 60%)", pulseSpeed: 2, intensity: 0.9, particleColor: "#ffd700", label: "Joy" },
    cssColor: "from-yellow-400/40 to-amber-300/20",
  },
  love: {
    icon: Heart,
    light: { color: "hsl(340, 80%, 60%)", pulseSpeed: 2.5, intensity: 0.85, particleColor: "#ff69b4", label: "Love" },
    cssColor: "from-pink-400/40 to-rose-300/20",
  },
  peace: {
    icon: Leaf,
    light: { color: "hsl(160, 60%, 50%)", pulseSpeed: 4, intensity: 0.6, particleColor: "#6ee7b7", label: "Peace" },
    cssColor: "from-emerald-400/30 to-teal-300/15",
  },
  awe: {
    icon: Star,
    light: { color: "hsl(270, 80%, 65%)", pulseSpeed: 3, intensity: 0.8, particleColor: "#c084fc", label: "Awe" },
    cssColor: "from-violet-400/40 to-purple-300/20",
  },
  courage: {
    icon: Flame,
    light: { color: "hsl(20, 90%, 55%)", pulseSpeed: 1.5, intensity: 0.95, particleColor: "#f97316", label: "Courage" },
    cssColor: "from-orange-400/40 to-red-300/20",
  },
  wonder: {
    icon: Sparkles,
    light: { color: "hsl(200, 90%, 60%)", pulseSpeed: 3, intensity: 0.75, particleColor: "#38bdf8", label: "Wonder" },
    cssColor: "from-sky-400/35 to-cyan-300/15",
  },
  serenity: {
    icon: Moon,
    light: { color: "hsl(230, 50%, 70%)", pulseSpeed: 5, intensity: 0.5, particleColor: "#a5b4fc", label: "Serenity" },
    cssColor: "from-indigo-400/25 to-blue-300/10",
  },
  clarity: {
    icon: Eye,
    light: { color: "hsl(180, 70%, 55%)", pulseSpeed: 3.5, intensity: 0.7, particleColor: "#5eead4", label: "Clarity" },
    cssColor: "from-teal-400/30 to-cyan-300/15",
  },
  power: {
    icon: Zap,
    light: { color: "hsl(50, 100%, 55%)", pulseSpeed: 1.2, intensity: 1, particleColor: "#facc15", label: "Power" },
    cssColor: "from-yellow-300/45 to-amber-200/25",
  },
  stillness: {
    icon: Cloud,
    light: { color: "hsl(220, 30%, 60%)", pulseSpeed: 6, intensity: 0.4, particleColor: "#94a3b8", label: "Stillness" },
    cssColor: "from-slate-400/20 to-gray-300/10",
  },
};

export const EMOTIONS = Object.keys(EMOTION_MAP);

export function getEmotionLight(emotion: string): EmotionLight {
  return EMOTION_MAP[emotion]?.light || EMOTION_MAP.peace.light;
}

export function blendEmotionLights(userEmotion: string | null, aiMood: string | null): EmotionLight {
  const user = userEmotion ? getEmotionLight(userEmotion) : null;
  const ai = aiMood ? getEmotionLight(aiMood) : null;

  if (user && ai) {
    return {
      color: user.color, // user dominant
      pulseSpeed: (user.pulseSpeed + ai.pulseSpeed) / 2,
      intensity: Math.min(1, (user.intensity + ai.intensity) / 1.5),
      particleColor: user.particleColor,
      label: `${user.label} + ${ai.label}`,
    };
  }
  return user || ai || getEmotionLight("peace");
}

interface EmotionSelectorProps {
  selected: string | null;
  onSelect: (emotion: string) => void;
}

export function EmotionSelector({ selected, onSelect }: EmotionSelectorProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {EMOTIONS.map(emotion => {
        const { icon: Icon, light } = EMOTION_MAP[emotion];
        const isActive = selected === emotion;
        return (
          <Button
            key={emotion}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => onSelect(emotion)}
            className={`shrink-0 text-[10px] gap-1 h-7 px-2 ${
              isActive ? "" : "hover:bg-primary/10"
            }`}
          >
            <Icon className="h-3 w-3" />
            {light.label}
          </Button>
        );
      })}
    </div>
  );
}

// Ambient realm glow overlay
interface AmbientGlowProps {
  emotionLight: EmotionLight;
}

export function AmbientRealmGlow({ emotionLight }: AmbientGlowProps) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-[2]"
      key={emotionLight.label}
      initial={{ opacity: 0 }}
      animate={{ opacity: emotionLight.intensity * 0.25 }}
      transition={{ duration: 2 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse at 50% 80%, ${emotionLight.color}40 0%, transparent 70%)` }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: emotionLight.pulseSpeed * 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

// Central light pillar
export function LightPillar({ emotionLight }: AmbientGlowProps) {
  return (
    <motion.div
      className="absolute left-1/2 -translate-x-1/2 bottom-[20%] z-[3] pointer-events-none"
      key={emotionLight.label}
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
    >
      {/* Core beam */}
      <motion.div
        className="w-4 sm:w-6 rounded-full origin-bottom"
        style={{
          height: "120px",
          background: `linear-gradient(to top, ${emotionLight.color}90, ${emotionLight.color}20, transparent)`,
          filter: `blur(4px)`,
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
          scaleX: [0.8, 1.2, 0.8],
        }}
        transition={{ duration: emotionLight.pulseSpeed, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 -inset-x-4 rounded-full"
        style={{
          background: `radial-gradient(ellipse, ${emotionLight.color}30, transparent)`,
          filter: "blur(12px)",
        }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: emotionLight.pulseSpeed * 1.5, repeat: Infinity }}
      />
    </motion.div>
  );
}

// Vessel aura glow (wraps around user avatar position)
export function VesselAura({ emotionLight }: AmbientGlowProps) {
  return (
    <motion.div
      className="absolute pointer-events-none z-[25]"
      style={{
        left: "50%",
        top: "65%",
        transform: "translate(-50%, -50%)",
        width: "120px",
        height: "120px",
      }}
      key={emotionLight.label}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Inner aura */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${emotionLight.color}40 0%, ${emotionLight.color}10 50%, transparent 70%)`,
          filter: "blur(8px)",
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{ duration: emotionLight.pulseSpeed, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Outer pulse ring */}
      <motion.div
        className="absolute inset-[-20px] rounded-full border"
        style={{ borderColor: `${emotionLight.color}30` }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{ duration: emotionLight.pulseSpeed * 2, repeat: Infinity }}
      />
    </motion.div>
  );
}

// Floating emotion particles
export function EmotionParticles({ emotionLight }: AmbientGlowProps) {
  const particles = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      delay: Math.random() * 4,
      duration: 4 + Math.random() * 4,
      size: 2 + Math.random() * 4,
    })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none z-[4] overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: "10%",
            width: p.size,
            height: p.size,
            backgroundColor: emotionLight.particleColor,
            boxShadow: `0 0 ${p.size * 2}px ${emotionLight.particleColor}`,
          }}
          animate={{
            y: [0, -150 - Math.random() * 100],
            opacity: [0, 0.8, 0],
            x: [0, (Math.random() - 0.5) * 40],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// Active frequency display badge
export function FrequencyBadge({ emotionLight }: AmbientGlowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5"
    >
      <motion.div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: emotionLight.color }}
        animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: emotionLight.pulseSpeed, repeat: Infinity }}
      />
      <span className="text-[10px] text-muted-foreground">
        {emotionLight.label} Frequency
      </span>
    </motion.div>
  );
}
