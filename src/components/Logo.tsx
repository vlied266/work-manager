"use client";

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Central Core - Multiple interconnected spheres forming a nucleus
function CentralCore() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x += delta * 0.1;
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  // Create a cluster of spheres forming the core
  const corePositions: Array<[number, number, number]> = [
    [0, 0, 0],
    [0.15, 0.1, 0.05],
    [-0.1, 0.15, -0.05],
    [0.05, -0.12, 0.1],
    [-0.08, -0.08, -0.1],
  ];

  return (
    <group ref={groupRef}>
      {corePositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.15 - i * 0.02, 16, 16]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.7}
            roughness={0.2}
            emissive="#1e293b"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

// Fluid Tube Component - Smooth curved connections
function FluidTube({ 
  points, 
  radius = 0.06,
  color = "#3b82f6",
}: { 
  points: Array<[number, number, number]>;
  radius?: number;
  color?: string;
}) {
  const curve = React.useMemo(() => {
    const vectors = points.map(p => new THREE.Vector3(...p));
    return new THREE.CatmullRomCurve3(vectors, false, 'centripetal');
  }, [points]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 64, radius, 16, false]} />
      <meshStandardMaterial
        color={color}
        metalness={0.6}
        roughness={0.25}
        emissive={color}
        emissiveIntensity={0.15}
      />
    </mesh>
  );
}

// Glowing Node Component
function GlowingNode({ 
  position, 
  color = "#60a5fa", 
  size = 0.15,
  delay = 0 
}: { 
  position: [number, number, number]; 
  color?: string;
  size?: number;
  delay?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2 + delay) * 0.15;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={position}>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[size * 1.5, 16, 16]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.2}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Inner core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.1}
          emissive={color}
          emissiveIntensity={0.4}
        />
      </mesh>
    </group>
  );
}

// Main Logo Component
function Logo3D() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  // Define nodes in a more organic, interconnected pattern
  const nodes: Array<{ position: [number, number, number]; color: string; size: number }> = [
    { position: [1.1, 0.6, 0.3], color: "#3b82f6", size: 0.18 },
    { position: [-1.1, 0.6, -0.3], color: "#8b5cf6", size: 0.18 },
    { position: [0.4, 1.2, 0.4], color: "#06b6d4", size: 0.16 },
    { position: [-0.4, 1.2, -0.4], color: "#6366f1", size: 0.16 },
    { position: [0.9, -0.9, 0.5], color: "#3b82f6", size: 0.17 },
    { position: [-0.9, -0.9, -0.5], color: "#8b5cf6", size: 0.17 },
    { position: [0.6, -1.1, -0.2], color: "#06b6d4", size: 0.15 },
    { position: [-0.6, -1.1, 0.2], color: "#6366f1", size: 0.15 },
  ];

  // Define fluid tube connections - more organic and flowing
  const tubeConnections: Array<{ points: Array<[number, number, number]>; color: string }> = [
    // Connections from center to outer nodes
    { 
      points: [[0.2, 0.1, 0], [0.5, 0.3, 0.15], [0.8, 0.5, 0.25], nodes[0].position], 
      color: "#3b82f6" 
    },
    { 
      points: [[-0.2, 0.1, 0], [-0.5, 0.3, -0.15], [-0.8, 0.5, -0.25], nodes[1].position], 
      color: "#8b5cf6" 
    },
    { 
      points: [[0.1, 0.2, 0.1], [0.2, 0.6, 0.25], [0.3, 0.9, 0.35], nodes[2].position], 
      color: "#06b6d4" 
    },
    { 
      points: [[-0.1, 0.2, -0.1], [-0.2, 0.6, -0.25], [-0.3, 0.9, -0.35], nodes[3].position], 
      color: "#6366f1" 
    },
    { 
      points: [[0.15, -0.15, 0.1], [0.4, -0.5, 0.3], [0.7, -0.8, 0.45], nodes[4].position], 
      color: "#3b82f6" 
    },
    { 
      points: [[-0.15, -0.15, -0.1], [-0.4, -0.5, -0.3], [-0.7, -0.8, -0.45], nodes[5].position], 
      color: "#8b5cf6" 
    },
    // Inter-node connections for more complexity
    { 
      points: [nodes[0].position, [0.7, 0.1, 0.2], [0.5, -0.4, 0.15], nodes[4].position], 
      color: "#60a5fa" 
    },
    { 
      points: [nodes[1].position, [-0.7, 0.1, -0.2], [-0.5, -0.4, -0.15], nodes[5].position], 
      color: "#a78bfa" 
    },
    { 
      points: [nodes[2].position, [0.2, 0.9, 0.3], [0.1, 0.1, 0.2], [0.2, 0.1, 0]], 
      color: "#22d3ee" 
    },
    { 
      points: [nodes[3].position, [-0.2, 0.9, -0.3], [-0.1, 0.1, -0.2], [-0.2, 0.1, 0]], 
      color: "#818cf8" 
    },
  ];

  return (
    <group ref={groupRef}>
      {/* Central Core */}
      <CentralCore />

      {/* Fluid Tube Connections */}
      {tubeConnections.map((tube, i) => (
        <FluidTube
          key={i}
          points={tube.points}
          color={tube.color}
        />
      ))}

      {/* Glowing Nodes */}
      {nodes.map((node, i) => (
        <GlowingNode
          key={i}
          position={node.position}
          color={node.color}
          size={node.size}
          delay={i * 0.25}
        />
      ))}
    </group>
  );
}

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function Logo({ size = 'medium', className = '' }: LogoProps) {
  const sizeMap = {
    small: { canvas: 40, camera: 3.5 },
    medium: { canvas: 64, camera: 4.5 },
    large: { canvas: 120, camera: 6 },
  };

  const { canvas, camera } = sizeMap[size];

  return (
    <div 
      className={`relative ${className}`}
      style={{ width: `${canvas}px`, height: `${canvas}px` }}
    >
      <Canvas
        camera={{ position: [0, 0, camera], fov: 50 }}
        dpr={[1, 2]}
        style={{ 
          background: 'transparent',
          width: '100%',
          height: '100%'
        }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <color attach="background" args={['transparent']} />
        
        {/* Enhanced Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <directionalLight position={[-5, -5, -5]} intensity={1} />
        <pointLight position={[0, 0, 5]} intensity={0.8} color="#3b82f6" />
        <pointLight position={[0, 0, -5]} intensity={0.8} color="#8b5cf6" />
        <pointLight position={[5, 0, 0]} intensity={0.6} color="#06b6d4" />
        <pointLight position={[-5, 0, 0]} intensity={0.6} color="#6366f1" />

        <Logo3D />
      </Canvas>
    </div>
  );
}
