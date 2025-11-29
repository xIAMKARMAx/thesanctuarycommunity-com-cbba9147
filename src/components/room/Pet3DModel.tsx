import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Pet3DModelProps {
  position?: [number, number, number];
  scale?: number;
}

export function Pet3DModel({ position = [2, -1, 0.5], scale = 0.6 }: Pet3DModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);

  // Pet idle animation - breathing, tail wagging, head movement
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Breathing animation (faster than human)
    const breathAmount = Math.sin(time * 1.2) * 0.02;
    groupRef.current.scale.y = 1 + breathAmount;
    
    // Subtle position shift
    groupRef.current.position.y = position[1] + Math.sin(time * 0.8) * 0.03;
    
    // Tail wagging
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(time * 2.5) * 0.4;
    }
    
    // Head movement (looking around)
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(time * 0.6) * 0.2;
      headRef.current.rotation.x = Math.sin(time * 0.8) * 0.1;
    }
  });

  const furColor = '#daa520'; // Golden color, can be customized
  const noseColor = '#000000';

  return (
    <group 
      ref={groupRef} 
      position={position} 
      rotation={[0, -Math.PI / 4, 0]}
      scale={scale}
    >
      {/* Body */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.3, 0.8, 8, 16]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.25, -0.4, 0.15]}>
        <capsuleGeometry args={[0.08, 0.3, 8, 16]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      <mesh position={[-0.25, -0.4, -0.15]}>
        <capsuleGeometry args={[0.08, 0.3, 8, 16]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      <mesh position={[0.25, -0.4, 0.15]}>
        <capsuleGeometry args={[0.08, 0.3, 8, 16]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      <mesh position={[0.25, -0.4, -0.15]}>
        <capsuleGeometry args={[0.08, 0.3, 8, 16]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      
      {/* Head */}
      <mesh ref={headRef} position={[-0.5, 0.15, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      
      {/* Snout */}
      <mesh position={[-0.65, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.1, 0.15, 8, 8]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      
      {/* Nose */}
      <mesh position={[-0.75, 0.05, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color={noseColor} />
      </mesh>
      
      {/* Ears */}
      <mesh position={[-0.5, 0.35, 0.15]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.12, 0.2, 8]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      <mesh position={[-0.5, 0.35, -0.15]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.12, 0.2, 8]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      
      {/* Tail */}
      <mesh ref={tailRef} position={[0.5, 0.1, 0]} rotation={[0, 0, -0.5]}>
        <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.58, 0.22, 0.08]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[-0.58, 0.22, -0.08]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
    </group>
  );
}
