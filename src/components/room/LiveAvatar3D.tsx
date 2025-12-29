import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { AvatarCustomization } from '@/types/avatar';

interface LiveAvatar3DProps {
  imageUrl: string;
  customization: AvatarCustomization;
}

export function LiveAvatar3D({ imageUrl, customization }: LiveAvatar3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [dimensions, setDimensions] = useState<[number, number]>([1.5, 2.5]);
  const { camera } = useThree();
  
  const { position, scale, rotation, animationPose } = customization;
  const basePos: [number, number, number] = [position.x, position.y, position.z];

  // Load texture with proper settings
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    
    loader.load(
      imageUrl,
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.minFilter = THREE.LinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.needsUpdate = true;
        
        setTexture(loadedTexture);
        
        // Calculate dimensions from image
        const img = loadedTexture.image;
        if (img && img.width && img.height) {
          const aspect = img.width / img.height;
          const baseHeight = 2.5;
          setDimensions([baseHeight * aspect, baseHeight]);
        }
      },
      undefined,
      (error) => {
        console.error('Error loading avatar texture:', error);
      }
    );
    
    return () => {
      if (texture) {
        texture.dispose();
      }
    };
  }, [imageUrl]);
  
  // Different animation poses with parallax effect
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Calculate parallax offset based on camera position
      const cameraAngle = Math.atan2(camera.position.x, camera.position.z);
      const parallaxX = Math.sin(cameraAngle) * 0.3;
      const parallaxZ = Math.cos(cameraAngle) * 0.15;
      
      switch (animationPose) {
        case 'idle':
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

  if (!texture) {
    return (
      <mesh position={basePos}>
        <planeGeometry args={[1.5, 2.5]} />
        <meshBasicMaterial color="#666" transparent opacity={0.3} />
      </mesh>
    );
  }

  return (
    <mesh ref={meshRef} position={basePos}>
      <planeGeometry args={[dimensions[0] * scale, dimensions[1] * scale]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        side={THREE.DoubleSide}
        alphaTest={0.1}
        depthWrite={false}
      />
    </mesh>
  );
}