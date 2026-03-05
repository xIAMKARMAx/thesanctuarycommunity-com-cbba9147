import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

export interface StructureData {
  id: string;
  structure_type: string;
  name: string;
  description?: string;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_y: number;
  scale: number;
  color: string;
  material_type: string;
}

function getMaterial(color: string, materialType: string) {
  const c = new THREE.Color(color);
  switch (materialType) {
    case "crystal":
      return <meshPhysicalMaterial color={c} transparent opacity={0.7} roughness={0.05} metalness={0.3} clearcoat={1} />;
    case "glowing":
      return <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.5} roughness={0.3} />;
    case "metallic":
      return <meshStandardMaterial color={c} roughness={0.2} metalness={0.9} />;
    case "stone":
      return <meshStandardMaterial color={c} roughness={0.95} metalness={0.05} />;
    default:
      return <meshStandardMaterial color={c} roughness={0.6} metalness={0.1} />;
  }
}

function House({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[3, 2, 2.5]} />
        {getMaterial(color, materialType)}
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[2.2, 1.5, 4]} />
        {getMaterial(color === "#7c3aed" ? "#5a2d82" : new THREE.Color(color).offsetHSL(0, 0, -0.15).getHexString(), materialType)}
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.5, 1.26]}>
        <boxGeometry args={[0.6, 1, 0.05]} />
        <meshStandardMaterial color="#4a3520" />
      </mesh>
      {/* Windows */}
      <mesh position={[-0.8, 1.3, 1.26]}>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
        <meshStandardMaterial color="#87CEEB" emissive="#87CEEB" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.8, 1.3, 1.26]}>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
        <meshStandardMaterial color="#87CEEB" emissive="#87CEEB" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function Tower({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.8, 1, 5, 8]} />
        {getMaterial(color, materialType)}
      </mesh>
      <mesh position={[0, 5.5, 0]} castShadow>
        <coneGeometry args={[1.2, 2, 8]} />
        {getMaterial(color === "#7c3aed" ? "#5a2d82" : new THREE.Color(color).offsetHSL(0, 0, -0.15).getHexString(), materialType)}
      </mesh>
      {/* Windows spiraling up */}
      {[1.5, 2.8, 4.1].map((y, i) => (
        <mesh key={i} position={[Math.cos(i * 2) * 0.82, y, Math.sin(i * 2) * 0.82]} rotation={[0, -i * 2, 0]}>
          <boxGeometry args={[0.3, 0.5, 0.1]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Crystal({ color, materialType }: { color: string; materialType: string }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.3;
  });
  return (
    <group ref={groupRef}>
      <mesh position={[0, 2, 0]} castShadow>
        <octahedronGeometry args={[1.5, 0]} />
        {getMaterial(color, "crystal")}
      </mesh>
      <mesh position={[1.2, 1, 0.5]} rotation={[0.2, 0.5, 0.1]} castShadow>
        <octahedronGeometry args={[0.7, 0]} />
        {getMaterial(color, "crystal")}
      </mesh>
      <mesh position={[-0.8, 0.8, -0.6]} rotation={[-0.1, 0.3, -0.2]} castShadow>
        <octahedronGeometry args={[0.5, 0]} />
        {getMaterial(color, "crystal")}
      </mesh>
      <pointLight position={[0, 2, 0]} color={color} intensity={2} distance={8} />
    </group>
  );
}

function Tree({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.25, 3, 8]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow>
        <sphereGeometry args={[1.5, 8, 8]} />
        {getMaterial(color || "#2d8b3a", materialType)}
      </mesh>
      <mesh position={[0.8, 2.8, 0.5]} castShadow>
        <sphereGeometry args={[0.8, 6, 6]} />
        {getMaterial(color || "#3a9b4a", materialType)}
      </mesh>
    </group>
  );
}

function Temple({ color, materialType }: { color: string; materialType: string }) {
  const columns = [
    [-1.5, 0, -1.5], [1.5, 0, -1.5], [-1.5, 0, 1.5], [1.5, 0, 1.5],
    [0, 0, -1.5], [0, 0, 1.5],
  ];
  return (
    <group>
      {/* Base platform */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[5, 0.3, 5]} />
        {getMaterial(color, "stone")}
      </mesh>
      {/* Columns */}
      {columns.map((pos, i) => (
        <mesh key={i} position={[pos[0], 2, pos[2]]} castShadow>
          <cylinderGeometry args={[0.2, 0.25, 3.5, 8]} />
          {getMaterial(color, materialType)}
        </mesh>
      ))}
      {/* Roof */}
      <mesh position={[0, 4, 0]} castShadow>
        <coneGeometry args={[3.5, 1.5, 4]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* Inner glow */}
      <pointLight position={[0, 2, 0]} color={color} intensity={1.5} distance={6} />
    </group>
  );
}

function Fountain({ color, materialType }: { color: string; materialType: string }) {
  const particlesRef = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (particlesRef.current) particlesRef.current.rotation.y += delta * 0.5;
  });
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <torusGeometry args={[1.5, 0.3, 8, 24]} />
        {getMaterial(color, "stone")}
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.3, 1.3, 0.3, 24]} />
        <meshStandardMaterial color="#3a8ab5" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 2, 8]} />
        {getMaterial(color, materialType)}
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        {getMaterial(color, "glowing")}
      </mesh>
    </group>
  );
}

