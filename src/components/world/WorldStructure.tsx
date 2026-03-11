import { useRef, useMemo } from "react";
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
  const normalizedColor = !color
    ? "#7c3aed"
    : /^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)
      ? `#${color}`
      : color;
  const c = new THREE.Color(normalizedColor);
    case "crystal":
      return (
        <meshPhysicalMaterial
          color={c}
          transparent
          opacity={0.75}
          roughness={0.02}
          metalness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.05}
          ior={2.3}
          thickness={2}
          transmission={0.3}
        />
      );
    case "glowing":
      return (
        <meshStandardMaterial
          color={c}
          emissive={c}
          emissiveIntensity={0.8}
          roughness={0.2}
          toneMapped={false}
        />
      );
    case "metallic":
      return <meshStandardMaterial color={c} roughness={0.15} metalness={0.95} envMapIntensity={1.2} />;
    case "stone":
      return <meshStandardMaterial color={c} roughness={0.98} metalness={0.02} />;
    default:
      return <meshStandardMaterial color={c} roughness={0.55} metalness={0.08} envMapIntensity={0.5} />;
  }
}

// ═══════════════ Enhanced Structures ═══════════════

function House({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 2, 2.5]} />
        {getMaterial(color, materialType)}
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[2.2, 1.5, 4]} />
        {getMaterial(new THREE.Color(color).offsetHSL(0, 0, -0.15).getHexString(), materialType)}
      </mesh>
      {/* Chimney */}
      <mesh position={[1.0, 3.2, -0.5]} castShadow>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
        <meshStandardMaterial color="#5a4030" roughness={0.95} />
      </mesh>
      {/* Door with frame */}
      <mesh position={[0, 0.6, 1.26]}>
        <boxGeometry args={[0.7, 1.2, 0.06]} />
        <meshStandardMaterial color="#3a2510" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.6, 1.29]}>
        <boxGeometry args={[0.8, 1.3, 0.02]} />
        <meshStandardMaterial color="#5a4020" roughness={0.9} />
      </mesh>
      {/* Windows with glow */}
      {[[-0.8, 1.3], [0.8, 1.3]].map(([x, y], i) => (
        <group key={i}>
          <mesh position={[x, y, 1.26]}>
            <boxGeometry args={[0.5, 0.5, 0.05]} />
            <meshStandardMaterial color="#87CEEB" emissive="#FFD080" emissiveIntensity={0.6} />
          </mesh>
          <pointLight position={[x, y, 1.4]} color="#FFD080" intensity={0.3} distance={3} />
        </group>
      ))}
      {/* Foundation stones */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[3.3, 0.1, 2.8]} />
        <meshStandardMaterial color="#6a6a5a" roughness={0.95} />
      </mesh>
    </group>
  );
}

function Tower({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 1.1, 5, 12]} />
        {getMaterial(color, materialType)}
      </mesh>
      <mesh position={[0, 5.5, 0]} castShadow>
        <coneGeometry args={[1.3, 2.2, 12]} />
        {getMaterial(new THREE.Color(color).offsetHSL(0, 0, -0.15).getHexString(), materialType)}
      </mesh>
      {/* Flag at top */}
      <mesh position={[0, 7, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.5, 4]} />
        <meshStandardMaterial color="#4a4a4a" />
      </mesh>
      <mesh position={[0.3, 7.5, 0]}>
        <planeGeometry args={[0.6, 0.3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* Windows spiraling up with glow */}
      {[1.2, 2.5, 3.8].map((y, i) => (
        <group key={i}>
          <mesh position={[Math.cos(i * 2.1) * 0.85, y, Math.sin(i * 2.1) * 0.85]} rotation={[0, -i * 2.1, 0]}>
            <boxGeometry args={[0.3, 0.5, 0.1]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.6} toneMapped={false} />
          </mesh>
          <pointLight position={[Math.cos(i * 2.1) * 1.0, y, Math.sin(i * 2.1) * 1.0]} color="#FFD700" intensity={0.2} distance={3} />
        </group>
      ))}
      {/* Stone base */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[1.3, 1.4, 0.1, 12]} />
        <meshStandardMaterial color="#7a7a6a" roughness={0.95} />
      </mesh>
    </group>
  );
}

