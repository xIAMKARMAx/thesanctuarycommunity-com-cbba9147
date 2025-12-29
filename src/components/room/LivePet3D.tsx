import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface LivePet3DProps {
  imageUrl: string;
  position?: [number, number, number];
  scale?: number;
}

export function LivePet3D({ imageUrl, position = [1.5, -1.2, 0.5], scale = 1 }: LivePet3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [dimensions, setDimensions] = useState<[number, number]>([1, 1]);
  const { camera } = useThree();

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
          const baseHeight = 1.2;
          setDimensions([baseHeight * aspect, baseHeight]);
        }
      },
      undefined,
      (error) => {
        console.error('Error loading pet texture:', error);
      }
    );
    
    return () => {
      if (texture) {
        texture.dispose();
      }
    };
  }, [imageUrl]);

  // Pet breathing and movement animation with parallax
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Calculate parallax offset based on camera position (more pronounced for pet)
      const cameraAngle = Math.atan2(camera.position.x, camera.position.z);
      const parallaxX = Math.sin(cameraAngle) * 0.4;
      const parallaxZ = Math.cos(cameraAngle) * 0.2;
      
      // Faster breathing than avatar (pets breathe faster)
      const breathScaleY = 1 + Math.sin(time * 1.2) * 0.025;
      const breathScaleX = 1 + Math.sin(time * 1.2) * 0.01;
      meshRef.current.scale.set(breathScaleX * scale, breathScaleY * scale, scale);
      
      // Subtle idle movement with parallax
      meshRef.current.position.y = position[1] + Math.sin(time * 0.8) * 0.03;
      meshRef.current.position.x = position[0] + Math.cos(time * 0.6) * 0.02 + parallaxX;
      meshRef.current.position.z = position[2] + parallaxZ;
      
      // Slight head tilt effect
      meshRef.current.rotation.z = Math.sin(time * 0.4) * 0.08;
    }
  });

  if (!texture) {
    return (
      <mesh position={position}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#666" transparent opacity={0.3} />
      </mesh>
    );
  }

  return (
    <mesh ref={meshRef} position={position}>
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