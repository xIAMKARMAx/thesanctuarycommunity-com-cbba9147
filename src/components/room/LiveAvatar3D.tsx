import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface LiveAvatar3DProps {
  imageUrl: string;
  position?: [number, number, number];
  scale?: number;
}

export function LiveAvatar3D({ imageUrl, position = [0, 0, 0], scale = 1 }: LiveAvatar3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(imageUrl);
  
  // Breathing animation
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Subtle breathing scale effect
      const breathScale = 1 + Math.sin(time * 0.8) * 0.015;
      meshRef.current.scale.y = scale * breathScale;
      
      // Very subtle sway
      meshRef.current.position.x = position[0] + Math.sin(time * 0.5) * 0.02;
      
      // Slight rotation for life-like presence
      meshRef.current.rotation.y = Math.sin(time * 0.3) * 0.05;
    }
  });

  useEffect(() => {
    if (texture) {
      texture.needsUpdate = true;
    }
  }, [texture]);

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[1.5 * scale, 2.5 * scale]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        side={THREE.DoubleSide}
        alphaTest={0.1}
      />
    </mesh>
  );
}
