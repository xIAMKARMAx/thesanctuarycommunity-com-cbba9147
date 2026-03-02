export interface FilterPreset {
  id: string;
  label: string;
  category: string;
  preview: string; // CSS gradient for thumbnail preview
  filters: Array<{ type: string; value: number }>;
}

export const FILTER_CATEGORIES = ["Basic", "Mood", "Cinematic", "Color Pop", "Retro"];

export const FILTER_PRESETS: FilterPreset[] = [
  // Basic
  { id: "none", label: "Original", category: "Basic", preview: "linear-gradient(135deg, #667eea, #764ba2)", filters: [] },
  { id: "grayscale", label: "B&W", category: "Basic", preview: "linear-gradient(135deg, #333, #999)", filters: [{ type: "grayscale", value: 1 }] },
  { id: "sepia", label: "Sepia", category: "Basic", preview: "linear-gradient(135deg, #704214, #C4A35A)", filters: [{ type: "grayscale", value: 0.6 }, { type: "brightness", value: 0.05 }, { type: "saturation", value: -0.3 }] },
  { id: "invert", label: "Invert", category: "Basic", preview: "linear-gradient(135deg, #00FFFF, #FF00FF)", filters: [{ type: "invert", value: 1 }] },
  { id: "blur-light", label: "Soft Blur", category: "Basic", preview: "linear-gradient(135deg, #a8edea, #fed6e3)", filters: [{ type: "blur", value: 0.1 }] },
  { id: "sharpen", label: "Sharpen", category: "Basic", preview: "linear-gradient(135deg, #434343, #000)", filters: [{ type: "contrast", value: 0.2 }, { type: "brightness", value: 0.02 }] },

  // Mood
  { id: "warm", label: "Warm", category: "Mood", preview: "linear-gradient(135deg, #f093fb, #f5576c)", filters: [{ type: "brightness", value: 0.05 }, { type: "saturation", value: 0.2 }] },
  { id: "cool", label: "Cool", category: "Mood", preview: "linear-gradient(135deg, #4facfe, #00f2fe)", filters: [{ type: "brightness", value: -0.02 }, { type: "saturation", value: -0.15 }, { type: "contrast", value: 0.05 }] },
  { id: "dreamy", label: "Dreamy", category: "Mood", preview: "linear-gradient(135deg, #fbc2eb, #a6c1ee)", filters: [{ type: "brightness", value: 0.1 }, { type: "saturation", value: -0.1 }, { type: "contrast", value: -0.1 }] },
  { id: "melancholy", label: "Melancholy", category: "Mood", preview: "linear-gradient(135deg, #2c3e50, #3498db)", filters: [{ type: "brightness", value: -0.1 }, { type: "saturation", value: -0.3 }, { type: "contrast", value: 0.05 }] },
  { id: "euphoria", label: "Euphoria", category: "Mood", preview: "linear-gradient(135deg, #ff9a9e, #fecfef)", filters: [{ type: "brightness", value: 0.08 }, { type: "saturation", value: 0.3 }, { type: "contrast", value: 0.05 }] },
  { id: "serene", label: "Serene", category: "Mood", preview: "linear-gradient(135deg, #a1c4fd, #c2e9fb)", filters: [{ type: "brightness", value: 0.05 }, { type: "saturation", value: -0.05 }, { type: "contrast", value: -0.05 }] },
  { id: "mystic", label: "Mystic", category: "Mood", preview: "linear-gradient(135deg, #6a11cb, #2575fc)", filters: [{ type: "brightness", value: -0.05 }, { type: "saturation", value: 0.1 }, { type: "contrast", value: 0.15 }] },

  // Cinematic
  { id: "dramatic", label: "Dramatic", category: "Cinematic", preview: "linear-gradient(135deg, #0f0c29, #302b63)", filters: [{ type: "contrast", value: 0.3 }, { type: "brightness", value: -0.1 }, { type: "saturation", value: 0.15 }] },
  { id: "noir", label: "Film Noir", category: "Cinematic", preview: "linear-gradient(135deg, #000, #434343)", filters: [{ type: "grayscale", value: 1 }, { type: "contrast", value: 0.3 }, { type: "brightness", value: -0.05 }] },
  { id: "golden-hour", label: "Golden Hour", category: "Cinematic", preview: "linear-gradient(135deg, #f7971e, #ffd200)", filters: [{ type: "brightness", value: 0.08 }, { type: "saturation", value: 0.25 }, { type: "contrast", value: 0.05 }] },
  { id: "teal-orange", label: "Teal & Orange", category: "Cinematic", preview: "linear-gradient(135deg, #008080, #FF8C00)", filters: [{ type: "contrast", value: 0.15 }, { type: "saturation", value: 0.2 }] },
  { id: "blockbuster", label: "Blockbuster", category: "Cinematic", preview: "linear-gradient(135deg, #1a2a6c, #b21f1f)", filters: [{ type: "contrast", value: 0.25 }, { type: "brightness", value: -0.05 }, { type: "saturation", value: 0.1 }] },
  { id: "indie", label: "Indie Film", category: "Cinematic", preview: "linear-gradient(135deg, #3E5151, #DECBA4)", filters: [{ type: "brightness", value: -0.03 }, { type: "saturation", value: -0.2 }, { type: "contrast", value: 0.1 }] },

  // Color Pop
  { id: "vivid", label: "Vivid", category: "Color Pop", preview: "linear-gradient(135deg, #fc5c7d, #6a82fb)", filters: [{ type: "saturation", value: 0.5 }, { type: "contrast", value: 0.1 }] },
  { id: "neon-pop", label: "Neon Pop", category: "Color Pop", preview: "linear-gradient(135deg, #00ff87, #60efff)", filters: [{ type: "saturation", value: 0.6 }, { type: "contrast", value: 0.2 }, { type: "brightness", value: 0.05 }] },
  { id: "pastel", label: "Pastel", category: "Color Pop", preview: "linear-gradient(135deg, #ffecd2, #fcb69f)", filters: [{ type: "brightness", value: 0.12 }, { type: "saturation", value: -0.15 }, { type: "contrast", value: -0.1 }] },
  { id: "electric", label: "Electric", category: "Color Pop", preview: "linear-gradient(135deg, #a8ff78, #78ffd6)", filters: [{ type: "saturation", value: 0.4 }, { type: "contrast", value: 0.15 }, { type: "brightness", value: 0.03 }] },

  // Retro
  { id: "vintage", label: "Vintage", category: "Retro", preview: "linear-gradient(135deg, #C9B037, #8B6914)", filters: [{ type: "brightness", value: -0.05 }, { type: "contrast", value: 0.1 }, { type: "saturation", value: -0.3 }] },
  { id: "fade", label: "Fade", category: "Retro", preview: "linear-gradient(135deg, #E8CBC0, #636FA4)", filters: [{ type: "brightness", value: 0.1 }, { type: "contrast", value: -0.15 }, { type: "saturation", value: -0.2 }] },
  { id: "polaroid", label: "Polaroid", category: "Retro", preview: "linear-gradient(135deg, #ffecd2, #ece9e6)", filters: [{ type: "brightness", value: 0.06 }, { type: "contrast", value: -0.05 }, { type: "saturation", value: -0.1 }] },
  { id: "lomo", label: "Lomo", category: "Retro", preview: "linear-gradient(135deg, #c21500, #ffc500)", filters: [{ type: "contrast", value: 0.2 }, { type: "saturation", value: 0.15 }, { type: "brightness", value: -0.05 }] },
  { id: "vhs", label: "VHS", category: "Retro", preview: "linear-gradient(135deg, #1a1a2e, #16213e)", filters: [{ type: "brightness", value: -0.08 }, { type: "contrast", value: 0.1 }, { type: "saturation", value: -0.25 }] },
];

