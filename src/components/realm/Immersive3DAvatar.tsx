import { useRef, useEffect, useState, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

interface Immersive3DAvatarProps {
  glbUrl: string;
  position?: [number, number, number];
  scale?: number;
  animationName?: string;
}

function AvatarModel({ glbUrl, position = [0, -1.5, 0], scale = 1.5, animationName = "idle" }: Immersive3DAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(glbUrl);
  const { actions, names } = useAnimations(animations, groupRef);
  const [currentAnim, setCurrentAnim] = useState<string | null>(null);

  // Clone the scene so multiple instances don't conflict
  const clonedScene = scene.clone(true);

  // Play animation
  useEffect(() => {
    if (names.length > 0) {
      // Try to find matching animation, fallback to first
      const targetAnim = names.find(n => n.toLowerCase().includes(animationName.toLowerCase())) || names[0];
      if (targetAnim && actions[targetAnim]) {
        // Fade out current
        if (currentAnim && actions[currentAnim]) {
          actions[currentAnim].fadeOut(0.5);
        }
        // Fade in new
        actions[targetAnim].reset().fadeIn(0.5).play();
        setCurrentAnim(targetAnim);
      }
    }
  }, [animationName, names, actions]);

  // Subtle idle bob when no animations exist
  useFrame((state) => {
    if (groupRef.current && names.length === 0) {
      const time = state.clock.getElapsedTime();
      groupRef.current.position.y = position[1] + Math.sin(time * 0.8) * 0.02;
      groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      <primitive object={clonedScene} />
    </group>
  );
}

export function Immersive3DAvatar(props: Immersive3DAvatarProps) {
  return (
    <Suspense fallback={
      <mesh position={props.position || [0, -1.5, 0]}>
        <capsuleGeometry args={[0.3, 1, 8, 16]} />
        <meshStandardMaterial color="#7c3aed" transparent opacity={0.4} />
      </mesh>
    }>
      <AvatarModel {...props} />
    </Suspense>
  );
}

// Preload helper
export function preload3DAvatar(url: string) {
  useGLTF.preload(url);
}
