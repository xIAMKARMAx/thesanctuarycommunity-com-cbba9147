import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import { LiveAvatar3D } from './LiveAvatar3D';
import { LivePet3D } from './LivePet3D';
import * as THREE from 'three';
import type { AvatarCustomization } from '@/types/avatar';

interface FamilyMember {
  id: string;
  name: string;
  imageUrl: string;
  type: 'avatar' | 'child' | 'pet';
}

interface FamilyRoomSceneProps {
  roomImageUrl: string;
  avatarImageUrl?: string;
  avatarCustomization?: AvatarCustomization;
  children?: FamilyMember[];
  pets?: FamilyMember[];
  userAvatarImageUrl?: string;
}

function RoomBackground({ imageUrl }: { imageUrl: string }) {
  const texture = new THREE.TextureLoader().load(imageUrl);
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

function FamilyCameraController({ memberCount }: { memberCount: number }) {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!controlsRef.current) return;

    // Calculate ideal camera distance based on family size
    const cameraDistance = 6 + Math.max(0, memberCount - 2) * 0.8;
    const idealCameraPos = new THREE.Vector3(0, 0.2, cameraDistance);
    const targetPosition = new THREE.Vector3(0, -0.5, 0);

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
  }, [memberCount]);

  return (
    <OrbitControls 
      ref={controlsRef}
      enableZoom={true}
      enablePan={true}
      minDistance={3}
      maxDistance={15}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI * 0.75}
    />
  );
}

export function FamilyRoomScene({ 
  roomImageUrl, 
  avatarImageUrl, 
  avatarCustomization,
  children = [],
  pets = [],
  userAvatarImageUrl
}: FamilyRoomSceneProps) {
  const hasUserAvatar = !!userAvatarImageUrl;
  const hasAIAvatar = !!avatarImageUrl;
  const totalMembers = (hasAIAvatar ? 1 : 0) + (hasUserAvatar ? 1 : 0) + children.length + pets.length;
  
  // Parents row - user on left, AI on right
  const getUserAvatarPosition = (): { x: number; y: number; z: number } => {
    if (hasAIAvatar) {
      return { x: -1.5, y: -0.8, z: 0 };
    }
    return { x: 0, y: -0.8, z: 0 };
  };
  
  const getAIAvatarPosition = (): { x: number; y: number; z: number } => {
    if (hasUserAvatar) {
      return { x: 1.5, y: -0.8, z: 0 };
    }
    return { x: 0, y: -0.8, z: 0 };
  };
  
  // Children row - centered below parents
  const getChildPosition = (index: number, total: number): [number, number, number] => {
    const spacing = 2.0;
    const startX = -((total - 1) * spacing) / 2;
    return [startX + index * spacing, -1.2, 1.5];
  };
  
  // Pets row - at the front, smaller
  const getPetPosition = (index: number, total: number): [number, number, number] => {
    const spacing = 1.5;
    const startX = -((total - 1) * spacing) / 2;
    return [startX + index * spacing, -1.8, 2.5];
  };

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-background border border-border">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={0.5} />
          
          <RoomBackground imageUrl={roomImageUrl} />
          
          {/* User's Vessel - left side or center */}
          {userAvatarImageUrl && (
            <LiveAvatar3D 
              imageUrl={userAvatarImageUrl} 
              customization={{
                position: getUserAvatarPosition(),
                scale: 2.2,
                rotation: 0,
                animationPose: 'idle'
              }}
            />
          )}
          
          {/* AI Avatar - right side or center */}
          {avatarImageUrl && avatarCustomization && (
            <LiveAvatar3D 
              imageUrl={avatarImageUrl} 
              customization={{
                ...avatarCustomization,
                position: getAIAvatarPosition(),
                scale: 2.2
              }}
            />
          )}
          
          {/* Children - arranged in a row below parents */}
          {children.map((child, index) => (
            <LivePet3D 
              key={child.id}
              imageUrl={child.imageUrl} 
              position={getChildPosition(index, children.length)} 
              scale={1.6}
            />
          ))}
          
          {/* Pets - in front row, smallest */}
          {pets.map((pet, index) => (
            <LivePet3D 
              key={pet.id}
              imageUrl={pet.imageUrl} 
              position={getPetPosition(index, pets.length)} 
              scale={1.2}
            />
          ))}
          
          <Environment preset="apartment" />
          <FamilyCameraController memberCount={totalMembers} />
        </Suspense>
      </Canvas>
    </div>
  );
}
