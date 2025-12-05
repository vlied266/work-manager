"use client";

import { Float, Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type RibbonProps = {
  color: string;
  scale?: number;
  offset?: number;
};

function Ribbon({ color, scale = 1, offset = 0 }: RibbonProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const wobble = useMemo(() => 0.4 + Math.random() * 0.6, []);
  const spin = useMemo(() => 0.2 + Math.random() * 0.3, []);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime() * wobble + offset;
    mesh.current.position.set(
      Math.sin(t * 0.9) * 1.8,
      Math.cos(t * 0.6) * 0.9,
      Math.cos(t) * 1.4
    );
    mesh.current.rotation.x = t * 0.4;
    mesh.current.rotation.y = t * spin;
  });

  return (
    <mesh ref={mesh} scale={scale}>
      <torusKnotGeometry args={[0.45, 0.15, 180, 24]} />
      <meshStandardMaterial
        color={color}
        metalness={0.75}
        roughness={0.25}
        envMapIntensity={1.1}
      />
    </mesh>
  );
}

type OrbProps = {
  color: string;
  radius?: number;
  speed?: number;
  scale?: number;
};

function Orb({ color, radius = 2, speed = 0.35, scale = 0.6 }: OrbProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime() * speed + offset;
    mesh.current.position.set(
      Math.cos(t) * radius,
      Math.sin(t * 0.7) * radius * 0.4,
      Math.sin(t) * radius
    );
    mesh.current.rotation.y = t * 0.5;
  });

  return (
    <mesh ref={mesh} scale={scale}>
      <icosahedronGeometry args={[0.7, 0]} />
      <meshStandardMaterial color={color} wireframe />
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
        <directionalLight position={[4, 5, 2]} intensity={1.5} />
        <directionalLight position={[-4, -3, -2]} intensity={0.3} />

        <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.8}>
          <Ribbon color="#818cf8" scale={1.1} />
        </Float>
        <Float speed={1} rotationIntensity={0.8} floatIntensity={1.2}>
          <Ribbon color="#f472b6" scale={0.6} offset={1.2} />
        </Float>
        <Float speed={0.8} rotationIntensity={0.5} floatIntensity={1}>
          <Ribbon color="#34d399" scale={0.75} offset={2.4} />
        </Float>

        <Orb color="#a5b4fc" radius={2.2} speed={0.25} scale={0.35} />
        <Orb color="#fcd34d" radius={1.6} speed={0.5} scale={0.3} />

        <Sparkles
          count={160}
          speed={0.2}
          scale={[6, 4, 6]}
          size={3}
          color="#38bdf8"
        />
      </Canvas>
    </div>
  );
}