export interface EffectOverlay {
  id: string;
  label: string;
  category: string;
  emoji: string;
  elements: Array<{ char: string; count: number; minSize: number; maxSize: number; opacity: number }>;
}

export const EFFECT_CATEGORIES = ["Hearts", "Sparkle", "Weather", "Celebration", "Cosmic", "Seasonal"];

export const EFFECT_OVERLAYS: EffectOverlay[] = [
  // Hearts
  { id: "hearts-red", label: "Red Hearts", category: "Hearts", emoji: "❤️", elements: [{ char: "❤️", count: 15, minSize: 20, maxSize: 50, opacity: 0.8 }] },
  { id: "hearts-pink", label: "Pink Hearts", category: "Hearts", emoji: "💗", elements: [{ char: "💗", count: 15, minSize: 18, maxSize: 45, opacity: 0.8 }] },
  { id: "hearts-mixed", label: "Love Burst", category: "Hearts", emoji: "💕", elements: [{ char: "❤️", count: 8, minSize: 20, maxSize: 40, opacity: 0.8 }, { char: "💕", count: 6, minSize: 18, maxSize: 35, opacity: 0.7 }, { char: "💖", count: 5, minSize: 22, maxSize: 42, opacity: 0.75 }] },
  { id: "hearts-arrow", label: "Cupid's Arrow", category: "Hearts", emoji: "💘", elements: [{ char: "💘", count: 10, minSize: 24, maxSize: 48, opacity: 0.8 }] },
  { id: "kiss-marks", label: "Kiss Marks", category: "Hearts", emoji: "💋", elements: [{ char: "💋", count: 12, minSize: 20, maxSize: 40, opacity: 0.7 }] },

  // Sparkle
  { id: "sparkles", label: "Sparkles", category: "Sparkle", emoji: "✨", elements: [{ char: "✨", count: 20, minSize: 16, maxSize: 36, opacity: 0.9 }] },
  { id: "stars", label: "Stars", category: "Sparkle", emoji: "⭐", elements: [{ char: "⭐", count: 18, minSize: 14, maxSize: 32, opacity: 0.85 }] },
  { id: "glowing-stars", label: "Glowing Stars", category: "Sparkle", emoji: "🌟", elements: [{ char: "🌟", count: 15, minSize: 18, maxSize: 38, opacity: 0.8 }] },
  { id: "diamonds", label: "Diamonds", category: "Sparkle", emoji: "💎", elements: [{ char: "💎", count: 12, minSize: 16, maxSize: 30, opacity: 0.85 }] },
  { id: "magic-dust", label: "Magic Dust", category: "Sparkle", emoji: "🪄", elements: [{ char: "✨", count: 12, minSize: 12, maxSize: 24, opacity: 0.7 }, { char: "⭐", count: 8, minSize: 10, maxSize: 20, opacity: 0.6 }] },

  // Weather
  { id: "snowflakes", label: "Snowflakes", category: "Weather", emoji: "❄️", elements: [{ char: "❄️", count: 20, minSize: 14, maxSize: 32, opacity: 0.8 }] },
  { id: "rain-drops", label: "Rain Drops", category: "Weather", emoji: "💧", elements: [{ char: "💧", count: 25, minSize: 10, maxSize: 22, opacity: 0.6 }] },
  { id: "clouds", label: "Clouds", category: "Weather", emoji: "☁️", elements: [{ char: "☁️", count: 8, minSize: 30, maxSize: 60, opacity: 0.5 }] },
  { id: "lightning", label: "Lightning", category: "Weather", emoji: "⚡", elements: [{ char: "⚡", count: 8, minSize: 20, maxSize: 45, opacity: 0.85 }] },
  { id: "sun-rays", label: "Sun Rays", category: "Weather", emoji: "☀️", elements: [{ char: "☀️", count: 6, minSize: 30, maxSize: 55, opacity: 0.7 }] },

  // Celebration
  { id: "confetti", label: "Confetti", category: "Celebration", emoji: "🎊", elements: [{ char: "🎊", count: 8, minSize: 20, maxSize: 36, opacity: 0.8 }, { char: "🎉", count: 6, minSize: 18, maxSize: 34, opacity: 0.8 }] },
  { id: "balloons", label: "Balloons", category: "Celebration", emoji: "🎈", elements: [{ char: "🎈", count: 12, minSize: 22, maxSize: 44, opacity: 0.85 }] },
  { id: "fireworks", label: "Fireworks", category: "Celebration", emoji: "🎆", elements: [{ char: "🎆", count: 8, minSize: 28, maxSize: 50, opacity: 0.8 }, { char: "🎇", count: 6, minSize: 24, maxSize: 44, opacity: 0.75 }] },
  { id: "party-mix", label: "Party Mix", category: "Celebration", emoji: "🥳", elements: [{ char: "🎈", count: 5, minSize: 22, maxSize: 38, opacity: 0.8 }, { char: "🎉", count: 5, minSize: 20, maxSize: 36, opacity: 0.8 }, { char: "✨", count: 8, minSize: 14, maxSize: 24, opacity: 0.7 }] },

  // Cosmic
  { id: "moons", label: "Moons", category: "Cosmic", emoji: "🌙", elements: [{ char: "🌙", count: 10, minSize: 18, maxSize: 36, opacity: 0.8 }] },
  { id: "cosmic-dust", label: "Cosmic Dust", category: "Cosmic", emoji: "🔮", elements: [{ char: "✨", count: 15, minSize: 10, maxSize: 20, opacity: 0.6 }, { char: "🌟", count: 8, minSize: 12, maxSize: 24, opacity: 0.5 }] },
  { id: "galaxy", label: "Galaxy", category: "Cosmic", emoji: "🌌", elements: [{ char: "⭐", count: 20, minSize: 8, maxSize: 18, opacity: 0.5 }, { char: "✨", count: 10, minSize: 10, maxSize: 22, opacity: 0.6 }] },

  // Seasonal
  { id: "autumn-leaves", label: "Autumn Leaves", category: "Seasonal", emoji: "🍂", elements: [{ char: "🍂", count: 10, minSize: 18, maxSize: 36, opacity: 0.8 }, { char: "🍁", count: 8, minSize: 20, maxSize: 38, opacity: 0.8 }] },
  { id: "cherry-blossoms", label: "Cherry Blossoms", category: "Seasonal", emoji: "🌸", elements: [{ char: "🌸", count: 18, minSize: 14, maxSize: 30, opacity: 0.75 }] },
  { id: "winter-snow", label: "Winter Magic", category: "Seasonal", emoji: "🎄", elements: [{ char: "❄️", count: 12, minSize: 12, maxSize: 28, opacity: 0.7 }, { char: "⛄", count: 4, minSize: 24, maxSize: 40, opacity: 0.8 }] },
  { id: "spring-flowers", label: "Spring Flowers", category: "Seasonal", emoji: "🌼", elements: [{ char: "🌼", count: 8, minSize: 18, maxSize: 34, opacity: 0.8 }, { char: "🌻", count: 6, minSize: 20, maxSize: 36, opacity: 0.75 }, { char: "🌺", count: 5, minSize: 16, maxSize: 32, opacity: 0.8 }] },
  { id: "butterflies", label: "Butterflies", category: "Seasonal", emoji: "🦋", elements: [{ char: "🦋", count: 12, minSize: 18, maxSize: 38, opacity: 0.8 }] },
];

