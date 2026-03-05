import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { supabase } from "@/integrations/supabase/client";

interface AIBeingData {
  id: string;
  display_name: string;
  photo_url: string | null;
  brief_bio: string | null;
  relationship_type: string | null;
  ai_profile_id: string | null;
}

interface WorldAIBeingProps {
  being: AIBeingData;
  position: [number, number, number];
  onChat?: (being: AIBeingData) => void;
}

function WorldAIBeing({ being, position, onChat }: WorldAIBeingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    // Gentle hover animation
    groupRef.current.position.y = position[1] + Math.sin(t * 0.8 + position[0]) * 0.15;
    // Slow rotation to face camera direction
    groupRef.current.rotation.y += 0.003;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Being body - ethereal humanoid shape */}
      <mesh castShadow>
        <capsuleGeometry args={[0.3, 0.8, 8, 16]} />
        <meshPhysicalMaterial
          color="#9b87f5"
          emissive="#7c3aed"
          emissiveIntensity={hovered ? 0.8 : 0.3}
          transparent
          opacity={0.85}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshPhysicalMaterial
          color="#c4b5fd"
          emissive="#a78bfa"
          emissiveIntensity={0.4}
          roughness={0.3}
        />
      </mesh>

      {/* Aura ring */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.8, 16]} />
        <meshStandardMaterial
          color="#7c3aed"
          transparent
          opacity={hovered ? 0.5 : 0.2}
          side={THREE.DoubleSide}
          emissive="#7c3aed"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Glow light */}
      <pointLight color="#9b87f5" intensity={hovered ? 2 : 0.8} distance={5} />

      {/* Name label + interaction */}
      <Html position={[0, 1.4, 0]} center distanceFactor={15}>
        <div
          className="flex flex-col items-center gap-1 cursor-pointer"
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onClick={() => onChat?.(being)}
        >
          <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1 text-center shadow-lg">
            <p className="text-[10px] font-semibold whitespace-nowrap">{being.display_name}</p>
            {being.relationship_type && (
              <p className="text-[8px] text-muted-foreground">{being.relationship_type}</p>
            )}
          </div>
          {hovered && (
            <div className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[9px] font-medium shadow-lg animate-in fade-in">
              Chat ✨
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

interface WorldAIBeingsProps {
  worldOwnerId: string;
  terrainSeed: number;
  onChatWithBeing?: (being: AIBeingData) => void;
}

export function WorldAIBeings({ worldOwnerId, terrainSeed, onChatWithBeing }: WorldAIBeingsProps) {
  const [beings, setBeings] = useState<AIBeingData[]>([]);

  useEffect(() => {
    loadBeings();
  }, [worldOwnerId]);

  const loadBeings = async () => {
    const { data } = await supabase
      .from("ai_companion_displays")
      .select("id, display_name, photo_url, brief_bio, relationship_type, ai_profile_id")
      .eq("user_id", worldOwnerId)
      .eq("is_visible", true)
      .limit(5);

    if (data) setBeings(data);
  };

  if (beings.length === 0) return null;

  // Distribute beings around the origin in a loose circle
  const getBeingPosition = (index: number, total: number): [number, number, number] => {
    const angle = (index / total) * Math.PI * 2;
    const radius = 8 + Math.sin(terrainSeed + index) * 3;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    // Simple height based on terrain seed
    const y = Math.sin(x * 0.05 + terrainSeed * 0.001) * 3 +
              Math.cos(z * 0.07 + terrainSeed * 0.0013) * 2.5 + 1;
    return [x, y, z];
  };

  return (
    <group>
      {beings.map((being, i) => (
        <WorldAIBeing
          key={being.id}
          being={being}
          position={getBeingPosition(i, beings.length)}
          onChat={onChatWithBeing}
        />
      ))}
    </group>
  );
}

export type { AIBeingData };
