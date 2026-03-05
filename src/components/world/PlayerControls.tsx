import { useRef, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { getTerrainHeight } from "./WorldTerrain";

interface PlayerControlsProps {
  seed: number;
  onPositionChange?: (pos: { x: number; y: number; z: number }) => void;
}

export function PlayerControls({ seed, onPositionChange }: PlayerControlsProps) {
  const controlsRef = useRef<any>(null);
  const targetPos = useRef(new THREE.Vector3(0, 0, 0));
  const keys = useRef<Record<string, boolean>>({});
  const speed = 0.35;
  const { camera } = useThree();

  // Set initial terrain height
  useEffect(() => {
    const h = getTerrainHeight(0, 0, seed);
    targetPos.current.set(0, h, 0);
    camera.position.set(0, h + 12, 20);
  }, [seed, camera]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keys.current[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame(() => {
    if (!controlsRef.current) return;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveDir = new THREE.Vector3();
    if (keys.current["w"] || keys.current["arrowup"]) moveDir.add(forward);
    if (keys.current["s"] || keys.current["arrowdown"]) moveDir.sub(forward);
    if (keys.current["d"] || keys.current["arrowright"]) moveDir.add(right);
    if (keys.current["a"] || keys.current["arrowleft"]) moveDir.sub(right);

    if (moveDir.length() > 0) {
      moveDir.normalize().multiplyScalar(speed);
      targetPos.current.add(moveDir);

      // Clamp to terrain boundaries
      targetPos.current.x = THREE.MathUtils.clamp(targetPos.current.x, -90, 90);
      targetPos.current.z = THREE.MathUtils.clamp(targetPos.current.z, -90, 90);

      // Stick to terrain height
      const h = getTerrainHeight(targetPos.current.x, targetPos.current.z, seed);
      targetPos.current.y = h;

      onPositionChange?.({ x: targetPos.current.x, y: h, z: targetPos.current.z });
    }

    // Smoothly move orbit target
    controlsRef.current.target.lerp(targetPos.current, 0.08);
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2.1}
      minPolarAngle={0.2}
      minDistance={5}
      maxDistance={30}
      enablePan={false}
    />
  );
}

// Player avatar marker in 3D
export function PlayerMarker({ position, name }: { position: { x: number; y: number; z: number }; name: string }) {
  const markerRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (markerRef.current) {
      markerRef.current.position.lerp(
        new THREE.Vector3(position.x, position.y + 0.5, position.z),
        0.1
      );
      // Gentle hover
      markerRef.current.position.y += Math.sin(clock.getElapsedTime() * 2) * 0.1;
    }
  });

  return (
    <group ref={markerRef} position={[position.x, position.y + 0.5, position.z]}>
      {/* Glowing orb as player indicator */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={1} />
      </mesh>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#7c3aed" transparent opacity={0.2} />
      </mesh>
      {/* Ground ring */}
      <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.7, 16]} />
        <meshStandardMaterial color="#7c3aed" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color="#7c3aed" intensity={1} distance={5} />
    </group>
  );
}