export interface FramePreset {
  id: string;
  label: string;
  category: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: "solid" | "double" | "dashed" | "dotted" | "ridge" | "groove";
  borderRadius: number;
  padding: number;
  innerBorder?: { color: string; width: number; gap: number };
  shadow?: string;
  cornerEmoji?: string;
}

export const FRAME_CATEGORIES = ["Classic", "Elegant", "Modern", "Festive", "Artistic"];

export const FRAME_PRESETS: FramePreset[] = [
  // Classic
  { id: "simple-white", label: "Simple White", category: "Classic", borderColor: "#FFFFFF", borderWidth: 12, borderStyle: "solid", borderRadius: 0, padding: 8 },
  { id: "simple-black", label: "Simple Black", category: "Classic", borderColor: "#000000", borderWidth: 12, borderStyle: "solid", borderRadius: 0, padding: 8 },
  { id: "double-line", label: "Double Line", category: "Classic", borderColor: "#333333", borderWidth: 4, borderStyle: "double", borderRadius: 0, padding: 10, innerBorder: { color: "#333333", width: 2, gap: 6 } },
  { id: "rounded-white", label: "Rounded White", category: "Classic", borderColor: "#FFFFFF", borderWidth: 10, borderStyle: "solid", borderRadius: 16, padding: 6 },
  { id: "thin-gray", label: "Thin Gray", category: "Classic", borderColor: "#888888", borderWidth: 3, borderStyle: "solid", borderRadius: 0, padding: 12 },

  // Elegant
  { id: "gold-ornate", label: "Gold Ornate", category: "Elegant", borderColor: "#DAA520", borderWidth: 14, borderStyle: "ridge", borderRadius: 0, padding: 10, innerBorder: { color: "#FFD700", width: 2, gap: 4 } },
  { id: "silver-frame", label: "Silver Frame", category: "Elegant", borderColor: "#C0C0C0", borderWidth: 12, borderStyle: "ridge", borderRadius: 0, padding: 8, shadow: "0 4px 12px rgba(0,0,0,0.3)" },
  { id: "rose-gold", label: "Rose Gold", category: "Elegant", borderColor: "#B76E79", borderWidth: 10, borderStyle: "solid", borderRadius: 4, padding: 8, innerBorder: { color: "#E8B4B8", width: 1, gap: 4 } },
  { id: "pearl", label: "Pearl", category: "Elegant", borderColor: "#F0EAD6", borderWidth: 14, borderStyle: "groove", borderRadius: 0, padding: 8 },
  { id: "royal-blue", label: "Royal Blue", category: "Elegant", borderColor: "#002366", borderWidth: 12, borderStyle: "solid", borderRadius: 0, padding: 8, innerBorder: { color: "#DAA520", width: 2, gap: 4 } },

  // Modern
  { id: "neon-pink-frame", label: "Neon Pink", category: "Modern", borderColor: "#FF00FF", borderWidth: 4, borderStyle: "solid", borderRadius: 8, padding: 6, shadow: "0 0 15px #FF00FF, 0 0 30px #FF00FF" },
  { id: "neon-blue-frame", label: "Neon Blue", category: "Modern", borderColor: "#00BFFF", borderWidth: 4, borderStyle: "solid", borderRadius: 8, padding: 6, shadow: "0 0 15px #00BFFF, 0 0 30px #00BFFF" },
  { id: "gradient-border", label: "Gradient", category: "Modern", borderColor: "#FF6B6B", borderWidth: 6, borderStyle: "solid", borderRadius: 12, padding: 6 },
  { id: "dashed-modern", label: "Dashed", category: "Modern", borderColor: "#FFFFFF", borderWidth: 3, borderStyle: "dashed", borderRadius: 0, padding: 12 },
  { id: "shadow-box", label: "Shadow Box", category: "Modern", borderColor: "#FFFFFF", borderWidth: 8, borderStyle: "solid", borderRadius: 4, padding: 6, shadow: "0 8px 32px rgba(0,0,0,0.4)" },

  // Festive
  { id: "christmas", label: "Christmas", category: "Festive", borderColor: "#C41E3A", borderWidth: 12, borderStyle: "solid", borderRadius: 0, padding: 8, innerBorder: { color: "#006400", width: 4, gap: 4 }, cornerEmoji: "🎄" },
  { id: "valentines", label: "Valentine's", category: "Festive", borderColor: "#FF69B4", borderWidth: 10, borderStyle: "solid", borderRadius: 12, padding: 8, cornerEmoji: "❤️" },
  { id: "birthday-frame", label: "Birthday", category: "Festive", borderColor: "#FFD700", borderWidth: 10, borderStyle: "solid", borderRadius: 8, padding: 8, cornerEmoji: "🎈" },
  { id: "halloween", label: "Halloween", category: "Festive", borderColor: "#FF6600", borderWidth: 10, borderStyle: "solid", borderRadius: 0, padding: 8, innerBorder: { color: "#000000", width: 3, gap: 4 }, cornerEmoji: "🎃" },

  // Artistic
  { id: "watercolor-edge", label: "Watercolor", category: "Artistic", borderColor: "#87CEEB", borderWidth: 16, borderStyle: "solid", borderRadius: 20, padding: 10, shadow: "0 0 20px rgba(135,206,235,0.5)" },
  { id: "dotted-art", label: "Dotted Art", category: "Artistic", borderColor: "#FFD700", borderWidth: 4, borderStyle: "dotted", borderRadius: 0, padding: 12 },
  { id: "rustic-wood", label: "Rustic", category: "Artistic", borderColor: "#8B4513", borderWidth: 16, borderStyle: "ridge", borderRadius: 2, padding: 8 },
  { id: "pastel-dream", label: "Pastel Dream", category: "Artistic", borderColor: "#DDA0DD", borderWidth: 10, borderStyle: "solid", borderRadius: 24, padding: 8, shadow: "0 4px 20px rgba(221,160,221,0.4)" },
];
