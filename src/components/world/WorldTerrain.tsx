import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
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

// Multi-layered terrain coloring with biome blending
function getTerrainColor(height: number, nx: number, nz: number): THREE.Color {
  // Add subtle variation based on position for natural look
  const variation = Math.sin(nx * 0.3) * 0.03 + Math.cos(nz * 0.25) * 0.03;

  if (height < -3) return new THREE.Color().setHSL(0.52, 0.5, 0.12 + variation); // deep water bed
  if (height < -1.5) return new THREE.Color().setHSL(0.38, 0.45, 0.18 + variation); // dark wetland
  if (height < 0) return new THREE.Color().setHSL(0.35, 0.55, 0.22 + variation); // marsh
  if (height < 1.5) return new THREE.Color().setHSL(0.33, 0.6, 0.28 + variation); // lush meadow
  if (height < 3) return new THREE.Color().setHSL(0.3, 0.5, 0.32 + variation); // grassland
  if (height < 5) return new THREE.Color().setHSL(0.28, 0.4, 0.36 + variation); // highland
  if (height < 7) return new THREE.Color().setHSL(0.1, 0.35, 0.42 + variation); // rocky
  if (height < 9) return new THREE.Color().setHSL(0.08, 0.25, 0.52 + variation); // mountain stone
  return new THREE.Color().setHSL(0.65, 0.1, 0.85 + variation); // snow cap
}

interface WorldTerrainProps {
  seed: number;
  size?: number;
  segments?: number;
}

export function WorldTerrain({ seed, size = 200, segments = 200 }: WorldTerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const uvs = geo.attributes.uv;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const height = getTerrainHeight(x, z, seed);
      positions.setY(i, height);

      const color = getTerrainColor(height, x, z);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [seed, size, segments]);

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.85}
        metalness={0.02}
        envMapIntensity={0.4}
      />
    </mesh>
  );
}

// Animated water with displacement and reflections
export function WorldWater({ size = 200 }: { size?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const waterShader = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color("#0a3d5c") },
      uColor2: { value: new THREE.Color("#1a6b8a") },
      uOpacity: { value: 0.75 },
    },
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying float vWave;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float wave1 = sin(pos.x * 0.15 + uTime * 0.8) * 0.3;
        float wave2 = cos(pos.y * 0.12 + uTime * 0.6) * 0.2;
        float wave3 = sin((pos.x + pos.y) * 0.1 + uTime * 1.2) * 0.15;
        pos.z += wave1 + wave2 + wave3;
        vWave = wave1 + wave2;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform float uOpacity;
      uniform float uTime;
      varying vec2 vUv;
      varying float vWave;
      void main() {
        float foam = smoothstep(0.3, 0.5, vWave);
        vec3 color = mix(uColor1, uColor2, vUv.x * 0.5 + vWave * 0.3);
        // Specular-like highlight
        float specular = pow(max(0.0, sin(vUv.x * 20.0 + uTime) * sin(vUv.y * 20.0 + uTime * 0.7)), 8.0) * 0.3;
        color += vec3(specular);
        // Foam at wave peaks
        color = mix(color, vec3(0.8, 0.9, 1.0), foam * 0.3);
        gl_FragColor = vec4(color, uOpacity);
      }
    `,
  }), []);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
      <planeGeometry args={[size, size, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        args={[waterShader]}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// Scattered grass blades using instanced meshes
export function WorldGrass({ seed, count = 3000 }: { seed: number; count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 120;
      const z = (Math.random() - 0.5) * 120;
      const h = getTerrainHeight(x, z, seed);

      // Only place grass on mid-height terrain
      if (h < -1 || h > 6) {
        dummy.position.set(0, -100, 0); // hide
      } else {
        dummy.position.set(x, h, z);
        dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
        const scale = 0.3 + Math.random() * 0.5;
        dummy.scale.set(scale * 0.3, scale, scale * 0.3);
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Varied green tones
      color.setHSL(0.28 + Math.random() * 0.08, 0.5 + Math.random() * 0.2, 0.25 + Math.random() * 0.15);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.geometry.setAttribute("color", new THREE.InstancedBufferAttribute(colors, 3));
  }, [seed, count]);

  // Animate grass sway
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const time = clock.getElapsedTime();
    const dummy = new THREE.Object3D();

    // Only update a subset each frame for performance
    const updateCount = Math.min(200, count);
    for (let i = 0; i < updateCount; i++) {
      const idx = (Math.floor(time * 50) + i) % count;
      meshRef.current.getMatrixAt(idx, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

      if (dummy.position.y > -50) {
        dummy.rotation.z = Math.sin(time * 2 + dummy.position.x * 0.5) * 0.15;
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx, dummy.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
      <coneGeometry args={[0.05, 0.6, 3]} />
      <meshStandardMaterial vertexColors roughness={0.9} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}
