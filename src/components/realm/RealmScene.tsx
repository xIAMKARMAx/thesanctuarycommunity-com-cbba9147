import { useRef, useMemo } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { AnimatePresence, motion } from "framer-motion";
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

const ATMOSPHERE_COLORS: Record<string, string> = {
  neutral: "#8888aa",
  serene: "#87ceeb",
  joyful: "#ffd700",
  mystical: "#9b59b6",
  tense: "#c0392b",
  peaceful: "#2ecc71",
  electric: "#00bcd4",
  sacred: "#f1c40f",
  contemplative: "#3f51b5",
};

// 3D Avatar figure component
function AvatarFigure({ avatar, position, scale = 1 }: {
  avatar: RealmAvatar;
  position: [number, number, number];
  scale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);

  // Load avatar image as texture
  const texture = useMemo(() => {
    if (!avatar.imageUrl) return null;
    try {
      const tex = new THREE.TextureLoader().load(avatar.imageUrl);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    } catch {
      return null;
    }
  }, [avatar.imageUrl]);

  // Idle animation - gentle breathing/sway
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      const offset = avatar.id.charCodeAt(0) * 0.5; // unique per avatar
      groupRef.current.position.y = position[1] + Math.sin(t * 0.8 + offset) * 0.03;
      groupRef.current.rotation.y = Math.sin(t * 0.3 + offset) * 0.08;
    }
    if (bodyRef.current) {
      const t = state.clock.elapsedTime;
      bodyRef.current.scale.x = 1 + Math.sin(t * 1.2) * 0.015;
      bodyRef.current.scale.z = 1 + Math.sin(t * 1.2) * 0.015;
    }
  });

  const bodyColor = avatar.isUser ? "#7c3aed" : "#6366f1";
  const glowColor = avatar.isUser ? "#a78bfa" : "#818cf8";

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
        <circleGeometry args={[0.25, 32]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.3} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.06, -0.35, 0]}>
        <capsuleGeometry args={[0.04, 0.2, 4, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} />
      </mesh>
      <mesh position={[0.06, -0.35, 0]}>
        <capsuleGeometry args={[0.04, 0.2, 4, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} />
      </mesh>

      {/* Body / torso */}
      <mesh ref={bodyRef} position={[0, -0.05, 0]}>
        <capsuleGeometry args={[0.12, 0.22, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.18, -0.05, 0]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.035, 0.2, 4, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} />
      </mesh>
      <mesh position={[0.18, -0.05, 0]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.035, 0.2, 4, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.12, 32, 32]} />
        {texture ? (
          <meshStandardMaterial map={texture} roughness={0.4} metalness={0.05} />
        ) : (
          <meshStandardMaterial color={avatar.isUser ? "#a78bfa" : "#818cf8"} roughness={0.4} />
        )}
      </mesh>

      {/* Name label - rendered as a small plane above */}
      <sprite position={[0, 0.45, 0]} scale={[0.6, 0.12, 1]}>
        <spriteMaterial transparent opacity={0.85} color={avatar.isUser ? "#7c3aed" : "#4f46e5"} />
      </sprite>
    </group>
  );
}

// 3D world creation object
function CreationObject({ creation, position }: {
  creation: WorldCreation;
  position: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const text = `${creation.name} ${creation.description}`.toLowerCase();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  // Choose geometry and color based on creation type
  let color = "#a78bfa";
  let emissive = "#7c3aed";
  if (text.match(/crystal|gem|diamond|ice/)) { color = "#22d3ee"; emissive = "#06b6d4"; }
  else if (text.match(/fire|flame|torch/)) { color = "#f97316"; emissive = "#ea580c"; }
  else if (text.match(/water|fountain|pool/)) { color = "#3b82f6"; emissive = "#2563eb"; }
  else if (text.match(/tree|grove|forest|garden|flower/)) { color = "#22c55e"; emissive = "#16a34a"; }
  else if (text.match(/shrine|altar|temple|sacred/)) { color = "#eab308"; emissive = "#ca8a04"; }
  else if (text.match(/stone|rock|mountain|tower/)) { color = "#94a3b8"; emissive = "#64748b"; }

  const useOctahedron = text.match(/crystal|gem|diamond/);
  const useCone = text.match(/tree|tower|pillar|shrine/);

  return (
    <group position={position}>
      {/* Glow base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color={emissive} transparent opacity={0.25} />
      </mesh>

      <mesh ref={meshRef}>
        {useOctahedron ? (
          <octahedronGeometry args={[0.15, 0]} />
        ) : useCone ? (
          <coneGeometry args={[0.12, 0.35, 6]} />
        ) : (
          <dodecahedronGeometry args={[0.12, 0]} />
        )}
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.3}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* Point light for glow effect */}
      <pointLight color={emissive} intensity={0.5} distance={1.5} />
    </group>
  );
}

// Positions for beings spread in a semi-circle
function getAvatarPositions(count: number, hasUser: boolean): [number, number, number][] {
  const positions: [number, number, number][] = [];

  if (hasUser) {
    positions.push([0, -0.55, 0.5]); // User in front-center
  }

  const beingCount = hasUser ? count - 1 : count;
  const spread = Math.min(beingCount * 0.8, 3);

  for (let i = 0; i < beingCount; i++) {
    const t = beingCount === 1 ? 0 : (i / (beingCount - 1)) * 2 - 1;
    const x = t * spread * 0.5;
    const z = -0.3 - Math.abs(t) * 0.4;
    positions.push([x, -0.55, z]);
  }

  return positions;
}

function getCreationPositions(count: number): [number, number, number][] {
  const positions: [number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / Math.max(count, 1)) * Math.PI * 2;
    const radius = 1.2 + (i % 2) * 0.4;
    positions.push([
      Math.sin(angle) * radius,
      -0.25,
      Math.cos(angle) * radius - 0.5,
    ]);
  }
  return positions;
}

