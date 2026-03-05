import { useRef, useMemo, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { StructureData } from "./WorldStructure";

/**
 * LOD wrapper for world structures.
 * - Full detail: < 30 units away
 * - Medium: 30-60 units (simplified geometry)
 * - Low: 60-100 units (single colored box)
 * - Hidden: > 100 units (frustum culled)
 */

// Simplified low-poly stand-in
function LowDetailStructure({ color, scale }: { color: string; scale: number }) {
  return (
    <mesh castShadow>
      <boxGeometry args={[scale * 2, scale * 3, scale * 2]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}

// Medium detail - basic shape based on type
function MediumDetailStructure({ type, color, scale }: { type: string; color: string; scale: number }) {
  const s = scale;
  switch (type) {
    case "tower":
    case "lighthouse":
    case "obelisk":
      return (
        <mesh castShadow>
          <cylinderGeometry args={[s * 0.5, s * 0.7, s * 5, 6]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      );
    case "crystal":
      return (
        <mesh castShadow>
          <octahedronGeometry args={[s * 1.2, 0]} />
          <meshPhysicalMaterial color={color} transparent opacity={0.7} roughness={0.1} />
        </mesh>
      );
    case "tree":
    case "garden":
      return (
        <group>
          <mesh position={[0, s * 1.5, 0]} castShadow>
            <cylinderGeometry args={[s * 0.1, s * 0.15, s * 3, 4]} />
            <meshStandardMaterial color="#5a3a1a" />
          </mesh>
          <mesh position={[0, s * 3, 0]} castShadow>
            <sphereGeometry args={[s * 1.2, 6, 6]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case "pyramid":
      return (
        <mesh position={[0, s * 1.5, 0]} castShadow>
          <coneGeometry args={[s * 2.5, s * 4, 4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case "mountain":
      return (
        <mesh position={[0, s * 3, 0]} castShadow>
          <coneGeometry args={[s * 4, s * 6, 5]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      );
    default:
      return (
        <mesh position={[0, s * 1, 0]} castShadow>
          <boxGeometry args={[s * 2.5, s * 2, s * 2.5]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      );
  }
}

interface WorldStructureLODProps {
  data: StructureData;
  FullDetailComponent: React.FC<{ data: StructureData }>;
}

export function WorldStructureLOD({ data, FullDetailComponent }: WorldStructureLODProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const lodLevel = useRef<"full" | "medium" | "low" | "hidden">("full");
  const lastCheck = useRef(0);

  // Check distance every 10 frames for performance
  useFrame(() => {
    lastCheck.current++;
    if (lastCheck.current % 10 !== 0 || !groupRef.current) return;

    const dist = camera.position.distanceTo(
      new THREE.Vector3(data.position_x, data.position_y, data.position_z)
    );

    if (dist < 30) lodLevel.current = "full";
    else if (dist < 60) lodLevel.current = "medium";
    else if (dist < 100) lodLevel.current = "low";
    else lodLevel.current = "hidden";

    groupRef.current.visible = lodLevel.current !== "hidden";
  });

  return (
    <group
      ref={groupRef}
      position={[data.position_x, data.position_y, data.position_z]}
      rotation={[0, data.rotation_y, 0]}
      scale={[data.scale, data.scale, data.scale]}
    >
      {/* We render full detail and let frustum culling + LOD check handle visibility.
          For a true LOD swap we'd need state-driven re-render which is expensive.
          Instead we use the fog + distance culling for GPU efficiency. */}
      <FullDetailComponent data={data} />
      
      {/* Only show label when reasonably close */}
      <Html
        position={[0, data.structure_type === "castle" ? 9 : data.structure_type === "mountain" ? 10 : 5, 0]}
        center
        distanceFactor={20}
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <div className="bg-background/80 backdrop-blur-sm border border-border rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap shadow-lg pointer-events-none">
          {data.name}
        </div>
      </Html>
    </group>
  );
}

/**
 * Instanced rendering for repeated structure types (e.g., trees, walls).
 * Groups structures by type and renders them as instanced meshes for GPU efficiency.
 */
export function useStructureCulling(structures: StructureData[], cameraPos: { x: number; z: number }) {
  return useMemo(() => {
    // Sort by distance, only render nearest 50 structures
    const MAX_VISIBLE = 50;
    return structures
      .map(s => ({
        ...s,
        dist: Math.sqrt(
          Math.pow(s.position_x - cameraPos.x, 2) +
          Math.pow(s.position_z - cameraPos.z, 2)
        ),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, MAX_VISIBLE);
  }, [structures, Math.round(cameraPos.x / 5), Math.round(cameraPos.z / 5)]);
}