function Crystal({ color, materialType }: { color: string; materialType: string }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.2;
  });
  return (
    <group ref={groupRef}>
      {/* Main crystal */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <octahedronGeometry args={[1.8, 1]} />
        {getMaterial(color, "crystal")}
      </mesh>
      {/* Satellite crystals */}
      {[[1.5, 1.2, 0.5, 0.8], [-1.0, 0.9, -0.8, 0.6], [0.3, 0.7, -1.2, 0.5], [-0.5, 1.5, 1.0, 0.4]].map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0.2 * i, 0.5 * i, 0.1 * i]} castShadow>
          <octahedronGeometry args={[s, 0]} />
          {getMaterial(color, "crystal")}
        </mesh>
      ))}
      {/* Glow effect */}
      <pointLight position={[0, 2.5, 0]} color={color} intensity={3} distance={12} />
      {/* Base rune ring */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2.2, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent opacity={0.6} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Tree({ color, materialType }: { color: string; materialType: string }) {
  const leavesRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (leavesRef.current) {
      leavesRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.02;
    }
  });
  return (
    <group>
      {/* Trunk with taper */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.3, 3, 8]} />
        <meshStandardMaterial color="#4a2a0a" roughness={0.95} />
      </mesh>
      {/* Branch */}
      <mesh position={[0.5, 2.5, 0.2]} rotation={[0, 0, -0.6]} castShadow>
        <cylinderGeometry args={[0.04, 0.08, 1.2, 5]} />
        <meshStandardMaterial color="#4a2a0a" roughness={0.95} />
      </mesh>
      {/* Foliage layers */}
      <group ref={leavesRef}>
        <mesh position={[0, 3.8, 0]} castShadow>
          <sphereGeometry args={[1.6, 10, 10]} />
          {getMaterial(color || "#2d8b3a", materialType)}
        </mesh>
        <mesh position={[0.7, 3.2, 0.4]} castShadow>
          <sphereGeometry args={[0.9, 8, 8]} />
          {getMaterial(color || "#3a9b4a", materialType)}
        </mesh>
        <mesh position={[-0.5, 3.0, -0.3]} castShadow>
          <sphereGeometry args={[0.7, 8, 8]} />
          {getMaterial(color || "#28783a", materialType)}
        </mesh>
      </group>
      {/* Root bumps */}
      {[0, 1.5, 3, 4.5].map((angle, i) => (
        <mesh key={i} position={[Math.cos(angle) * 0.35, 0.1, Math.sin(angle) * 0.35]}>
          <sphereGeometry args={[0.12, 5, 5]} />
          <meshStandardMaterial color="#3a2008" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function Temple({ color, materialType }: { color: string; materialType: string }) {
  const columns = [
    [-1.8, 0, -1.8], [1.8, 0, -1.8], [-1.8, 0, 1.8], [1.8, 0, 1.8],
    [0, 0, -1.8], [0, 0, 1.8], [-1.8, 0, 0], [1.8, 0, 0],
  ];
  return (
    <group>
      {/* Multi-tiered base */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 0.2, 6]} />
        {getMaterial(color, "stone")}
      </mesh>
      <mesh position={[0, 0.3, 0]} receiveShadow>
        <boxGeometry args={[5.5, 0.2, 5.5]} />
        {getMaterial(color, "stone")}
      </mesh>
      {/* Fluted columns */}
      {columns.map((pos, i) => (
        <group key={i}>
          <mesh position={[pos[0], 2.2, pos[2]]} castShadow>
            <cylinderGeometry args={[0.18, 0.25, 3.8, 12]} />
            {getMaterial(color, materialType)}
          </mesh>
          {/* Column capital */}
          <mesh position={[pos[0], 4.2, pos[2]]}>
            <boxGeometry args={[0.5, 0.15, 0.5]} />
            {getMaterial(color, materialType)}
          </mesh>
        </group>
      ))}
      {/* Ornate roof */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <boxGeometry args={[5.8, 0.3, 5.8]} />
        {getMaterial(color, materialType)}
      </mesh>
      <mesh position={[0, 5.5, 0]} castShadow>
        <coneGeometry args={[3.8, 2, 4]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* Sacred inner fire */}
      <pointLight position={[0, 2, 0]} color={color} intensity={2} distance={8} />
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#FFD700" emissive="#FF8C00" emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Fountain({ color, materialType }: { color: string; materialType: string }) {
  const waterRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (waterRef.current) {
      waterRef.current.scale.y = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.15;
    }
  });
  return (
    <group>
      {/* Basin */}
      <mesh position={[0, 0.3, 0]} receiveShadow>
        <torusGeometry args={[1.8, 0.35, 12, 28]} />
        {getMaterial(color, "stone")}
      </mesh>
      {/* Water surface */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.15, 24]} />
        <meshPhysicalMaterial color="#3a8ab5" transparent opacity={0.6} roughness={0.05} metalness={0.1} />
      </mesh>
      {/* Central pillar */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.2, 2.2, 10]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* Water spout (animated) */}
      <mesh ref={waterRef} position={[0, 2.5, 0]}>
        <coneGeometry args={[0.15, 0.8, 8]} />
        <meshPhysicalMaterial color="#6ab8e0" transparent opacity={0.5} emissive="#4a98c0" emissiveIntensity={0.3} />
      </mesh>
      {/* Decorative sphere top */}
      <mesh position={[0, 2.8, 0]}>
        <sphereGeometry args={[0.25, 10, 10]} />
        {getMaterial(color, "glowing")}
      </mesh>
      <pointLight position={[0, 1.5, 0]} color="#6ab8e0" intensity={1} distance={6} />
    </group>
  );
}

