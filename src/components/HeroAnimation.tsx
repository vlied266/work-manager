"use client";

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshTransmissionMaterial, Environment, Float, SpotLight } from '@react-three/drei';
import * as THREE from 'three';

function LiquidGlassBlob({ mouse }: { mouse: [number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Complex rotation to make it feel organic
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.25;
    }

    // Mouse interaction - parallax effect
    if (groupRef.current) {
      // Smooth interpolation for mouse following
      groupRef.current.rotation.y += (mouse[0] * 0.3 - groupRef.current.rotation.y) * 0.1;
      groupRef.current.rotation.x += (mouse[1] * 0.3 - groupRef.current.rotation.x) * 0.1;
      
      // Subtle position shift based on mouse
      groupRef.current.position.x += (mouse[0] * 0.2 - groupRef.current.position.x) * 0.1;
      groupRef.current.position.y += (mouse[1] * 0.2 - groupRef.current.position.y) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2} floatingRange={[-0.2, 0.2]}>
      <group ref={groupRef}>
        {/* GEOMETRY CHANGED: High-res Sphere instead of Box */}
        <Sphere ref={meshRef} args={[1, 128, 128]} scale={0.9}>
        
        {/* THE LIQUID GLASS MATERIAL */}
        <MeshTransmissionMaterial
          backside
          samples={16}
          resolution={1024}
          transmission={0.7} // Further reduced for more vibrant base color
          roughness={0.15} // Increased roughness for more color saturation
          thickness={2.2} // Reduced thickness for brighter appearance
          ior={1.5}
          
          // COLOR & RAINBOWS
          chromaticAberration={1.0} // Max rainbow edges
          anisotropy={0.3}
          iridescence={1}
          iridescenceIOR={1}
          iridescenceThicknessRange={[0, 1400]}
          
          // THE LIQUID EFFECT (Crucial for avoiding "Soap" look)
          distortion={1.0}      // High distortion makes it wobble
          distortionScale={0.4} // Frequency of the waves
          temporalDistortion={0.2} // Speed of the ripples
          
          color="#7dd3fc" // Brighter, more saturated cyan/blue base color
        />
        </Sphere>
      </group>
    </Float>
  );
}

// Generate particle data outside component to ensure stable values
const generateParticleData = () => {
  return Array.from({ length: 18 }, (_, i) => {
    // Use a seeded random function for consistency
    const seed = i * 0.618033988749; // Golden ratio for better distribution
    // Normalize to ensure values are between 0 and 1
    const normalize = (val: number) => {
      const normalized = val % 1;
      return normalized < 0 ? normalized + 1 : normalized;
    };
    const random1 = normalize(Math.sin(seed * 12.9898) * 43758.5453);
    const random2 = normalize(Math.sin((seed + 1) * 12.9898) * 43758.5453);
    const random3 = normalize(Math.sin((seed + 2) * 12.9898) * 43758.5453);
    const random4 = normalize(Math.sin((seed + 3) * 12.9898) * 43758.5453);
    const random5 = normalize(Math.sin((seed + 4) * 12.9898) * 43758.5453);
    
    const radius = 3 + random1 * 2; // Random radius between 3 and 5
    const theta = random2 * Math.PI * 2; // Random angle around Y axis
    const phi = Math.acos(random3 * 2 - 1); // Random angle from top
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    // Assign sharp, vibrant colors: Purple, Green, Blue
    const colorIndex = Math.floor(random4 * 3);
    const colors = [
      { color: "#9333ea", emissive: "#a855f7" }, // Vibrant Purple
      { color: "#059669", emissive: "#10b981" }, // Vibrant Green
      { color: "#2563eb", emissive: "#3b82f6" }, // Vibrant Blue
    ];
    // Safety check: ensure colorIndex is valid (0, 1, or 2)
    const safeColorIndex = Math.max(0, Math.min(2, colorIndex));
    const particleColor = colors[safeColorIndex];
    
    return {
      position: [x, y, z] as [number, number, number],
      speed: 0.3 + random5 * 0.2, // Random rotation speed
      floatSpeed: 0.5 + random1 * 0.5, // Random float speed
      color: particleColor.color,
      emissive: particleColor.emissive,
    };
  });
};

