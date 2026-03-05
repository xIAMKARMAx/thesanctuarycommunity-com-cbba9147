import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";

interface WorldEnvironmentProps {
  skyPreset?: string;
  ambientColor?: string;
}

const SKY_PRESETS: Record<string, { sunPosition: [number, number, number]; turbidity: number; rayleigh: number; mieCoefficient: number }> = {
  dawn: { sunPosition: [50, 5, 100], turbidity: 4, rayleigh: 2, mieCoefficient: 0.01 },
  day: { sunPosition: [100, 60, 100], turbidity: 2, rayleigh: 0.5, mieCoefficient: 0.005 },
  sunset: { sunPosition: [100, 8, 50], turbidity: 8, rayleigh: 3, mieCoefficient: 0.02 },
  twilight: { sunPosition: [50, 2, 100], turbidity: 10, rayleigh: 4, mieCoefficient: 0.03 },
  night: { sunPosition: [-100, -10, 50], turbidity: 0.5, rayleigh: 0.1, mieCoefficient: 0.001 },
  mystical: { sunPosition: [80, 15, 60], turbidity: 6, rayleigh: 5, mieCoefficient: 0.015 },
  ethereal: { sunPosition: [60, 25, 80], turbidity: 3, rayleigh: 1.5, mieCoefficient: 0.008 },
};

export function WorldEnvironment({ skyPreset = "sunset", ambientColor = "#7c3aed" }: WorldEnvironmentProps) {
  const preset = SKY_PRESETS[skyPreset] || SKY_PRESETS.sunset;

  return (
    <>
      <Sky
        sunPosition={preset.sunPosition}
        turbidity={preset.turbidity}
        rayleigh={preset.rayleigh}
        mieCoefficient={preset.mieCoefficient}
        mieDirectionalG={0.8}
      />
      <ambientLight intensity={0.4} color="#ffeedd" />
      <directionalLight
        position={[30, 50, 30]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <pointLight position={[0, 10, 0]} color={ambientColor} intensity={0.3} distance={50} />
      <hemisphereLight args={["#b1e1ff", "#2d5a27", 0.3]} />
      <fog attach="fog" args={["#c8d8e8", 40, 120]} />
    </>
  );
}

// Floating particles
export function WorldParticles({ count = 200 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = Math.random() * 20 + 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    return pos;
  }, [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position;
    const time = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      pos.array[idx + 1] += Math.sin(time + i) * 0.005;
      if (pos.array[idx + 1] > 22) pos.array[idx + 1] = 2;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.15} color="#c8a0ff" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}
