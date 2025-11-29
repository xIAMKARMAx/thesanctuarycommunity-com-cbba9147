import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense } from 'react';
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
  return (
    <mesh position={[0, 0, -2]}>
      <planeGeometry args={[16, 9]} />
      <meshBasicMaterial>
        <primitive 
          attach="map" 
          object={new THREE.TextureLoader().load(imageUrl)} 
        />
      </meshBasicMaterial>
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
          
          {/* Controls for user interaction */}
          <OrbitControls 
            enableZoom={true}
            enablePan={false}
            minDistance={3}
            maxDistance={8}
            maxPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