const PARTICLE_DATA = generateParticleData();

function FloatingParticles() {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<(THREE.Group | null)[]>([]);

  useFrame((state, delta) => {
    // Rotate the entire group around the center (orbiting)
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
      groupRef.current.rotation.x += delta * 0.1;
    }

    // Individual particle floating animation
    particlesRef.current.forEach((particle, i) => {
      if (particle && PARTICLE_DATA[i]) {
        const time = state.clock.elapsedTime;
        const particleData = PARTICLE_DATA[i];
        const floatOffset = Math.sin(time * particleData.floatSpeed) * 0.1;
        const floatOffsetY = Math.cos(time * particleData.floatSpeed * 0.7) * 0.1;
        
        particle.position.y = particleData.position[1] + floatOffset;
        particle.position.x = particleData.position[0] + floatOffsetY * 0.5;
        particle.rotation.x += delta * particleData.speed;
        particle.rotation.y += delta * particleData.speed * 0.7;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {PARTICLE_DATA.map((particle, i) => (
        <Float
          key={i}
          speed={particle.floatSpeed}
          rotationIntensity={0.5}
          floatIntensity={0.3}
          floatingRange={[-0.1, 0.1]}
        >
          <group
            ref={(el) => {
              if (el) particlesRef.current[i] = el;
            }}
            position={particle.position}
          >
            <Sphere args={[0.12, 32, 32]}>
              <meshStandardMaterial
                color={particle.color}
                emissive={particle.emissive}
                emissiveIntensity={0.8}
                roughness={0.05}
                metalness={0.95}
                transparent
                opacity={0.9}
              />
            </Sphere>
          </group>
        </Float>
      ))}
    </group>
  );
}

export default function HeroAnimation() {
  const [mouse, setMouse] = useState<[number, number]>([0, 0]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    setMouse([x, y]);
  };

  return (
    <div 
      className="h-[500px] lg:h-[600px] w-full relative" 
      style={{ 
        margin: 0, 
        padding: 0, 
        border: 'none', 
        outline: 'none',
        background: 'transparent',
        backgroundColor: 'transparent',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMouse([0, 0])}
    >
      <Canvas 
        camera={{ position: [0, 0, 6], fov: 45 }} 
        dpr={[1, 2]}
        style={{ 
          background: 'transparent !important',
          backgroundColor: 'transparent !important',
          margin: 0,
          padding: 0,
          display: 'block',
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
        }}
        gl={{ 
          antialias: true, 
          alpha: true, 
          powerPreference: "high-performance",
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
          clearColor: 'transparent',
        }}
      >
        {/* Ambient light for base illumination - increased for brighter base */}
        <ambientLight intensity={1.5} />
        
        {/* Directional light for main lighting - increased */}
        <directionalLight position={[5, 5, 5]} intensity={2.5} />
        <directionalLight position={[-5, -5, 5]} intensity={2.0} />
        <directionalLight position={[0, 5, -5]} intensity={1.8} />
        
        {/* Vibrant Spotlights for reflections and color - maximum intensity */}
        <SpotLight position={[5, 5, 5]} intensity={5.0} color="#00bfff" penumbra={0.5} distance={20} /> {/* Cyan */}
        <SpotLight position={[-5, -5, 5]} intensity={5.0} color="#ff00ff" penumbra={0.5} distance={20} /> {/* Magenta */}
        <SpotLight position={[0, 5, -5]} intensity={4.5} color="#ffaa00" penumbra={0.5} distance={20} /> {/* Orange */}
        <SpotLight position={[0, -5, 5]} intensity={4.0} color="#a855f7" penumbra={0.5} distance={20} /> {/* Purple */}
        <SpotLight position={[5, -5, -5]} intensity={3.5} color="#06b6d4" penumbra={0.5} distance={20} /> {/* Teal */}

        <LiquidGlassBlob mouse={mouse} />

        {/* Floating Atomic Particles orbiting around the blob */}
        <FloatingParticles />

        {/* Environment for lighting and reflections, but with transparent background */}
        <Environment preset="studio" blur={0.8} background={false} />
      </Canvas>
    </div>
  );
}