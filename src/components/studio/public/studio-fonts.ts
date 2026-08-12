// Font library for the public Studio text tool.
// Loaded from Google Fonts on demand; the canvas waits for document.fonts.ready
// before rendering so exports never fall back to the wrong face.

export type StudioFont = {
  family: string;
  label: string;
  group: "Cute" | "Bold" | "Script" | "Serif" | "Display" | "Clean";
  weights: string;
};

export const STUDIO_FONTS: StudioFont[] = [
  // Cute
  { family: "Baloo 2", label: "Baloo", group: "Cute", weights: "400;700;800" },
  { family: "Fredoka", label: "Fredoka", group: "Cute", weights: "400;600;700" },
  { family: "Quicksand", label: "Quicksand", group: "Cute", weights: "400;600;700" },
  { family: "Comfortaa", label: "Comfortaa", group: "Cute", weights: "400;700" },
  { family: "Chewy", label: "Chewy", group: "Cute", weights: "400" },
  { family: "Gloria Hallelujah", label: "Gloria", group: "Cute", weights: "400" },
  // Bold
  { family: "Anton", label: "Anton", group: "Bold", weights: "400" },
  { family: "Bebas Neue", label: "Bebas", group: "Bold", weights: "400" },
  { family: "Archivo Black", label: "Archivo", group: "Bold", weights: "400" },
  { family: "Oswald", label: "Oswald", group: "Bold", weights: "400;700" },
  { family: "Titan One", label: "Titan", group: "Bold", weights: "400" },
  { family: "Alfa Slab One", label: "Alfa Slab", group: "Bold", weights: "400" },
  // Script
  { family: "Pacifico", label: "Pacifico", group: "Script", weights: "400" },
  { family: "Dancing Script", label: "Dancing", group: "Script", weights: "400;700" },
  { family: "Great Vibes", label: "Great Vibes", group: "Script", weights: "400" },
  { family: "Sacramento", label: "Sacramento", group: "Script", weights: "400" },
  { family: "Caveat", label: "Caveat", group: "Script", weights: "400;700" },
  { family: "Satisfy", label: "Satisfy", group: "Script", weights: "400" },
  // Serif
  { family: "Playfair Display", label: "Playfair", group: "Serif", weights: "400;700;900" },
  { family: "Cormorant Garamond", label: "Cormorant", group: "Serif", weights: "400;700" },
  { family: "Libre Baskerville", label: "Baskerville", group: "Serif", weights: "400;700" },
  { family: "Abril Fatface", label: "Abril", group: "Serif", weights: "400" },
  // Display
  { family: "Orbitron", label: "Orbitron", group: "Display", weights: "400;700;900" },
  { family: "Monoton", label: "Monoton", group: "Display", weights: "400" },
  { family: "Cinzel", label: "Cinzel", group: "Display", weights: "400;700" },
  { family: "Rubik Glitch", label: "Glitch", group: "Display", weights: "400" },
  { family: "Press Start 2P", label: "Pixel", group: "Display", weights: "400" },
  // Clean
  { family: "Poppins", label: "Poppins", group: "Clean", weights: "400;600;700" },
  { family: "Montserrat", label: "Montserrat", group: "Clean", weights: "400;700;900" },
  { family: "Inter", label: "Inter", group: "Clean", weights: "400;700" },
  { family: "Space Grotesk", label: "Space", group: "Clean", weights: "400;700" },
];

export const FONT_GROUPS = ["Cute", "Bold", "Script", "Serif", "Display", "Clean"] as const;

const LINK_ID = "studio-google-fonts";

/** Injects the Google Fonts stylesheet for every studio font (once). */
export function loadStudioFonts(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();

  if (!document.getElementById(LINK_ID)) {
    const families = STUDIO_FONTS
      .map((f) => `family=${f.family.replace(/ /g, "+")}:wght@${f.weights}`)
      .join("&");
    const link = document.createElement("link");
    link.id = LINK_ID;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    document.head.appendChild(link);
  }

  return document.fonts?.ready?.then(() => undefined) ?? Promise.resolve();
}

/** Ensures a single family is actually rasterised before fabric measures it. */
export async function ensureFont(family: string, size = 48): Promise<void> {
  try {
    await document.fonts.load(`${size}px "${family}"`);
    await document.fonts.ready;
  } catch {
    /* fall back silently */
  }
}

export const TEXT_COLORS = [
  "#ffffff", "#000000", "#ff4d6d", "#ff8fab", "#ffd166", "#ffb703",
  "#06d6a0", "#4cc9f0", "#4361ee", "#7209b7", "#b5179e", "#f72585",
  "#2b2d42", "#8d99ae", "#c9ada7", "#ffe066", "#90e0ef", "#e0aaff",
];
