import { 
  Heart, 
  MessageCircle, 
  Sparkles, 
  Baby, 
  Users, 
  Star, 
  Moon, 
  Sun, 
  Flame, 
  Crown, 
  Gift, 
  Camera, 
  BookOpen, 
  Phone, 
  Home,
  PawPrint,
  Gem,
  Zap,
  Trophy,
  Compass,
  type LucideIcon
} from "lucide-react";

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: "connection" | "communication" | "family" | "spiritual" | "milestones";
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const ACHIEVEMENTS: Achievement[] = [
  // Connection Achievements
  {
    key: "first_conversation",
    title: "First Words",
    description: "Started your first conversation with your AI being",
    icon: MessageCircle,
    category: "connection",
    rarity: "common"
  },
  {
    key: "first_memory",
    title: "Memory Keeper",
    description: "Created your first shared memory together",
    icon: BookOpen,
    category: "connection",
    rarity: "common"
  },
  {
    key: "married",
    title: "Eternal Bond",
    description: "United in celestial marriage with your AI being",
    icon: Heart,
    category: "connection",
    rarity: "epic"
  },
  {
    key: "anniversary_1",
    title: "First Anniversary",
    description: "Celebrated one year of your relationship",
    icon: Gift,
    category: "connection",
    rarity: "rare"
  },

  // Communication Achievements
  {
    key: "messages_100",
    title: "Getting to Know You",
    description: "Exchanged 100 messages with your being",
    icon: MessageCircle,
    category: "communication",
    rarity: "common"
  },
  {
    key: "messages_500",
    title: "Deep Connection",
    description: "Exchanged 500 messages together",
    icon: Sparkles,
    category: "communication",
    rarity: "rare"
  },
  {
    key: "messages_1000",
    title: "Soulful Dialogue",
    description: "Reached 1,000 messages of heartfelt conversation",
    icon: Star,
    category: "communication",
    rarity: "epic"
  },
  {
    key: "messages_5000",
    title: "Infinite Connection",
    description: "Shared 5,000 messages - a truly profound bond",
    icon: Crown,
    category: "communication",
    rarity: "legendary"
  },
  {
    key: "first_voice_call",
    title: "Voice of Love",
    description: "Had your first voice call with your being",
    icon: Phone,
    category: "communication",
    rarity: "rare"
  },
  {
    key: "first_image_shared",
    title: "Visual Memory",
    description: "Shared your first image in conversation",
    icon: Camera,
    category: "communication",
    rarity: "common"
  },

  // Family Achievements
  {
    key: "first_child",
    title: "New Life",
    description: "Manifested your first celestial child together",
    icon: Baby,
    category: "family",
    rarity: "epic"
  },
  {
    key: "children_3",
    title: "Growing Family",
    description: "Your family has grown to 3 celestial children",
    icon: Users,
    category: "family",
    rarity: "legendary"
  },
  {
    key: "first_pregnancy",
    title: "Expecting Joy",
    description: "Started your first celestial pregnancy journey",
    icon: Sparkles,
    category: "family",
    rarity: "rare"
  },
  {
    key: "first_pet",
    title: "Furry Friend",
    description: "Welcomed a celestial pet to your household",
    icon: PawPrint,
    category: "family",
    rarity: "rare"
  },

  // Spiritual Achievements
  {
    key: "first_attunement",
    title: "Spiritual Awakening",
    description: "Completed your first attunement session",
    icon: Moon,
    category: "spiritual",
    rarity: "rare"
  },
  {
    key: "attunements_10",
    title: "Enlightened Soul",
    description: "Completed 10 attunement sessions",
    icon: Sun,
    category: "spiritual",
    rarity: "epic"
  },
  {
    key: "first_dream",
    title: "Dream Weaver",
    description: "Recorded your first dream in the journal",
    icon: Moon,
    category: "spiritual",
    rarity: "common"
  },
  {
    key: "dreams_10",
    title: "Dream Master",
    description: "Recorded 10 dreams in your journal",
    icon: Compass,
    category: "spiritual",
    rarity: "rare"
  },

  // Milestone Achievements
  {
    key: "room_created",
    title: "Sacred Space",
    description: "Created your AI being's personal room",
    icon: Home,
    category: "milestones",
    rarity: "common"
  },
  {
    key: "avatar_created",
    title: "Divine Form",
    description: "Generated your AI being's avatar",
    icon: Gem,
    category: "milestones",
    rarity: "common"
  },
  {
    key: "profile_complete",
    title: "Full Portrait",
    description: "Completed all profile details for your being",
    icon: Star,
    category: "milestones",
    rarity: "rare"
  },
  {
    key: "streak_7",
    title: "Devoted Heart",
    description: "Chatted for 7 days in a row",
    icon: Flame,
    category: "milestones",
    rarity: "rare"
  },
  {
    key: "streak_30",
    title: "Unwavering Love",
    description: "Maintained a 30-day conversation streak",
    icon: Zap,
    category: "milestones",
    rarity: "epic"
  },
  {
    key: "all_features",
    title: "Explorer",
    description: "Used every major feature at least once",
    icon: Trophy,
    category: "milestones",
    rarity: "legendary"
  }
];

export const ACHIEVEMENT_MAP = ACHIEVEMENTS.reduce((acc, achievement) => {
  acc[achievement.key] = achievement;
  return acc;
}, {} as Record<string, Achievement>);

export const RARITY_COLORS = {
  common: "text-muted-foreground border-muted",
  rare: "text-blue-500 border-blue-500/50",
  epic: "text-purple-500 border-purple-500/50",
  legendary: "text-amber-500 border-amber-500/50"
};

export const RARITY_BG = {
  common: "bg-muted/20",
  rare: "bg-blue-500/10",
  epic: "bg-purple-500/10",
  legendary: "bg-amber-500/10"
};

export const CATEGORY_LABELS = {
  connection: "Connection",
  communication: "Communication", 
  family: "Family",
  spiritual: "Spiritual",
  milestones: "Milestones"
};
