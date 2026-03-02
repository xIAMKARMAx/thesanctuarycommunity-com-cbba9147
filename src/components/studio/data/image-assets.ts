export interface ImageAsset {
  id: string;
  label: string;
  category: string;
  pack: string;
  thumbnailUrl: string;
  fullUrl: string;
  type: "effect" | "sticker" | "frame";
  blendMode?: string; // 'screen' for glowing overlays on black bg, 'normal' for stickers
}

export interface AssetPack {
  id: string;
  label: string;
  type: "effect" | "sticker" | "frame";
  thumbnailUrl: string;
  assets: ImageAsset[];
}

// ===== EFFECTS (overlay with screen blend mode) =====
export const IMAGE_EFFECTS: ImageAsset[] = [
  {
    id: "love-golden-hearts",
    label: "Golden Hearts",
    category: "Love Vibes",
    pack: "love-vibes",
    thumbnailUrl: "/studio-assets/effects/love-golden-hearts.png",
    fullUrl: "/studio-assets/effects/love-golden-hearts.png",
    type: "effect",
    blendMode: "screen",
  },
  {
    id: "love-neon-heart",
    label: "Neon Heart",
    category: "Love Vibes",
    pack: "love-vibes",
    thumbnailUrl: "/studio-assets/effects/love-neon-heart.png",
    fullUrl: "/studio-assets/effects/love-neon-heart.png",
    type: "effect",
    blendMode: "screen",
  },
  {
    id: "love-sparkle-trail",
    label: "Sparkle Trail",
    category: "Love Vibes",
    pack: "love-vibes",
    thumbnailUrl: "/studio-assets/effects/love-sparkle-trail.png",
    fullUrl: "/studio-assets/effects/love-sparkle-trail.png",
    type: "effect",
    blendMode: "screen",
  },
  {
    id: "love-pink-explosion",
    label: "Pink Explosion",
    category: "Love Vibes",
    pack: "love-vibes",
    thumbnailUrl: "/studio-assets/effects/love-pink-explosion.png",
    fullUrl: "/studio-assets/effects/love-pink-explosion.png",
    type: "effect",
    blendMode: "screen",
  },
];

// ===== STICKERS (individual placeable items, screen blend) =====
export const IMAGE_STICKERS: ImageAsset[] = [
  {
    id: "feather-heart-white",
    label: "Feather Heart",
    category: "Love Vibes",
    pack: "love-vibes",
    thumbnailUrl: "/studio-assets/stickers/feather-heart-white.png",
    fullUrl: "/studio-assets/stickers/feather-heart-white.png",
    type: "sticker",
    blendMode: "screen",
  },
  {
    id: "crystal-heart",
    label: "Crystal Heart",
    category: "Love Vibes",
    pack: "love-vibes",
    thumbnailUrl: "/studio-assets/stickers/crystal-heart.png",
    fullUrl: "/studio-assets/stickers/crystal-heart.png",
    type: "sticker",
    blendMode: "screen",
  },
  {
    id: "rose-petals-red",
    label: "Rose Petals",
    category: "Love Vibes",
    pack: "love-vibes",
    thumbnailUrl: "/studio-assets/stickers/rose-petals-red.png",
    fullUrl: "/studio-assets/stickers/rose-petals-red.png",
    type: "sticker",
    blendMode: "screen",
  },
];

// ===== FRAMES (full-bleed overlay, screen blend) =====
export const IMAGE_FRAMES: ImageAsset[] = [
  {
    id: "gold-ornate-frame",
    label: "Gold Ornate",
    category: "Elegant",
    pack: "elegant-frames",
    thumbnailUrl: "/studio-assets/frames/gold-ornate-frame.png",
    fullUrl: "/studio-assets/frames/gold-ornate-frame.png",
    type: "frame",
    blendMode: "screen",
  },
  {
    id: "love-fur-frame",
    label: "Love Fur",
    category: "Love Vibes",
    pack: "love-vibes",
    thumbnailUrl: "/studio-assets/frames/love-fur-frame.png",
    fullUrl: "/studio-assets/frames/love-fur-frame.png",
    type: "frame",
    blendMode: "screen",
  },
  {
    id: "neon-purple-frame",
    label: "Neon Purple",
    category: "Modern",
    pack: "modern-frames",
    thumbnailUrl: "/studio-assets/frames/neon-purple-frame.png",
    fullUrl: "/studio-assets/frames/neon-purple-frame.png",
    type: "frame",
    blendMode: "screen",
  },
];

export const EFFECT_PACK_CATEGORIES = ["Love Vibes"];
export const STICKER_PACK_CATEGORIES = ["Love Vibes"];
export const FRAME_PACK_CATEGORIES = ["Elegant", "Love Vibes", "Modern"];
