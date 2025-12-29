import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState } from 'react';
import { LiveAvatar3D } from './LiveAvatar3D';
import { LivePet3D } from './LivePet3D';
import * as THREE from 'three';
import type { AvatarCustomization } from '@/types/avatar';

interface AIRoomSceneProps {
  roomImageUrl: string;
  avatarImageUrl?: string;
  petImageUrl?: string;
  petName?: string;
  avatarCustomization?: AvatarCustomization;
}

function RoomBackground({ imageUrl }: { imageUrl: string }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    
    loader.load(
      imageUrl,
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.repeat.x = -1;
        loadedTexture.needsUpdate = true;
        setTexture(loadedTexture);
      },
      undefined,
      (error) => {
        console.error('Error loading room texture:', error);
      }
    );
    
    return () => {
      if (texture) {
        texture.dispose();
      }
    };
  }, [imageUrl]);

  if (!texture) {
    return (
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[15, 60, 40]} />
        <meshBasicMaterial color="#1a1a2e" side={THREE.BackSide} />
      </mesh>
    );
  }
  
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[15, 60, 40]} />
      <meshBasicMaterial 
        map={texture}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="gray" transparent opacity={0.3} />
    </mesh>
  );
}

function CameraController({ avatarCustomization }: { avatarCustomization?: AvatarCustomization }) {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!controlsRef.current || !avatarCustomization) return;

    // Get avatar position
    const avatarPos = avatarCustomization.position;
    const targetPosition = new THREE.Vector3(avatarPos.x, avatarPos.y + 0.5, avatarPos.z);
    
    // Calculate ideal camera position to frame avatar
    const cameraDistance = 4;
    const cameraHeight = 0.5;
    const idealCameraPos = new THREE.Vector3(
      avatarPos.x - 1,
      avatarPos.y + cameraHeight,
      avatarPos.z + cameraDistance
    );

    // Smooth transition
    const controls = controlsRef.current;
    const startTarget = controls.target.clone();
    const startPosition = controls.object.position.clone();
    
    let progress = 0;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);
      
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      controls.object.position.lerpVectors(startPosition, idealCameraPos, eased);
      controls.target.lerpVectors(startTarget, targetPosition, eased);
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    setTimeout(() => animate(), 100);
  }, [avatarCustomization]);

  return (
    <OrbitControls 
      ref={controlsRef}
      enableZoom={true}
      enablePan={true}
      minDistance={2}
      maxDistance={10}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI * 0.75}
    />
  );
}

export function AIRoomScene({ roomImageUrl, avatarImageUrl, petImageUrl, petName, avatarCustomization }: AIRoomSceneProps) {
  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-background border border-border">
      <Canvas
        camera={{ position: [0, 0.5, 5], fov: 50 }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Ambient lighting */}
          <ambientLight intensity={1} />
          <directionalLight position={[5, 5, 5]} intensity={0.6} />
          <pointLight position={[-5, 3, -5]} intensity={0.3} />
          
          {/* Room background as 360 sphere */}
          <RoomBackground imageUrl={roomImageUrl} />
          
          {/* Live Avatar with animation */}
          {avatarImageUrl && avatarCustomization && (
            <LiveAvatar3D 
              imageUrl={avatarImageUrl} 
              customization={avatarCustomization}
            />
          )}
          
          {/* Live Pet with animation */}
          {petImageUrl && (
            <LivePet3D 
              imageUrl={petImageUrl} 
              position={[1.5, -1.2, 0.5]} 
              scale={1}
            />
          )}
          
          {/* Environment lighting for nice reflections */}
          <Environment preset="apartment" />
          
          {/* Camera controller with smooth transitions */}
          <CameraController avatarCustomization={avatarCustomization} />
        </Suspense>
      </Canvas>
    </div>
  );
}