import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";

interface WorldEnvironmentProps {
  skyPreset?: string;
  ambientColor?: string;
  backgroundImageUrl?: string | null;
}

const SKY_PRESETS: Record<string, {
  sunPosition: [number, number, number];
  turbidity: number;
  rayleigh: number;
  mieCoefficient: number;
  fogColor: string;
  fogNear: number;
  fogFar: number;
}> = {
  dawn: {
    sunPosition: [50, 5, 100], turbidity: 4, rayleigh: 2, mieCoefficient: 0.01,
    fogColor: "#d4a574", fogNear: 30, fogFar: 150,
  },
  day: {
    sunPosition: [100, 60, 100], turbidity: 2, rayleigh: 0.5, mieCoefficient: 0.005,
    fogColor: "#b8d4e8", fogNear: 50, fogFar: 180,
  },
  sunset: {
    sunPosition: [100, 8, 50], turbidity: 8, rayleigh: 3, mieCoefficient: 0.02,
    fogColor: "#c8856a", fogNear: 25, fogFar: 120,
  },
  twilight: {
    sunPosition: [50, 2, 100], turbidity: 10, rayleigh: 4, mieCoefficient: 0.03,
    fogColor: "#5a4a6a", fogNear: 20, fogFar: 100,
  },
  night: {
    sunPosition: [-100, -10, 50], turbidity: 0.5, rayleigh: 0.1, mieCoefficient: 0.001,
    fogColor: "#1a1a2e", fogNear: 15, fogFar: 80,
  },
  mystical: {
    sunPosition: [80, 15, 60], turbidity: 6, rayleigh: 5, mieCoefficient: 0.015,
    fogColor: "#6a4a8a", fogNear: 20, fogFar: 110,
  },
  ethereal: {
    sunPosition: [60, 25, 80], turbidity: 3, rayleigh: 1.5, mieCoefficient: 0.008,
    fogColor: "#8ab4c8", fogNear: 35, fogFar: 140,
  },
};


export function WorldEnvironment({
  skyPreset = "sunset",
  ambientColor = "#7c3aed",
  backgroundImageUrl = null,
}: WorldEnvironmentProps) {
  const preset = SKY_PRESETS[skyPreset] || SKY_PRESETS.sunset;
  const sunLightRef = useRef<THREE.DirectionalLight>(null);

  return (
    <>
      {!backgroundImageUrl && (
        <Sky
          sunPosition={preset.sunPosition}
          turbidity={preset.turbidity}
          rayleigh={preset.rayleigh}
          mieCoefficient={preset.mieCoefficient}
          mieDirectionalG={0.85}
        />
      )}

      

      {/* Main ambient - slightly warm */}
      <ambientLight intensity={0.35} color="#ffe8d0" />

      {/* Primary sun light with high-res shadows */}
      <directionalLight
        ref={sunLightRef}
        position={[preset.sunPosition[0] * 0.5, preset.sunPosition[1] + 30, preset.sunPosition[2] * 0.5]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={150}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0001}
        color="#fff5e0"
      />

      {/* Secondary fill light from opposite side */}
      <directionalLight
        position={[-30, 20, -30]}
        intensity={0.3}
        color="#b0c8ff"
      />

      {/* Colored accent light from theme */}
      <pointLight position={[0, 15, 0]} color={ambientColor} intensity={0.4} distance={60} />

      {/* Hemisphere for natural sky/ground bounce */}
      <hemisphereLight args={["#87ceeb", "#3a5a2a", 0.35]} />

      {/* Atmospheric fog matching sky preset */}
      <fog attach="fog" args={[preset.fogColor, preset.fogNear, preset.fogFar]} />
    </>
  );
}

// Enhanced floating particles - fireflies / dust motes
export function WorldParticles({ count = 400 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const szs = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = Math.random() * 15 + 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
      szs[i] = 0.08 + Math.random() * 0.2;
    }
    return { positions: pos, sizes: szs };
  }, [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position;
    const time = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      // Spiral float pattern
      pos.array[idx] += Math.sin(time * 0.3 + i * 0.7) * 0.008;
      pos.array[idx + 1] += Math.sin(time * 0.5 + i) * 0.004;
      pos.array[idx + 2] += Math.cos(time * 0.4 + i * 0.5) * 0.008;
      if (pos.array[idx + 1] > 18) pos.array[idx + 1] = 1;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        color="#ffe4a8"
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Volumetric light rays (god rays approximation)
export function GodRays({ sunPosition = [100, 30, 50] }: { sunPosition?: number[] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.04 + Math.sin(clock.getElapsedTime() * 0.3) * 0.02;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[sunPosition[0] * 0.3, sunPosition[1] * 0.5, sunPosition[2] * 0.3]}
      rotation={[0, Math.atan2(sunPosition[0], sunPosition[2]), 0]}
    >
      <coneGeometry args={[30, 80, 8, 1, true]} />
      <meshBasicMaterial
        color="#fff5d0"
        transparent
        opacity={0.05}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// Weather particles
export function WeatherParticles({ type = "fireflies", count = 150 }: { type?: string; count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 25 + 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    return pos;
  }, [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position;
    const time = clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      if (type === "fireflies") {
        pos.array[idx] += Math.sin(time * 1.5 + i * 2.1) * 0.02;
        pos.array[idx + 1] += Math.cos(time * 1.2 + i * 1.7) * 0.015;
        pos.array[idx + 2] += Math.sin(time * 0.9 + i * 3.1) * 0.02;
      } else if (type === "rain") {
        pos.array[idx + 1] -= 0.3;
        if (pos.array[idx + 1] < 0) pos.array[idx + 1] = 25;
      } else if (type === "snow") {
        pos.array[idx + 1] -= 0.05;
        pos.array[idx] += Math.sin(time + i) * 0.01;
        if (pos.array[idx + 1] < 0) pos.array[idx + 1] = 25;
      }
    }
    pos.needsUpdate = true;
  });

  const particleColor = type === "fireflies" ? "#ffd700" : type === "rain" ? "#a0c0e0" : "#e8e8f0";

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={type === "fireflies" ? 0.15 : type === "rain" ? 0.08 : 0.12}
        color={particleColor}
        transparent
        opacity={type === "fireflies" ? 0.9 : 0.5}
        sizeAttenuation
        blending={type === "fireflies" ? THREE.AdditiveBlending : THREE.NormalBlending}
        depthWrite={false}
      />
    </points>
  );
}