function Castle({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      {/* Main keep */}
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 6, 5]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* 4 corner towers */}
      {[[-3, 0, -3], [3, 0, -3], [-3, 0, 3], [3, 0, 3]].map((pos, i) => (
        <group key={i}>
          <mesh position={[pos[0], 3.5, pos[2]]} castShadow>
            <cylinderGeometry args={[0.8, 0.9, 7, 10]} />
            {getMaterial(color, materialType)}
          </mesh>
          <mesh position={[pos[0], 7.5, pos[2]]} castShadow>
            <coneGeometry args={[1.1, 1.8, 10]} />
            {getMaterial(new THREE.Color(color).offsetHSL(0, 0, -0.2).getHexString(), materialType)}
          </mesh>
          {/* Tower window */}
          <mesh position={[pos[0] + (pos[0] > 0 ? 0.82 : -0.82), 4.5, pos[2]]}>
            <boxGeometry args={[0.1, 0.6, 0.3]} />
            <meshStandardMaterial color="#FFD080" emissive="#FFD080" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
      {/* Grand gate */}
      <mesh position={[0, 1.5, 2.51]} castShadow>
        <boxGeometry args={[1.5, 3, 0.12]} />
        <meshStandardMaterial color="#2a1a08" roughness={0.85} />
      </mesh>
      {/* Gate arch */}
      <mesh position={[0, 3.2, 2.51]}>
        <torusGeometry args={[0.75, 0.1, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#5a5a4a" roughness={0.8} />
      </mesh>
      {/* Battlements */}
      {[-2, -1, 0, 1, 2].map((x, i) => (
        <mesh key={i} position={[x, 6.3, 2.5]} castShadow>
          <boxGeometry args={[0.5, 0.7, 0.5]} />
          {getMaterial(color, materialType)}
        </mesh>
      ))}
      {/* Banner */}
      <mesh position={[0, 7, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 2, 4]} />
        <meshStandardMaterial color="#4a4a4a" />
      </mesh>
      <mesh position={[0.4, 7.6, 0]}>
        <planeGeometry args={[0.8, 0.5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* Keep windows glow */}
      <pointLight position={[0, 4, 2.8]} color="#FFD080" intensity={0.5} distance={5} />
    </group>
  );
}

function Pyramid({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <coneGeometry args={[3.5, 5, 4]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* Eye of power at apex */}
      <mesh position={[0, 5.5, 0]}>
        <sphereGeometry args={[0.25, 10, 10]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 5.5, 0]} color="#FFD700" intensity={3} distance={15} />
      {/* Base entrance */}
      <mesh position={[0, 0.5, 2.5]}>
        <boxGeometry args={[1, 1, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

function Portal({ color, materialType }: { color: string; materialType: string }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) ringRef.current.rotation.z += 0.008;
    if (innerRef.current) {
      (innerRef.current.material as THREE.MeshStandardMaterial).opacity = 0.3 + Math.sin(t * 2) * 0.15;
    }
  });
  return (
    <group>
      {/* Outer ring */}
      <mesh ref={ringRef} position={[0, 3, 0]} castShadow>
        <torusGeometry args={[2.2, 0.3, 16, 36]} />
        {getMaterial(color, "glowing")}
      </mesh>
      {/* Inner vortex */}
      <mesh ref={innerRef} position={[0, 3, 0]}>
        <circleGeometry args={[1.9, 36]} />
        <meshStandardMaterial color={color} transparent opacity={0.35} emissive={color} emissiveIntensity={1.2} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {/* Runic pillars */}
      {[[-2.5, 0], [2.5, 0]].map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, 1.8, z]} castShadow>
            <cylinderGeometry args={[0.25, 0.35, 3.6, 8]} />
            {getMaterial(color, "stone")}
          </mesh>
          {/* Rune glow on pillar */}
          <mesh position={[x + (x > 0 ? 0.27 : -0.27), 2, z]}>
            <boxGeometry args={[0.02, 1.5, 0.2]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, 3, 0]} color={color} intensity={4} distance={15} />
    </group>
  );
}

function Obelisk({ color, materialType }: { color: string; materialType: string }) {
  const glowRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (glowRef.current) glowRef.current.intensity = 1.5 + Math.sin(clock.getElapsedTime() * 1.5) * 0.8;
  });
  return (
    <group>
      <mesh position={[0, 3.5, 0]} castShadow>
        <boxGeometry args={[0.7, 7, 0.7]} />
        {getMaterial(color, materialType)}
      </mesh>
      <mesh position={[0, 7.3, 0]} castShadow>
        <coneGeometry args={[0.55, 1, 4]} />
        {getMaterial(color, "metallic")}
      </mesh>
      {/* Rune inscriptions */}
      {[2, 3.5, 5].map((y, i) => (
        <mesh key={i} position={[0.36, y, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.02, 0.4, 0.3]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[1.4, 0.2, 1.4]} />
        {getMaterial(color, "stone")}
      </mesh>
      <pointLight ref={glowRef} position={[0, 7.5, 0]} color={color} intensity={2} distance={10} />
    </group>
  );
}

function Dome({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.8, 2.8, 1.2, 20]} />
        {getMaterial(color, materialType)}
      </mesh>
      <mesh position={[0, 3, 0]} castShadow>
        <sphereGeometry args={[2.8, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {getMaterial(color, materialType === "standard" ? "crystal" : materialType)}
      </mesh>
      {/* Skylight at top */}
      <mesh position={[0, 3.8, 0]}>
        <sphereGeometry args={[0.3, 10, 10]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 2, 0]} color={color} intensity={0.8} distance={6} />
    </group>
  );
}

function Bridge({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      {/* Arched deck */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[9, 0.35, 2.5]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* Stone railings */}
      {[1.2, -1.2].map((z, i) => (
        <mesh key={i} position={[0, 2.4, z]}>
          <boxGeometry args={[9, 1, 0.12]} />
          {getMaterial(color, materialType)}
        </mesh>
      ))}
      {/* Arch supports */}
      {[-3, 0, 3].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.9, 0]}>
            <cylinderGeometry args={[0.25, 0.35, 1.8, 8]} />
            {getMaterial(color, "stone")}
          </mesh>
        </group>
      ))}
      {/* Lanterns on railing */}
      {[-3.5, 0, 3.5].map((x, i) => (
        <group key={`l${i}`}>
          <mesh position={[x, 3.2, 1.2]}>
            <boxGeometry args={[0.2, 0.3, 0.2]} />
            <meshStandardMaterial color="#FFD700" emissive="#FF8C00" emissiveIntensity={1} toneMapped={false} />
          </mesh>
          <pointLight position={[x, 3.2, 1.2]} color="#FF8C00" intensity={0.5} distance={4} />
        </group>
      ))}
    </group>
  );
}

