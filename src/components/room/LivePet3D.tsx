import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface LivePet3DProps {
  imageUrl: string;
  position?: [number, number, number];
  scale?: number;
}

export function LivePet3D({ imageUrl, position = [0, 0, 0], scale = 1 }: LivePet3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(imageUrl);
  
  // Pet breathing and movement animation
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Faster breathing than avatar (pets breathe faster)
      const breathScale = 1 + Math.sin(time * 1.2) * 0.025;
      meshRef.current.scale.y = scale * breathScale;
      meshRef.current.scale.x = scale * (1 + Math.sin(time * 1.2) * 0.01);
      
      // Subtle idle movement
      meshRef.current.position.y = position[1] + Math.sin(time * 0.8) * 0.03;
      meshRef.current.position.x = position[0] + Math.cos(time * 0.6) * 0.02;
      
      // Slight head tilt effect
      meshRef.current.rotation.z = Math.sin(time * 0.4) * 0.08;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[0.8 * scale, 0.8 * scale]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        side={THREE.DoubleSide}
        alphaTest={0.1}
      />
    </mesh>
  );
}
