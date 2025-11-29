import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import { EffectComposer, DepthOfField } from '@react-three/postprocessing';
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
  const texture = new THREE.TextureLoader().load(imageUrl);
  // Flip texture to show correctly on inside of sphere
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.x = -1;
  
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
      <meshStandardMaterial color="gray" />
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
    const duration = 1500; // 1.5 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);
      
      // Ease-in-out function
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // Interpolate camera position
      controls.object.position.lerpVectors(startPosition, idealCameraPos, eased);
      
      // Interpolate target (look-at point)
      controls.target.lerpVectors(startTarget, targetPosition, eased);
      
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    // Start animation after a small delay
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
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-background">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Ambient lighting */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={0.5} />
          
          {/* Room background */}
          <RoomBackground imageUrl={roomImageUrl} />
          
          {/* Live Avatar with cutout */}
          {avatarImageUrl && avatarCustomization && (
            <LiveAvatar3D 
              imageUrl={avatarImageUrl} 
              customization={avatarCustomization}
            />
          )}
          
          {/* Live Pet with cutout */}
          {petImageUrl && (
            <LivePet3D 
              imageUrl={petImageUrl} 
              position={[2, -1.5, 0.5]} 
              scale={0.8}
            />
          )}
          
          {/* Subtle environment lighting */}
          <Environment preset="apartment" />
          
          {/* Camera controller with smooth transitions */}
          <CameraController avatarCustomization={avatarCustomization} />
          
          {/* Depth of Field Effect */}
          <EffectComposer>
            <DepthOfField 
              focusDistance={0.02}
              focalLength={0.05}
              bokehScale={8}
              height={480}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