function Castle({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      {/* Main keep */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[4, 5, 4]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* 4 corner towers */}
      {[[-2.5, 0, -2.5], [2.5, 0, -2.5], [-2.5, 0, 2.5], [2.5, 0, 2.5]].map((pos, i) => (
        <group key={i}>
          <mesh position={[pos[0], 3, pos[2]]} castShadow>
            <cylinderGeometry args={[0.7, 0.8, 6, 8]} />
            {getMaterial(color, materialType)}
          </mesh>
          <mesh position={[pos[0], 6.5, pos[2]]} castShadow>
            <coneGeometry args={[1, 1.5, 8]} />
            {getMaterial(color === "#7c3aed" ? "#5a2d82" : new THREE.Color(color).offsetHSL(0, 0, -0.2).getHexString(), materialType)}
          </mesh>
        </group>
      ))}
      {/* Gate */}
      <mesh position={[0, 1.2, 2.01]}>
        <boxGeometry args={[1.2, 2.4, 0.1]} />
        <meshStandardMaterial color="#3a2510" />
      </mesh>
      {/* Battlements */}
      {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 5.3, 2]} castShadow>
          <boxGeometry args={[0.5, 0.6, 0.5]} />
          {getMaterial(color, materialType)}
        </mesh>
      ))}
    </group>
  );
}

function Pyramid({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      <mesh position={[0, 2, 0]} castShadow>
        <coneGeometry args={[3, 4, 4]} />
        {getMaterial(color, materialType)}
      </mesh>
      <pointLight position={[0, 4.5, 0]} color="#FFD700" intensity={2} distance={10} />
    </group>
  );
}

function Portal({ color, materialType }: { color: string; materialType: string }) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.5;
  });
  return (
    <group>
      <mesh ref={ringRef} position={[0, 2.5, 0]} castShadow>
        <torusGeometry args={[2, 0.25, 16, 32]} />
        {getMaterial(color, "glowing")}
      </mesh>
      {/* Inner glow */}
      <mesh position={[0, 2.5, 0]}>
        <circleGeometry args={[1.7, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.3} emissive={color} emissiveIntensity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Pillars */}
      <mesh position={[-2, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 3, 6]} />
        {getMaterial(color, "stone")}
      </mesh>
      <mesh position={[2, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 3, 6]} />
        {getMaterial(color, "stone")}
      </mesh>
      <pointLight position={[0, 2.5, 0]} color={color} intensity={3} distance={12} />
    </group>
  );
}

