import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AvatarCustomization } from '@/types/avatar';

interface Avatar3DModelProps {
  customization?: AvatarCustomization;
  gender?: string;
}

export function Avatar3DModel({ customization, gender = 'female' }: Avatar3DModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const torsoRef = useRef<THREE.Mesh>(null);
  
  const position = customization?.position || { x: -1, y: -0.5, z: 0 };
  const scale = customization?.scale || 1;
  const rotation = customization?.rotation || 0;

  // Idle animation with breathing and subtle movement
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Breathing animation
    const breathAmount = Math.sin(time * 0.8) * 0.015;
    if (torsoRef.current) {
      torsoRef.current.scale.y = 1 + breathAmount;
    }
    
    // Subtle head movement (looking around slightly)
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(time * 0.3) * 0.1;
      headRef.current.rotation.x = Math.sin(time * 0.4) * 0.05;
    }
    
    // Subtle weight shifting
    groupRef.current.position.y = position.y + Math.sin(time * 0.6) * 0.02;
    groupRef.current.rotation.z = Math.sin(time * 0.5) * 0.01;
  });

  // Color scheme based on gender (can be customized)
  const skinTone = '#ffd5c0';
  const hairColor = gender === 'male' ? '#4a3c28' : '#8b6f4f';
  const clothingColor = gender === 'male' ? '#3b5998' : '#d946a8';

  return (
    <group 
      ref={groupRef} 
      position={[position.x, position.y, position.z]} 
      rotation={[0, rotation, 0]}
      scale={scale}
    >
      {/* Legs */}
      <mesh position={[-0.15, -0.8, 0]}>
        <capsuleGeometry args={[0.08, 0.5, 8, 16]} />
        <meshStandardMaterial color={clothingColor} />
      </mesh>
      <mesh position={[0.15, -0.8, 0]}>
        <capsuleGeometry args={[0.08, 0.5, 8, 16]} />
        <meshStandardMaterial color={clothingColor} />
      </mesh>
      
      {/* Torso */}
      <mesh ref={torsoRef} position={[0, 0, 0]}>
        <capsuleGeometry args={[0.25, 0.6, 8, 16]} />
        <meshStandardMaterial color={clothingColor} />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.35, 0.1, 0]} rotation={[0, 0, 0.3]}>
        <capsuleGeometry args={[0.06, 0.5, 8, 16]} />
        <meshStandardMaterial color={skinTone} />
      </mesh>
      <mesh position={[0.35, 0.1, 0]} rotation={[0, 0, -0.3]}>
        <capsuleGeometry args={[0.06, 0.5, 8, 16]} />
        <meshStandardMaterial color={skinTone} />
      </mesh>
      
      {/* Neck */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.15, 8]} />
        <meshStandardMaterial color={skinTone} />
      </mesh>
      
      {/* Head */}
      <mesh ref={headRef} position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={skinTone} />
      </mesh>
      
      {/* Hair */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={hairColor} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.08, 0.68, 0.15]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.08, 0.68, 0.15]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
    </group>
  );
}
