import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { AvatarCustomization } from '@/types/avatar';

interface LiveAvatar3DProps {
  imageUrl: string;
  customization: AvatarCustomization;
}

export function LiveAvatar3D({ imageUrl, customization }: LiveAvatar3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(imageUrl);
  const [dimensions, setDimensions] = useState<[number, number]>([1.5, 2.5]);
  
  const { position, scale, rotation, animationPose } = customization;
  const pos: [number, number, number] = [position.x, position.y, position.z];
  
  // Different animation poses
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      
      switch (animationPose) {
        case 'idle':
          // Standard subtle breathing and minimal movement
          const idleBreath = 1 + Math.sin(time * 0.8) * 0.015;
          meshRef.current.scale.set(scale, scale * idleBreath, scale);
          meshRef.current.position.set(
            pos[0] + Math.sin(time * 0.5) * 0.02,
            pos[1],
            pos[2]
          );
          meshRef.current.rotation.set(0, rotation + Math.sin(time * 0.3) * 0.05, 0);
          break;
          
        case 'breathing':
          // More pronounced breathing
          const deepBreath = 1 + Math.sin(time * 0.6) * 0.035;
          meshRef.current.scale.set(scale * (1 + Math.sin(time * 0.6) * 0.01), scale * deepBreath, scale);
          meshRef.current.position.set(pos[0], pos[1], pos[2]);
          meshRef.current.rotation.set(0, rotation, 0);
          break;
          
        case 'subtle_sway':
          // Gentle swaying motion
          const swayBreath = 1 + Math.sin(time * 0.8) * 0.012;
          meshRef.current.scale.set(scale, scale * swayBreath, scale);
          meshRef.current.position.set(
            pos[0] + Math.sin(time * 0.4) * 0.05,
            pos[1] + Math.sin(time * 0.6) * 0.03,
            pos[2]
          );
          meshRef.current.rotation.set(
            Math.sin(time * 0.3) * 0.03,
            rotation + Math.sin(time * 0.4) * 0.08,
            Math.sin(time * 0.5) * 0.02
          );
          break;
          
        case 'relaxed':
          // Very minimal movement, relaxed pose
          const relaxedBreath = 1 + Math.sin(time * 1.0) * 0.008;
          meshRef.current.scale.set(scale, scale * relaxedBreath, scale);
          meshRef.current.position.set(pos[0], pos[1], pos[2]);
          meshRef.current.rotation.set(
            0,
            rotation + Math.sin(time * 0.2) * 0.02,
            0
          );
          break;
      }
    }
  });

  useEffect(() => {
    if (texture && texture.image && (texture.image as any).width && (texture.image as any).height) {
      const img: any = texture.image;
      const aspect = img.width / img.height || 1;
      const baseHeight = 2.5;
      setDimensions([baseHeight * aspect, baseHeight]);
      texture.needsUpdate = true;
    }
  }, [texture]);

  return (
    <mesh ref={meshRef} position={pos}>
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