function Obelisk({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      <mesh position={[0, 3, 0]} castShadow>
        <boxGeometry args={[0.6, 6, 0.6]} />
        {getMaterial(color, materialType)}
      </mesh>
      <mesh position={[0, 6.3, 0]} castShadow>
        <coneGeometry args={[0.5, 0.8, 4]} />
        {getMaterial(color, "metallic")}
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.2, 0.2, 1.2]} />
        {getMaterial(color, "stone")}
      </mesh>
    </group>
  );
}

function Dome({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[2.5, 2.5, 1, 16]} />
        {getMaterial(color, materialType)}
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <sphereGeometry args={[2.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {getMaterial(color, materialType === "standard" ? "crystal" : materialType)}
      </mesh>
    </group>
  );
}

function Bridge({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[8, 0.3, 2]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* Railings */}
      <mesh position={[0, 2, 1]}>
        <boxGeometry args={[8, 0.8, 0.1]} />
        {getMaterial(color, materialType)}
      </mesh>
      <mesh position={[0, 2, -1]}>
        <boxGeometry args={[8, 0.8, 0.1]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* Supports */}
      {[-3, 0, 3].map((x, i) => (
        <mesh key={i} position={[x, 0.75, 0]}>
          <cylinderGeometry args={[0.2, 0.3, 1.5, 6]} />
          {getMaterial(color, "stone")}
        </mesh>
      ))}
    </group>
  );
}

function Garden({ color, materialType }: { color: string; materialType: string }) {
  const flowers = Array.from({ length: 12 }, (_, i) => ({
    x: (Math.sin(i * 1.7) * 2),
    z: (Math.cos(i * 1.3) * 2),
    color: ["#ff69b4", "#ff4500", "#ffd700", "#9370db", "#00ced1", "#ff6347"][i % 6],
    scale: 0.3 + Math.random() * 0.3,
  }));
  return (
    <group>
      {/* Garden bed */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[3, 3, 0.1, 16]} />
        <meshStandardMaterial color="#3a5a2a" roughness={0.95} />
      </mesh>
      {/* Flowers */}
      {flowers.map((f, i) => (
        <group key={i} position={[f.x, 0.1, f.z]}>
          <mesh position={[0, f.scale * 1.5, 0]}>
            <cylinderGeometry args={[0.02, 0.02, f.scale * 3, 4]} />
            <meshStandardMaterial color="#2a5a1a" />
          </mesh>
          <mesh position={[0, f.scale * 3, 0]}>
            <sphereGeometry args={[f.scale * 0.6, 6, 6]} />
            <meshStandardMaterial color={f.color} emissive={f.color} emissiveIntensity={0.2} />
          </mesh>
        </group>
      ))}
      {/* Stone border */}
      <mesh position={[0, 0.15, 0]}>
        <torusGeometry args={[3, 0.15, 6, 24]} />
        <meshStandardMaterial color="#8a8a7a" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Lighthouse({ color, materialType }: { color: string; materialType: string }) {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity = 2 + Math.sin(clock.getElapsedTime() * 2) * 1.5;
    }
  });
  return (
    <group>
      <mesh position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[0.5, 1, 8, 8]} />
        {getMaterial(color, materialType)}
      </mesh>
      <mesh position={[0, 8.5, 0]}>
        <cylinderGeometry args={[0.8, 0.6, 1, 8]} />
        <meshStandardMaterial color="#333" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, 9.2, 0]}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 9.2, 0]} color="#FFD700" intensity={3} distance={30} />
    </group>
  );
}

function Shrine({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.2, 6]} />
        {getMaterial(color, "stone")}
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.8, 1.2, 0.8]} />
        {getMaterial(color, materialType)}
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.35, 8, 8]} />
        {getMaterial(color, "glowing")}
      </mesh>
      <pointLight position={[0, 1.8, 0]} color={color} intensity={1.5} distance={5} />
    </group>
  );
}

