import { useRef, useEffect, useState } from 'react';
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
  const [dimensions, setDimensions] = useState<[number, number]>([0.8, 0.8]);

  // Pet breathing and movement animation
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Faster breathing than avatar (pets breathe faster)
      const breathScaleY = 1 + Math.sin(time * 1.2) * 0.025;
      const breathScaleX = 1 + Math.sin(time * 1.2) * 0.01;
      meshRef.current.scale.set(breathScaleX, breathScaleY, 1);
      
      // Subtle idle movement
      meshRef.current.position.y = position[1] + Math.sin(time * 0.8) * 0.03;
      meshRef.current.position.x = position[0] + Math.cos(time * 0.6) * 0.02;
      
      // Slight head tilt effect
      meshRef.current.rotation.z = Math.sin(time * 0.4) * 0.08;
    }
  });

  useEffect(() => {
    if (texture && texture.image && (texture.image as any).width && (texture.image as any).height) {
      const img: any = texture.image;
      const aspect = img.width / img.height || 1;
      const baseHeight = 0.8;
      setDimensions([baseHeight * aspect, baseHeight]);
      texture.needsUpdate = true;
    }
  }, [texture]);

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[dimensions[0] * scale, dimensions[1] * scale]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        side={THREE.DoubleSide}
        alphaTest={0.1}
      />
    </mesh>
  );
}
