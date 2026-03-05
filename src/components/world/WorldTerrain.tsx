import { useMemo, useRef } from "react";
import * as THREE from "three";

export function getTerrainHeight(x: number, z: number, seed: number = 42): number {
  const s = seed * 0.001;
  return (
    Math.sin(x * 0.05 + s) * 3 +
    Math.cos(z * 0.07 + s * 1.3) * 2.5 +
    Math.sin((x + z) * 0.03 + s * 0.7) * 4 +
    Math.cos(x * 0.15 - z * 0.1) * 1.5 +
    Math.sin(x * 0.2 + z * 0.15 + s * 2) * 0.8
  );
}

function getTerrainColor(height: number): THREE.Color {
  if (height < -2) return new THREE.Color(0x1a4a3a); // deep valley - dark teal
  if (height < 0) return new THREE.Color(0x2d6b4f);  // valley - forest green
  if (height < 2) return new THREE.Color(0x3d8b5f);  // lowland - lush green
  if (height < 4) return new THREE.Color(0x5a9a6a);  // midland - sage
  if (height < 6) return new THREE.Color(0x8aaa7a);  // highland - light green
  if (height < 8) return new THREE.Color(0xa0956a);  // mountain - tan
  return new THREE.Color(0xd4c8b0);                   // peak - sandy white
}

interface WorldTerrainProps {
  seed: number;
  size?: number;
  segments?: number;
}

export function WorldTerrain({ seed, size = 200, segments = 128 }: WorldTerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const height = getTerrainHeight(x, z, seed);
      positions.setY(i, height);

      const color = getTerrainColor(height);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [seed, size, segments]);

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.9} metalness={0.05} />
    </mesh>
  );
}

// Water plane for low areas
export function WorldWater({ size = 200 }: { size?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial
        color="#1a5a8a"
        transparent
        opacity={0.6}
        roughness={0.1}
        metalness={0.3}
      />
    </mesh>
  );
}