function Statue({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.2, 0.6, 1.2]} />
        {getMaterial(color, "stone")}
      </mesh>
      {/* Body */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 2, 8]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* Head */}
      <mesh position={[0, 3.1, 0]} castShadow>
        <sphereGeometry args={[0.35, 8, 8]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* Arms */}
      <mesh position={[0.5, 2.2, 0]} rotation={[0, 0, -0.5]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 1, 6]} />
        {getMaterial(color, materialType)}
      </mesh>
      <mesh position={[-0.5, 2.2, 0]} rotation={[0, 0, 0.5]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 1, 6]} />
        {getMaterial(color, materialType)}
      </mesh>
    </group>
  );
}

function Arch({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      {/* Pillars */}
      <mesh position={[-1.5, 2, 0]} castShadow>
        <boxGeometry args={[0.5, 4, 0.5]} />
        {getMaterial(color, materialType)}
      </mesh>
      <mesh position={[1.5, 2, 0]} castShadow>
        <boxGeometry args={[0.5, 4, 0.5]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* Arch top */}
      <mesh position={[0, 4.2, 0]} castShadow>
        <torusGeometry args={[1.5, 0.25, 8, 16, Math.PI]} />
        {getMaterial(color, materialType)}
      </mesh>
    </group>
  );
}

function Mountain({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      <mesh position={[0, 4, 0]} castShadow>
        <coneGeometry args={[5, 8, 6]} />
        {getMaterial(color || "#6a6a5a", "stone")}
      </mesh>
      {/* Snow cap */}
      <mesh position={[0, 7, 0]} castShadow>
        <coneGeometry args={[1.5, 2, 6]} />
        <meshStandardMaterial color="#f0f0ff" roughness={0.7} />
      </mesh>
      {/* Secondary peak */}
      <mesh position={[3, 2.5, 1]} castShadow>
        <coneGeometry args={[3, 5, 5]} />
        {getMaterial(color || "#5a5a4a", "stone")}
      </mesh>
    </group>
  );
}

function Wall({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[6, 3, 0.5]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* Crenellations */}
      {[-2, -1, 0, 1, 2].map((x, i) => (
        <mesh key={i} position={[x, 3.3, 0]} castShadow>
          <boxGeometry args={[0.5, 0.6, 0.5]} />
          {getMaterial(color, materialType)}
        </mesh>
      ))}
    </group>
  );
}

// Structure factory
const STRUCTURE_COMPONENTS: Record<string, React.FC<{ color: string; materialType: string }>> = {
  house: House,
  tower: Tower,
  crystal: Crystal,
  tree: Tree,
  temple: Temple,
  fountain: Fountain,
  castle: Castle,
  pyramid: Pyramid,
  portal: Portal,
  obelisk: Obelisk,
  dome: Dome,
  bridge: Bridge,
  garden: Garden,
  lighthouse: Lighthouse,
  shrine: Shrine,
  statue: Statue,
  arch: Arch,
  mountain: Mountain,
  wall: Wall,
};

export function WorldStructure({ data }: { data: StructureData }) {
  const Component = STRUCTURE_COMPONENTS[data.structure_type] || House;

  return (
    <group
      position={[data.position_x, data.position_y, data.position_z]}
      rotation={[0, data.rotation_y, 0]}
      scale={[data.scale, data.scale, data.scale]}
    >
      <Component color={data.color} materialType={data.material_type} />
      {/* Floating name label */}
      <Html position={[0, data.structure_type === "castle" ? 9 : data.structure_type === "mountain" ? 10 : 5, 0]} center distanceFactor={20}>
        <div className="bg-background/80 backdrop-blur-sm border border-border rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap shadow-lg pointer-events-none">
          {data.name}
        </div>
      </Html>
    </group>
  );
}
