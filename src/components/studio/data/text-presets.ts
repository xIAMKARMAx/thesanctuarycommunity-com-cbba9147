export interface TextPreset {
  id: string;
  label: string;
  category: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: string;
  stroke?: string;
  strokeWidth?: number;
  shadow?: { color: string; blur: number; offsetX: number; offsetY: number };
  charSpacing?: number;
  lineHeight?: number;
}

export const TEXT_CATEGORIES = [
  "Popular", "Bold", "Elegant", "Fun", "Neon", "Vintage", "Minimal", "Artistic"
];

export const TEXT_PRESETS: TextPreset[] = [
  // Popular
  { id: "classic-white", label: "Classic White", category: "Popular", fontFamily: "Arial", fontSize: 42, fill: "#ffffff", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "rgba(0,0,0,0.6)", blur: 4, offsetX: 2, offsetY: 2 } },
  { id: "shadow-black", label: "Shadow Black", category: "Popular", fontFamily: "Georgia", fontSize: 40, fill: "#000000", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "rgba(0,0,0,0.3)", blur: 6, offsetX: 3, offsetY: 3 } },
  { id: "golden-glow", label: "Golden Glow", category: "Popular", fontFamily: "Georgia", fontSize: 44, fill: "#FFD700", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "rgba(255,165,0,0.6)", blur: 12, offsetX: 0, offsetY: 0 } },
  { id: "rose-script", label: "Rose Script", category: "Popular", fontFamily: "cursive", fontSize: 48, fill: "#FF69B4", fontWeight: "normal", fontStyle: "italic", textAlign: "center" },
  { id: "ocean-blue", label: "Ocean Blue", category: "Popular", fontFamily: "Verdana", fontSize: 38, fill: "#00CED1", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "rgba(0,0,0,0.4)", blur: 4, offsetX: 1, offsetY: 1 } },
  { id: "sunset-gradient", label: "Sunset Fire", category: "Popular", fontFamily: "Impact", fontSize: 46, fill: "#FF4500", fontWeight: "bold", fontStyle: "normal", textAlign: "center", stroke: "#FFD700", strokeWidth: 1 },
  
  // Bold
  { id: "impact-white", label: "Impact White", category: "Bold", fontFamily: "Impact", fontSize: 52, fill: "#ffffff", fontWeight: "bold", fontStyle: "normal", textAlign: "center", stroke: "#000000", strokeWidth: 2 },
  { id: "impact-red", label: "Impact Red", category: "Bold", fontFamily: "Impact", fontSize: 50, fill: "#FF0000", fontWeight: "bold", fontStyle: "normal", textAlign: "center", stroke: "#8B0000", strokeWidth: 1 },
  { id: "block-yellow", label: "Block Yellow", category: "Bold", fontFamily: "Arial Black, sans-serif", fontSize: 48, fill: "#FFD700", fontWeight: "bold", fontStyle: "normal", textAlign: "center", stroke: "#000000", strokeWidth: 2 },
  { id: "power-green", label: "Power Green", category: "Bold", fontFamily: "Impact", fontSize: 46, fill: "#00FF00", fontWeight: "bold", fontStyle: "normal", textAlign: "center", stroke: "#006400", strokeWidth: 2 },
  { id: "thunder-blue", label: "Thunder Blue", category: "Bold", fontFamily: "Arial Black, sans-serif", fontSize: 50, fill: "#1E90FF", fontWeight: "bold", fontStyle: "normal", textAlign: "center", stroke: "#00008B", strokeWidth: 2 },
  { id: "mega-orange", label: "Mega Orange", category: "Bold", fontFamily: "Impact", fontSize: 48, fill: "#FF8C00", fontWeight: "bold", fontStyle: "normal", textAlign: "center", stroke: "#8B4513", strokeWidth: 1 },
  { id: "titan-purple", label: "Titan Purple", category: "Bold", fontFamily: "Impact", fontSize: 50, fill: "#9400D3", fontWeight: "bold", fontStyle: "normal", textAlign: "center", stroke: "#4B0082", strokeWidth: 2 },

  // Elegant
  { id: "serif-gold", label: "Serif Gold", category: "Elegant", fontFamily: "Georgia", fontSize: 40, fill: "#DAA520", fontWeight: "normal", fontStyle: "normal", textAlign: "center", charSpacing: 200 },
  { id: "thin-white", label: "Thin Elegant", category: "Elegant", fontFamily: "Helvetica Neue, Helvetica, sans-serif", fontSize: 36, fill: "#ffffff", fontWeight: "100", fontStyle: "normal", textAlign: "center", charSpacing: 400 },
  { id: "script-blush", label: "Script Blush", category: "Elegant", fontFamily: "cursive", fontSize: 44, fill: "#F5C6CB", fontWeight: "normal", fontStyle: "italic", textAlign: "center" },
  { id: "classic-serif", label: "Classic Serif", category: "Elegant", fontFamily: "Times New Roman", fontSize: 38, fill: "#2C3E50", fontWeight: "normal", fontStyle: "normal", textAlign: "center", charSpacing: 150 },
  { id: "pearl-white", label: "Pearl White", category: "Elegant", fontFamily: "Georgia", fontSize: 42, fill: "#FAEBD7", fontWeight: "normal", fontStyle: "italic", textAlign: "center", shadow: { color: "rgba(0,0,0,0.2)", blur: 8, offsetX: 0, offsetY: 0 } },
  { id: "champagne", label: "Champagne", category: "Elegant", fontFamily: "cursive", fontSize: 40, fill: "#F7E7CE", fontWeight: "normal", fontStyle: "normal", textAlign: "center", charSpacing: 100 },
  { id: "silver-formal", label: "Silver Formal", category: "Elegant", fontFamily: "Georgia", fontSize: 38, fill: "#C0C0C0", fontWeight: "bold", fontStyle: "normal", textAlign: "center", charSpacing: 300 },

  // Fun
  { id: "comic-pop", label: "Comic Pop", category: "Fun", fontFamily: "Comic Sans MS, cursive", fontSize: 44, fill: "#FF1493", fontWeight: "bold", fontStyle: "normal", textAlign: "center", stroke: "#FFFFFF", strokeWidth: 2 },
  { id: "rainbow-bounce", label: "Rainbow", category: "Fun", fontFamily: "Comic Sans MS, cursive", fontSize: 42, fill: "#FF6347", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "rgba(255,105,180,0.5)", blur: 8, offsetX: 0, offsetY: 0 } },
  { id: "bubble-blue", label: "Bubble Blue", category: "Fun", fontFamily: "Comic Sans MS, cursive", fontSize: 46, fill: "#87CEEB", fontWeight: "bold", fontStyle: "normal", textAlign: "center", stroke: "#4169E1", strokeWidth: 2 },
  { id: "candy-pink", label: "Candy Pink", category: "Fun", fontFamily: "Comic Sans MS, cursive", fontSize: 40, fill: "#FF69B4", fontWeight: "bold", fontStyle: "normal", textAlign: "center", stroke: "#FF1493", strokeWidth: 1 },
  { id: "sunshine", label: "Sunshine", category: "Fun", fontFamily: "Comic Sans MS, cursive", fontSize: 44, fill: "#FFD700", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "rgba(255,165,0,0.8)", blur: 10, offsetX: 0, offsetY: 0 } },
  { id: "lime-party", label: "Lime Party", category: "Fun", fontFamily: "Comic Sans MS, cursive", fontSize: 42, fill: "#32CD32", fontWeight: "bold", fontStyle: "normal", textAlign: "center", stroke: "#006400", strokeWidth: 1 },

  // Neon
  { id: "neon-pink", label: "Neon Pink", category: "Neon", fontFamily: "Arial", fontSize: 44, fill: "#FF00FF", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "#FF00FF", blur: 20, offsetX: 0, offsetY: 0 } },
  { id: "neon-blue", label: "Neon Blue", category: "Neon", fontFamily: "Arial", fontSize: 44, fill: "#00BFFF", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "#00BFFF", blur: 20, offsetX: 0, offsetY: 0 } },
  { id: "neon-green", label: "Neon Green", category: "Neon", fontFamily: "Arial", fontSize: 44, fill: "#39FF14", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "#39FF14", blur: 20, offsetX: 0, offsetY: 0 } },
  { id: "neon-red", label: "Neon Red", category: "Neon", fontFamily: "Arial", fontSize: 44, fill: "#FF3131", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "#FF3131", blur: 20, offsetX: 0, offsetY: 0 } },
  { id: "neon-yellow", label: "Neon Yellow", category: "Neon", fontFamily: "Arial", fontSize: 44, fill: "#FFFF00", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "#FFFF00", blur: 20, offsetX: 0, offsetY: 0 } },
  { id: "neon-purple", label: "Neon Purple", category: "Neon", fontFamily: "Arial", fontSize: 44, fill: "#BF40BF", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "#BF40BF", blur: 20, offsetX: 0, offsetY: 0 } },
  { id: "neon-orange", label: "Neon Orange", category: "Neon", fontFamily: "Arial", fontSize: 44, fill: "#FF5F1F", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "#FF5F1F", blur: 20, offsetX: 0, offsetY: 0 } },
  { id: "neon-cyan", label: "Neon Cyan", category: "Neon", fontFamily: "Arial", fontSize: 44, fill: "#00FFFF", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "#00FFFF", blur: 20, offsetX: 0, offsetY: 0 } },

  // Vintage
  { id: "retro-cream", label: "Retro Cream", category: "Vintage", fontFamily: "Georgia", fontSize: 38, fill: "#F5DEB3", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "rgba(139,69,19,0.4)", blur: 3, offsetX: 2, offsetY: 2 } },
  { id: "typewriter", label: "Typewriter", category: "Vintage", fontFamily: "Courier New, monospace", fontSize: 34, fill: "#2F2F2F", fontWeight: "normal", fontStyle: "normal", textAlign: "left", charSpacing: 50 },
  { id: "old-west", label: "Old West", category: "Vintage", fontFamily: "Georgia", fontSize: 42, fill: "#8B4513", fontWeight: "bold", fontStyle: "normal", textAlign: "center", stroke: "#DAA520", strokeWidth: 1 },
  { id: "faded-film", label: "Faded Film", category: "Vintage", fontFamily: "Georgia", fontSize: 36, fill: "#A0522D", fontWeight: "normal", fontStyle: "italic", textAlign: "center", shadow: { color: "rgba(0,0,0,0.2)", blur: 6, offsetX: 0, offsetY: 0 } },
  { id: "sepia-bold", label: "Sepia Bold", category: "Vintage", fontFamily: "Times New Roman", fontSize: 40, fill: "#704214", fontWeight: "bold", fontStyle: "normal", textAlign: "center" },
  { id: "antique-gold", label: "Antique Gold", category: "Vintage", fontFamily: "Georgia", fontSize: 38, fill: "#B8860B", fontWeight: "bold", fontStyle: "normal", textAlign: "center", charSpacing: 200, shadow: { color: "rgba(0,0,0,0.3)", blur: 4, offsetX: 1, offsetY: 1 } },

  // Minimal
  { id: "minimal-thin", label: "Thin Minimal", category: "Minimal", fontFamily: "Helvetica Neue, Helvetica, sans-serif", fontSize: 32, fill: "#333333", fontWeight: "100", fontStyle: "normal", textAlign: "center", charSpacing: 500 },
  { id: "clean-white", label: "Clean White", category: "Minimal", fontFamily: "Arial", fontSize: 30, fill: "#ffffff", fontWeight: "300", fontStyle: "normal", textAlign: "center", charSpacing: 300 },
  { id: "mono-small", label: "Mono Small", category: "Minimal", fontFamily: "Courier New, monospace", fontSize: 24, fill: "#666666", fontWeight: "normal", fontStyle: "normal", textAlign: "left", charSpacing: 100 },
  { id: "sans-light", label: "Sans Light", category: "Minimal", fontFamily: "Verdana", fontSize: 28, fill: "#888888", fontWeight: "100", fontStyle: "normal", textAlign: "center", charSpacing: 400 },
  { id: "subtle-gray", label: "Subtle Gray", category: "Minimal", fontFamily: "Arial", fontSize: 26, fill: "#AAAAAA", fontWeight: "300", fontStyle: "normal", textAlign: "center", charSpacing: 200 },
  { id: "whisper", label: "Whisper", category: "Minimal", fontFamily: "Georgia", fontSize: 28, fill: "#D3D3D3", fontWeight: "100", fontStyle: "italic", textAlign: "center", charSpacing: 150 },

  // Artistic
  { id: "graffiti-red", label: "Graffiti Red", category: "Artistic", fontFamily: "Impact", fontSize: 54, fill: "#FF0000", fontWeight: "bold", fontStyle: "italic", textAlign: "center", stroke: "#000000", strokeWidth: 3, shadow: { color: "rgba(0,0,0,0.5)", blur: 6, offsetX: 3, offsetY: 3 } },
  { id: "watercolor-teal", label: "Watercolor Teal", category: "Artistic", fontFamily: "cursive", fontSize: 46, fill: "#008080", fontWeight: "normal", fontStyle: "normal", textAlign: "center", shadow: { color: "rgba(0,128,128,0.4)", blur: 15, offsetX: 0, offsetY: 0 } },
  { id: "chalk-white", label: "Chalk White", category: "Artistic", fontFamily: "Comic Sans MS, cursive", fontSize: 40, fill: "#F0F0F0", fontWeight: "normal", fontStyle: "normal", textAlign: "center", shadow: { color: "rgba(255,255,255,0.3)", blur: 4, offsetX: 1, offsetY: 1 } },
  { id: "galaxy-purple", label: "Galaxy Purple", category: "Artistic", fontFamily: "Georgia", fontSize: 44, fill: "#8A2BE2", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "#DA70D6", blur: 15, offsetX: 0, offsetY: 0 }, stroke: "#4B0082", strokeWidth: 1 },
  { id: "fire-orange", label: "Fire Orange", category: "Artistic", fontFamily: "Impact", fontSize: 48, fill: "#FF4500", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "#FF6347", blur: 12, offsetX: 0, offsetY: 4 } },
  { id: "frost-blue", label: "Frost Blue", category: "Artistic", fontFamily: "Georgia", fontSize: 42, fill: "#B0E0E6", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "#ADD8E6", blur: 18, offsetX: 0, offsetY: 0 }, stroke: "#87CEEB", strokeWidth: 1 },
  { id: "earth-brown", label: "Earth Brown", category: "Artistic", fontFamily: "Georgia", fontSize: 40, fill: "#8B7355", fontWeight: "bold", fontStyle: "normal", textAlign: "center", shadow: { color: "rgba(139,115,85,0.4)", blur: 8, offsetX: 2, offsetY: 2 } },
];
