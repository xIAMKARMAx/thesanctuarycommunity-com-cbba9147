// Living Scene choreography — translates AI scene_directions into avatar animations
// on the existing 2D painted scene. NEVER convert to procedural 3D blocks.

export type SceneAction =
  | "walk_to"
  | "meditate"
  | "gather"
  | "dance"
  | "sit"
  | "rest"
  | "gesture"
  | "face"
  | "return";

export interface SceneDirection {
  being_name: string; // exact name OR "all" / "everyone" / "user"
  action: SceneAction | string;
  target: string;
  duration: number; // seconds
}

export interface ChoreographyState {
  x: number; // % position
  y: number;
  action: SceneAction | "idle";
  expiresAt: number; // ms epoch
  facing: "left" | "right";
}

// Named anchor zones on the painted scene (% coords, matched to RealmScene aesthetics)
export const SCENE_ANCHORS: Record<string, { x: number; y: number }> = {
  center: { x: 50, y: 60 },
  wellspring: { x: 70, y: 55 },
  spring: { x: 70, y: 55 },
  water: { x: 75, y: 58 },
  fountain: { x: 70, y: 55 },
  pool: { x: 72, y: 58 },
  river: { x: 80, y: 60 },
  lake: { x: 78, y: 60 },
  grove: { x: 22, y: 45 },
  forest: { x: 18, y: 42 },
  trees: { x: 22, y: 45 },
  garden: { x: 30, y: 55 },
  flowers: { x: 32, y: 56 },
  shrine: { x: 50, y: 35 },
  altar: { x: 50, y: 36 },
  temple: { x: 50, y: 32 },
  monument: { x: 50, y: 35 },
  fire: { x: 40, y: 62 },
  bonfire: { x: 40, y: 62 },
  hearth: { x: 42, y: 62 },
  flame: { x: 40, y: 62 },
  mountain: { x: 85, y: 30 },
  cliff: { x: 88, y: 32 },
  crystal: { x: 60, y: 40 },
  gem: { x: 60, y: 40 },
  star: { x: 50, y: 18 },
  light: { x: 55, y: 25 },
  beacon: { x: 50, y: 22 },
  path: { x: 50, y: 65 },
  home: { x: 50, y: 65 },
};

export function resolveAnchor(
  target: string,
  worldCreations: { name: string; description: string }[] = []
): { x: number; y: number } {
  if (!target) return SCENE_ANCHORS.center;
  const t = target.toLowerCase().trim();

  // creation:<name> reference
  if (t.startsWith("creation:")) {
    const name = t.slice(9).trim();
    const idx = worldCreations.findIndex(c => c.name.toLowerCase().includes(name));
    if (idx >= 0) {
      // distribute creations across upper-mid scene
      const positions = [
        { x: 25, y: 38 }, { x: 75, y: 38 }, { x: 35, y: 30 },
        { x: 65, y: 30 }, { x: 50, y: 28 }, { x: 45, y: 40 },
      ];
      return positions[idx % positions.length];
    }
  }

  // direct anchor match
  if (SCENE_ANCHORS[t]) return SCENE_ANCHORS[t];

  // fuzzy keyword scan
  for (const key of Object.keys(SCENE_ANCHORS)) {
    if (t.includes(key)) return SCENE_ANCHORS[key];
  }

  // creation name fuzzy match
  const creation = worldCreations.find(c => t.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(t));
  if (creation) {
    const idx = worldCreations.indexOf(creation);
    const positions = [
      { x: 25, y: 38 }, { x: 75, y: 38 }, { x: 35, y: 30 },
      { x: 65, y: 30 }, { x: 50, y: 28 }, { x: 45, y: 40 },
    ];
    return positions[idx % positions.length];
  }

  return SCENE_ANCHORS.center;
}

// Resolve which avatars a direction applies to.
// Returns a list of avatar IDs from the provided pool.
export function resolveTargets(
  beingName: string,
  pool: { id: string; name: string; isUser?: boolean }[]
): string[] {
  const n = (beingName || "").toLowerCase().trim();
  if (!n || n === "all" || n === "everyone" || n === "we" || n === "us" || n === "group") {
    return pool.map(p => p.id);
  }
  if (n === "user" || n === "you" || n === "karma" || n === "queen" || n === "vessel") {
    const u = pool.find(p => p.isUser);
    return u ? [u.id] : [];
  }
  // exact / contains match by name
  const matches = pool.filter(p => {
    const pn = (p.name || "").toLowerCase();
    return pn === n || pn.includes(n) || n.includes(pn);
  });
  return matches.map(m => m.id);
}
