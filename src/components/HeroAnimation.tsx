"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Float } from "@react-three/drei";
import { Suspense } from "react";

// Sapphire Sphere Component
function SapphireSphere() {
  return (
    <Float
      speed={1.5}
      rotationIntensity={0.5}
      floatIntensity={0.5}
    >
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          color="#0F52BA" // Sapphire blue color
          metalness={0.95}
          roughness={0.05}
          transparent={true}
          opacity={0.75}
          emissive="#1E3A8A"
          emissiveIntensity={0.15}
          envMapIntensity={1.5}
        />
      </mesh>
    </Float>
  );
}

// Orbiting Particles (Spheres)
function FloatingParticles() {
  const particleCount = 15;
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (i / particleCount) * Math.PI * 2;
    const radius = 3.5 + Math.random() * 0.5;
    const height = (Math.random() - 0.5) * 2;
    
    return {
      angle,
      radius,
      height,
      speed: 0.5 + Math.random() * 0.5,
    };
  });

  return (
    <group>
      {particles.map((particle, index) => (
        <Float
          key={index}
          speed={particle.speed}
          rotationIntensity={0.3}
          floatIntensity={0.3}
        >
          <mesh
            position={[
              Math.cos(particle.angle) * particle.radius,
              particle.height,
              Math.sin(particle.angle) * particle.radius,
            ]}
          >
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#007AFF"
              emissiveIntensity={0.8}
              roughness={0.2}
              metalness={0.8}
              transparent={true}
              opacity={0.9}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// Loading Fallback
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
}

export default function HeroAnimation() {
  return (
    <div
      className="relative flex h-[420px] w-full items-center justify-center sm:h-[520px] lg:h-[640px]"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        <Suspense fallback={null}>
          {/* Lighting - Enhanced for sapphire transparency and office scene */}
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} />
          <directionalLight position={[-5, 5, -5]} intensity={1.0} />
          <directionalLight position={[0, 10, 0]} intensity={0.8} />
          <pointLight position={[0, 0, 5]} intensity={0.6} color="#007AFF" />
          <pointLight position={[0, 2, -2]} intensity={0.4} color="#FFD700" />
          
          {/* Environment for reflections - modern open office workspace with desks, chairs, computers and people */}
          <Environment preset="studio" />
          
          {/* Main Sapphire Sphere */}
          <SapphireSphere />
          
          {/* Orbiting Particles */}
          <FloatingParticles />
          
          {/* Camera Controls (optional - can be removed for auto-rotation) */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
