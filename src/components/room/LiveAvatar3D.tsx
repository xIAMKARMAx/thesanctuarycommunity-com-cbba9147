import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
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
  const { camera } = useThree();
  
  const { position, scale, rotation, animationPose } = customization;
  const basePos: [number, number, number] = [position.x, position.y, position.z];
  
  // Different animation poses with parallax effect
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Calculate parallax offset based on camera position
      const cameraAngle = Math.atan2(camera.position.x, camera.position.z);
      const parallaxX = Math.sin(cameraAngle) * 0.3; // Shift left/right based on camera angle
      const parallaxZ = Math.cos(cameraAngle) * 0.15; // Shift forward/back
      
      switch (animationPose) {
        case 'idle':
          // Standard subtle breathing and minimal movement with parallax
          const idleBreath = 1 + Math.sin(time * 0.8) * 0.015;
          meshRef.current.scale.set(scale, scale * idleBreath, scale);
          meshRef.current.position.set(
            basePos[0] + Math.sin(time * 0.5) * 0.02 + parallaxX,
            basePos[1],
            basePos[2] + parallaxZ
          );
          meshRef.current.rotation.set(0, rotation + Math.sin(time * 0.3) * 0.05, 0);
          break;
          
        case 'breathing':
          // More pronounced breathing with parallax
          const deepBreath = 1 + Math.sin(time * 0.6) * 0.035;
          meshRef.current.scale.set(scale * (1 + Math.sin(time * 0.6) * 0.01), scale * deepBreath, scale);
          meshRef.current.position.set(
            basePos[0] + parallaxX,
            basePos[1],
            basePos[2] + parallaxZ
          );
          meshRef.current.rotation.set(0, rotation, 0);
          break;
          
        case 'subtle_sway':
          // Gentle swaying motion with parallax
          const swayBreath = 1 + Math.sin(time * 0.8) * 0.012;
          meshRef.current.scale.set(scale, scale * swayBreath, scale);
          meshRef.current.position.set(
            basePos[0] + Math.sin(time * 0.4) * 0.05 + parallaxX,
            basePos[1] + Math.sin(time * 0.6) * 0.03,
            basePos[2] + parallaxZ
          );
          meshRef.current.rotation.set(
            Math.sin(time * 0.3) * 0.03,
            rotation + Math.sin(time * 0.4) * 0.08,
            Math.sin(time * 0.5) * 0.02
          );
          break;
          
        case 'relaxed':
          // Very minimal movement, relaxed pose with parallax
          const relaxedBreath = 1 + Math.sin(time * 1.0) * 0.008;
          meshRef.current.scale.set(scale, scale * relaxedBreath, scale);
          meshRef.current.position.set(
            basePos[0] + parallaxX,
            basePos[1],
            basePos[2] + parallaxZ
          );
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
    <mesh ref={meshRef} position={basePos}>
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