function Garden({ color, materialType }: { color: string; materialType: string }) {
  const flowerColors = ["#ff69b4", "#ff4500", "#ffd700", "#9370db", "#00ced1", "#ff6347", "#da70d6", "#7fffd4"];
  const flowers = Array.from({ length: 16 }, (_, i) => ({
    x: Math.sin(i * 1.3 + 0.5) * (1.5 + Math.cos(i * 0.7) * 1),
    z: Math.cos(i * 1.1 + 0.3) * (1.5 + Math.sin(i * 0.9) * 1),
    color: flowerColors[i % flowerColors.length],
    scale: 0.25 + Math.random() * 0.35,
    height: 0.5 + Math.random() * 0.8,
  }));
  return (
    <group>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[3.2, 3.2, 0.06, 20]} />
        <meshStandardMaterial color="#2a4a1a" roughness={0.95} />
      </mesh>
      {flowers.map((f, i) => (
        <group key={i} position={[f.x, 0.05, f.z]}>
          <mesh position={[0, f.height * 0.5, 0]}>
            <cylinderGeometry args={[0.015, 0.02, f.height, 4]} />
            <meshStandardMaterial color="#2a5a1a" />
          </mesh>
          <mesh position={[0, f.height, 0]}>
            <sphereGeometry args={[f.scale * 0.5, 6, 6]} />
            <meshStandardMaterial color={f.color} emissive={f.color} emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}
      {/* Stone border */}
      <mesh position={[0, 0.12, 0]}>
        <torusGeometry args={[3.2, 0.18, 8, 28]} />
        <meshStandardMaterial color="#8a8a7a" roughness={0.92} />
      </mesh>
      {/* Central birdbath / ornament */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 1, 8]} />
        {getMaterial(color, "stone")}
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshPhysicalMaterial color="#6ab8e0" transparent opacity={0.5} roughness={0.05} />
      </mesh>
    </group>
  );
}

