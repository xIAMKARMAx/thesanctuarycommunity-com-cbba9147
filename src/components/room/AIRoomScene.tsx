import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AIRoomSceneProps {
  roomImageUrl: string;
  avatarImageUrl?: string;
  petImageUrl?: string;
  petName?: string;
}

function RoomWithCharacters({ roomImageUrl, avatarImageUrl, petImageUrl }: { 
  roomImageUrl: string; 
  avatarImageUrl?: string; 
  petImageUrl?: string;
}) {
  const [roomTexture, setRoomTexture] = useState<THREE.Texture | null>(null);
  const [avatarTexture, setAvatarTexture] = useState<THREE.Texture | null>(null);
  const [petTexture, setPetTexture] = useState<THREE.Texture | null>(null);
  const [avatarDimensions, setAvatarDimensions] = useState<[number, number]>([1, 1.8]);
  const [petDimensions, setPetDimensions] = useState<[number, number]>([0.8, 0.8]);
  
  const avatarRef = useRef<THREE.Mesh>(null);
  const petRef = useRef<THREE.Mesh>(null);

  // Load room texture
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(roomImageUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      setRoomTexture(tex);
    });
  }, [roomImageUrl]);

  // Load avatar texture with transparency support
  useEffect(() => {
    if (!avatarImageUrl) return;
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(avatarImageUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.premultiplyAlpha = false;
      setAvatarTexture(tex);
      const img = tex.image;
      if (img?.width && img?.height) {
        const aspect = img.width / img.height;
        setAvatarDimensions([1.8 * aspect, 1.8]);
      }
    });
  }, [avatarImageUrl]);

  // Load pet texture with transparency support
  useEffect(() => {
    if (!petImageUrl) return;
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(petImageUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.premultiplyAlpha = false;
      setPetTexture(tex);
      const img = tex.image;
      if (img?.width && img?.height) {
        const aspect = img.width / img.height;
        setPetDimensions([0.7 * aspect, 0.7]);
      }
    });
  }, [petImageUrl]);

  // Animate avatar and pet
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (avatarRef.current) {
      // Subtle breathing
      const breath = 1 + Math.sin(time * 0.8) * 0.01;
      avatarRef.current.scale.y = breath;
      // Tiny sway
      avatarRef.current.position.x = -0.1 + Math.sin(time * 0.5) * 0.02;
    }
    
    if (petRef.current) {
      // Faster breathing for pet
      const petBreath = 1 + Math.sin(time * 1.2) * 0.02;
      petRef.current.scale.y = petBreath;
      // Small movement
      petRef.current.position.y = -0.6 + Math.sin(time * 0.8) * 0.02;
    }
  });

  return (
    <>
      {/* Room background - full screen plane */}
      {roomTexture && (
        <mesh position={[0, 0, -2]}>
          <planeGeometry args={[8, 4.5]} />
          <meshBasicMaterial map={roomTexture} />
        </mesh>
      )}
      
      {/* Avatar - figure with transparent background */}
      {avatarTexture && (
        <mesh ref={avatarRef} position={[-0.1, -0.1, -1]}>
          <planeGeometry args={avatarDimensions} />
          <meshBasicMaterial 
            map={avatarTexture} 
            transparent={true}
            alphaTest={0.05}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
      
      {/* Pet - figure with transparent background */}
      {petTexture && (
        <mesh ref={petRef} position={[1.2, -0.6, -0.8]}>
          <planeGeometry args={petDimensions} />
          <meshBasicMaterial 
            map={petTexture} 
            transparent={true}
            alphaTest={0.05}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </>
  );
}

function LoadingView() {
  return (
    <mesh>
      <planeGeometry args={[2, 1]} />
      <meshBasicMaterial color="#1a1a2e" />
    </mesh>
  );
}

export function AIRoomScene({ roomImageUrl, avatarImageUrl, petImageUrl }: AIRoomSceneProps) {
  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-slate-900">
      <Canvas
        camera={{ position: [0, 0, 2], fov: 50 }}
        gl={{ antialias: true }}
        style={{ background: '#0f0f1a' }}
      >
        <Suspense fallback={<LoadingView />}>
          <ambientLight intensity={1.2} />
          <RoomWithCharacters 
            roomImageUrl={roomImageUrl}
            avatarImageUrl={avatarImageUrl}
            petImageUrl={petImageUrl}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}