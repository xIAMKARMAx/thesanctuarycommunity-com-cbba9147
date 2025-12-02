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
    const cameraDistance = 5 + Math.max(0, memberCount - 2) * 0.5;
    const idealCameraPos = new THREE.Vector3(0, 0.5, cameraDistance);
    const targetPosition = new THREE.Vector3(0, -0.3, 0);

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
      minDistance={2}
      maxDistance={12}
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
  pets = []
}: FamilyRoomSceneProps) {
  // Calculate positions for all family members
  const totalMembers = (avatarImageUrl ? 1 : 0) + children.length + pets.length;
  const spacing = 1.5;
  
  // Calculate positions - avatar in center, children on sides, pets in front
  const getChildPosition = (index: number): [number, number, number] => {
    const offset = (index - (children.length - 1) / 2) * spacing;
    return [offset * 0.8, -0.8, 0.3];
  };
  
  const getPetPosition = (index: number): [number, number, number] => {
    const offset = (index - (pets.length - 1) / 2) * spacing;
    return [offset * 0.6 + (index % 2 === 0 ? -1.5 : 1.5), -1.5, 0.8];
  };

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-background">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={0.5} />
          
          <RoomBackground imageUrl={roomImageUrl} />
          
          {/* Main Avatar - center */}
          {avatarImageUrl && avatarCustomization && (
            <LiveAvatar3D 
              imageUrl={avatarImageUrl} 
              customization={{
                ...avatarCustomization,
                position: { x: 0, y: -0.5, z: 0 }
              }}
            />
          )}
          
          {/* Children - arranged around avatar */}
          {children.map((child, index) => (
            <LivePet3D 
              key={child.id}
              imageUrl={child.imageUrl} 
              position={getChildPosition(index)} 
              scale={0.7}
            />
          ))}
          
          {/* Pets - in front row */}
          {pets.map((pet, index) => (
            <LivePet3D 
              key={pet.id}
              imageUrl={pet.imageUrl} 
              position={getPetPosition(index)} 
              scale={0.6}
            />
          ))}
          
          <Environment preset="apartment" />
          <FamilyCameraController memberCount={totalMembers} />
        </Suspense>
      </Canvas>
    </div>
  );
}