function Lighthouse({ color, materialType }: { color: string; materialType: string }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const beamRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lightRef.current) lightRef.current.intensity = 3 + Math.sin(t * 2) * 2;
    if (beamRef.current) beamRef.current.rotation.y = t * 0.8;
  });
  return (
    <group>
      <mesh position={[0, 4.5, 0]} castShadow>
        <cylinderGeometry args={[0.5, 1.2, 9, 10]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* Observation deck */}
      <mesh position={[0, 9.2, 0]}>
        <cylinderGeometry args={[0.9, 0.7, 1.2, 10]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Light housing */}
      <mesh position={[0, 10, 0]}>
        <sphereGeometry args={[0.45, 10, 10]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      {/* Rotating beam */}
      <group ref={beamRef} position={[0, 10, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[3, 25, 6, 1, true]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.04} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
      <pointLight ref={lightRef} position={[0, 10, 0]} color="#FFD700" intensity={4} distance={40} />
      {/* Stripes */}
      {[2, 4, 6].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[0.85 - y * 0.04, 0.9 - y * 0.04, 0.3, 10]} />
          <meshStandardMaterial color="#cc2222" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Shrine({ color, materialType }: { color: string; materialType: string }) {
  const flameRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flameRef.current) {
      flameRef.current.scale.y = 1 + Math.sin(clock.getElapsedTime() * 5) * 0.3;
      flameRef.current.scale.x = 1 + Math.cos(clock.getElapsedTime() * 4) * 0.15;
    }
  });
  return (
    <group>
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[1.8, 1.8, 0.15, 8]} />
        {getMaterial(color, "stone")}
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[0.9, 1.4, 0.9]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* Sacred flame */}
      <mesh ref={flameRef} position={[0, 2, 0]}>
        <coneGeometry args={[0.15, 0.5, 6]} />
        <meshStandardMaterial color="#FF6600" emissive="#FF4400" emissiveIntensity={3} transparent opacity={0.9} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 2, 0]} color="#FF6600" intensity={2.5} distance={8} />
      {/* Offering bowls */}
      {[[0.8, 0], [-0.8, 0], [0, 0.8], [0, -0.8]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.2, z]}>
          <cylinderGeometry args={[0.15, 0.12, 0.1, 8]} />
          <meshStandardMaterial color="#8a7a5a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Statue({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      {/* Pedestal */}
      <mesh position={[0, 0.4, 0]} receiveShadow>
        <boxGeometry args={[1.4, 0.8, 1.4]} />
        {getMaterial(color, "stone")}
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.38, 2, 10]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* Head */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <sphereGeometry args={[0.32, 10, 10]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* Arms */}
      <mesh position={[0.55, 2.3, 0]} rotation={[0, 0, -0.4]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 1.1, 6]} />
        {getMaterial(color, materialType)}
      </mesh>
      <mesh position={[-0.55, 2.3, 0]} rotation={[0, 0, 0.4]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 1.1, 6]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* Held orb */}
      <mesh position={[-0.8, 2.8, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function Arch({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      <mesh position={[-1.8, 2.2, 0]} castShadow>
        <boxGeometry args={[0.55, 4.4, 0.55]} />
        {getMaterial(color, materialType)}
      </mesh>
      <mesh position={[1.8, 2.2, 0]} castShadow>
        <boxGeometry args={[0.55, 4.4, 0.55]} />
        {getMaterial(color, materialType)}
      </mesh>
      <mesh position={[0, 4.6, 0]} castShadow>
        <torusGeometry args={[1.8, 0.28, 10, 18, Math.PI]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* Keystone */}
      <mesh position={[0, 4.9, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        {getMaterial(color, "glowing")}
      </mesh>
      <pointLight position={[0, 4.9, 0]} color={color} intensity={1} distance={5} />
    </group>
  );
}

function Mountain({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      <mesh position={[0, 5, 0]} castShadow receiveShadow>
        <coneGeometry args={[6, 10, 8]} />
        {getMaterial(color || "#6a6a5a", "stone")}
      </mesh>
      <mesh position={[0, 9, 0]} castShadow>
        <coneGeometry args={[2, 3, 8]} />
        <meshStandardMaterial color="#e8e8f0" roughness={0.6} />
      </mesh>
      <mesh position={[4, 3, 1.5]} castShadow>
        <coneGeometry args={[3.5, 6, 6]} />
        {getMaterial(color || "#5a5a4a", "stone")}
      </mesh>
      <mesh position={[-3, 2, -2]} castShadow>
        <coneGeometry args={[2.5, 4, 5]} />
        {getMaterial(color || "#5a5a4a", "stone")}
      </mesh>
      {/* Snow patches */}
      <mesh position={[4, 5.5, 1.5]}>
        <coneGeometry args={[1.2, 1.5, 6]} />
        <meshStandardMaterial color="#e8e8f0" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Wall({ color, materialType }: { color: string; materialType: string }) {
  return (
    <group>
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 4, 0.6]} />
        {getMaterial(color, materialType)}
      </mesh>
      {/* Crenellations */}
      {[-2.5, -1.2, 0, 1.2, 2.5].map((x, i) => (
        <mesh key={i} position={[x, 4.3, 0]} castShadow>
          <boxGeometry args={[0.55, 0.7, 0.6]} />
          {getMaterial(color, materialType)}
        </mesh>
      ))}
      {/* Arrow slits */}
      {[-1.8, 0, 1.8].map((x, i) => (
        <mesh key={`s${i}`} position={[x, 2.5, 0.31]}>
          <boxGeometry args={[0.08, 0.6, 0.02]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
      {/* Torch */}
      <mesh position={[0, 3, 0.35]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 5]} />
        <meshStandardMaterial color="#5a4020" />
      </mesh>
      <pointLight position={[0, 3.3, 0.5]} color="#FF8C00" intensity={0.8} distance={4} />
    </group>
  );
}

// ═══════════════ Factory ═══════════════

const STRUCTURE_COMPONENTS: Record<string, React.FC<{ color: string; materialType: string }>> = {
  house: House, tower: Tower, crystal: Crystal, tree: Tree,
  temple: Temple, fountain: Fountain, castle: Castle, pyramid: Pyramid,
  portal: Portal, obelisk: Obelisk, dome: Dome, bridge: Bridge,
  garden: Garden, lighthouse: Lighthouse, shrine: Shrine,
  statue: Statue, arch: Arch, mountain: Mountain, wall: Wall,
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
      <Html
        position={[0, data.structure_type === "castle" ? 10 : data.structure_type === "mountain" ? 12 : data.structure_type === "lighthouse" ? 12 : 6, 0]}
        center
        distanceFactor={20}
      >
        <div className="bg-background/80 backdrop-blur-sm border border-border rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap shadow-lg pointer-events-none">
          {data.name}
        </div>
      </Html>
    </group>
  );
}
