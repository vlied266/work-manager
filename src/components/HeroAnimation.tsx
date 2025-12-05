"use client";

import { Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

type PulsingCircleProps = {
  radius?: number;
  color?: string;
  accentColor?: string;
};

function PulsingCircle({
  radius = 1.9,
  color = "#60a5fa",
  accentColor = "#c084fc",
}: PulsingCircleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const scale = 1 + Math.sin(t * 1.4) * 0.08;

    if (meshRef.current) {
      meshRef.current.scale.set(scale, scale, scale);
    }

    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 0.6 + Math.sin(t * 1.8) * 0.4;
      materialRef.current.opacity = 0.9 + Math.sin(t * 0.7) * 0.04;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius, 120]} />
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        emissive={accentColor}
        transparent
        metalness={0.45}
        roughness={0.2}
      />
    </mesh>
  );
}

type OrbitRingProps = {
  innerRadius?: number;
  outerRadius?: number;
  color?: string;
  tilt?: number;
  speed?: number;
  offset?: number;
};

function OrbitRing({
  innerRadius = 2.3,
  outerRadius = 2.45,
  color = "#38bdf8",
  tilt = 0.5,
  speed = 0.25,
  offset = 0,
}: OrbitRingProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z = clock.getElapsedTime() * speed + offset;
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, tilt]}>
      <ringGeometry args={[innerRadius, outerRadius, 180]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

type OrbitingDotProps = {
  radius?: number;
  speed?: number;
  color?: string;
  size?: number;
  height?: number;
  phase?: number;
};

function OrbitingDot({
  radius = 2.8,
  speed = 0.4,
  color = "#fef3c7",
  size = 0.12,
  height = 0.2,
  phase = 0,
}: OrbitingDotProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime() * speed + phase;
    meshRef.current.position.set(
      Math.cos(t) * radius,
      Math.sin(t * 0.6) * height,
      Math.sin(t) * radius
    );
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.9}
      />
    </mesh>
  );
}

function GlowBase() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
      <circleGeometry args={[4.5, 80]} />
      <meshBasicMaterial color="#0f172a" transparent opacity={0.45} />
    </mesh>
  );
}

export default function HeroAnimation() {
  return (
    <div
      className="relative flex h-[420px] w-full items-center justify-center sm:h-[520px] lg:h-[640px]"
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-[48px] bg-gradient-to-br from-indigo-500/30 via-slate-950 to-blue-900/40 blur-2xl" />
      <Canvas
        className="rounded-[48px] border border-white/10 bg-[#030712] shadow-[0_50px_100px_-20px_rgba(15,23,42,.9)]"
        dpr={[1, 1.8]}
        camera={{ position: [0, 0, 6], fov: 32 }}
      >
        <color attach="background" args={["#030712"]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 6, 3]} intensity={1.4} />
        <directionalLight position={[-4, -3, -2]} intensity={0.4} />

        <group position={[0, -0.15, 0]}>
          <GlowBase />
          <PulsingCircle />
          <OrbitRing />
          <OrbitRing
            innerRadius={1.65}
            outerRadius={1.85}
            color="#fef3c7"
            tilt={-0.35}
            speed={-0.18}
            offset={Math.PI / 4}
          />
          <OrbitRing
            innerRadius={2.85}
            outerRadius={3}
            color="#818cf8"
            tilt={0.9}
            speed={0.08}
          />
          <OrbitingDot radius={2.1} speed={0.55} color="#c4b5fd" height={0.4} />
          <OrbitingDot
            radius={2.8}
            speed={0.38}
            color="#fef08a"
            size={0.18}
            height={0.65}
            phase={Math.PI / 2}
          />
          <OrbitingDot
            radius={3.2}
            speed={0.22}
            color="#34d399"
            size={0.16}
            height={0.3}
            phase={Math.PI}
          />
        </group>

        <Sparkles
          count={180}
          speed={0.15}
          scale={[6, 4, 6]}
          size={3}
          color="#38bdf8"
        />
      </Canvas>
    </div>
  );
}
