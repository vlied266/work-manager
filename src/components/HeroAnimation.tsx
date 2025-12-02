"use client";

import React, { useRef, useState } from 'react';
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
        <Sphere ref={meshRef} args={[1, 128, 128]} scale={1.2}>
        
        {/* THE LIQUID GLASS MATERIAL */}
        <MeshTransmissionMaterial
          backside
          samples={16}
          resolution={1024}
          transmission={1}
          roughness={0.0}
          thickness={3.0} // Very thick to bend light drastically
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
          
          color="#ffffff"
        />
        </Sphere>
      </group>
    </Float>
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
      className="h-[500px] lg:h-[600px] w-full relative overflow-visible" 
      style={{ 
        margin: 0, 
        padding: 0, 
        border: 'none', 
        outline: 'none',
        background: 'transparent',
        maskImage: 'radial-gradient(ellipse 80% 80% at center, black 60%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at center, black 60%, transparent 100%)'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMouse([0, 0])}
    >
      <Canvas 
        camera={{ position: [0, 0, 6], fov: 45 }} 
        dpr={[1, 2]}
        style={{ 
          background: 'transparent',
          margin: 0,
          padding: 0,
          display: 'block',
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          boxShadow: 'none'
        }}
        gl={{ 
          antialias: true, 
          alpha: true, 
          powerPreference: "high-performance",
          premultipliedAlpha: false,
          preserveDrawingBuffer: false
        }}
      >
        {/* Fully transparent background */}
        <color attach="background" args={['transparent']} />

        <ambientLight intensity={0.5} />
        
        {/* Vibrant Spotlights for reflections */}
        <SpotLight position={[5, 5, 5]} intensity={2.5} color="#00bfff" penumbra={0.5} distance={20} /> {/* Cyan */}
        <SpotLight position={[-5, -5, 5]} intensity={2.5} color="#ff00ff" penumbra={0.5} distance={20} /> {/* Magenta */}
        <SpotLight position={[0, 5, -5]} intensity={2.0} color="#ffaa00" penumbra={0.5} distance={20} /> {/* Orange */}

        <LiquidGlassBlob mouse={mouse} />

        <Environment preset="studio" blur={0.8} background={false} />
      </Canvas>
    </div>
  );
}