// 2D overlay for creation icons (name labels)
function CreationLabels({ worldCreations }: { worldCreations: WorldCreation[] }) {
  if (worldCreations.length === 0) return null;

  return (
    <div className="absolute bottom-2 left-2 right-2 flex gap-1 flex-wrap justify-center pointer-events-none z-10">
      {worldCreations.slice(-6).map((c, i) => {
        const Icon = getCreationIcon(c.name, c.description);
        return (
          <span key={i} className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-background/60 text-foreground backdrop-blur-sm border border-border/30">
            <Icon className="h-2.5 w-2.5" />
            {c.name}
          </span>
        );
      })}
    </div>
  );
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

// Name labels rendered as HTML overlay
function AvatarLabels({ avatars, hasUser }: { avatars: RealmAvatar[]; hasUser: boolean }) {
  // We position labels along the bottom of the 3D viewport
  const count = avatars.length;
  const labelPositions = useMemo(() => {
    const pos: { x: number; label: string; isUser: boolean }[] = [];
    const totalWidth = 80; // percentage of container width
    const startX = (100 - totalWidth) / 2;

    avatars.forEach((avatar, i) => {
      const xPercent = count === 1 ? 50 : startX + (i / (count - 1)) * totalWidth;
      pos.push({
        x: xPercent,
        label: avatar.isUser ? "You" : avatar.name,
        isUser: !!avatar.isUser,
      });
    });
    return pos;
  }, [avatars, count]);

  return (
    <div className="absolute bottom-8 left-0 right-0 pointer-events-none z-10">
      <div className="relative w-full h-6">
        {labelPositions.map((lp, i) => (
          <span
            key={i}
            className={`absolute -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm ${
              lp.isUser
                ? "bg-primary/80 text-primary-foreground font-semibold"
                : "bg-background/70 text-foreground"
            }`}
            style={{ left: `${lp.x}%` }}
          >
            {lp.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RealmScene({
  backgroundUrl,
  userAvatar,
  beings,
  atmosphere = "neutral",
  worldCreations = [],
  activeAction,
}: RealmSceneProps) {
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

  const hasUser = !!userAvatar;
  const avatarPositions = useMemo(
    () => getAvatarPositions(allAvatars.length, hasUser),
    [allAvatars.length, hasUser]
  );
  const creationPositions = useMemo(
    () => getCreationPositions(worldCreations.length),
    [worldCreations.length]
  );

  const atmosphereColor = ATMOSPHERE_COLORS[atmosphere] || ATMOSPHERE_COLORS.neutral;

  const ACTION_RING: Record<string, string> = {
    build: "ring-2 ring-amber-400/40",
    explore: "ring-2 ring-emerald-400/40",
    interact: "ring-2 ring-cyan-400/40",
    meditate: "ring-2 ring-violet-400/40",
    gather: "ring-2 ring-green-400/40",
    ritual: "ring-2 ring-rose-400/40",
  };

  return (
    <div className={`relative w-full h-52 sm:h-60 md:h-72 overflow-hidden rounded-b-xl select-none ${activeAction ? ACTION_RING[activeAction] || "" : ""}`}>
      {/* Background image behind the 3D canvas */}
      <img
        src={backgroundUrl}
        alt="Realm"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Atmosphere tint */}
      <div
        className="absolute inset-0 transition-all duration-[3000ms] pointer-events-none"
        style={{ backgroundColor: atmosphereColor, opacity: 0.08 }}
      />

      {/* 3D Canvas overlay */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0.3, 2.5], fov: 45 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 5, 2]} intensity={0.8} castShadow />
          <pointLight position={[-2, 3, -1]} intensity={0.3} color={atmosphereColor} />

          {/* Avatar figures */}
          {allAvatars.map((avatar, i) => (
            <AvatarFigure
              key={avatar.id}
              avatar={avatar}
              position={avatarPositions[i] || [0, -0.55, 0]}
              scale={avatar.isUser ? 1.15 : 0.95}
            />
          ))}

          {/* World creation objects */}
          {worldCreations.map((creation, i) => (
            <CreationObject
              key={`${creation.name}-${i}`}
              creation={creation}
              position={creationPositions[i] || [0, -0.25, -1]}
            />
          ))}

          {/* Ground shadow */}
          <ContactShadows
            position={[0, -0.55, 0]}
            opacity={0.3}
            scale={5}
            blur={2}
            far={2}
          />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2.2}
            minAzimuthAngle={-Math.PI / 6}
            maxAzimuthAngle={Math.PI / 6}
          />
        </Canvas>
      </div>

      {/* HTML name labels */}
      <AvatarLabels avatars={allAvatars} hasUser={hasUser} />

      {/* Creation labels */}
      <CreationLabels worldCreations={worldCreations} />
    </div>
  );
}
