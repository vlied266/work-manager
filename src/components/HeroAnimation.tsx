"use client";

import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, MeshTransmissionMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";

const palette = {
  aqua: "#7dd3fc",
  lilac: "#c4b5fd",
  blush: "#f9a8d4",
  gold: "#fde68a",
  ice: "#f8fafc",
  midnight: "#020617",
};

function AtomicCore() {
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!haloRef.current) return;
    const t = state.clock.elapsedTime;
    haloRef.current.scale.setScalar(1 + Math.sin(t * 1.3) * 0.06);
    const material = haloRef.current.material as THREE.MeshBasicMaterial;
    if (material) {
      material.opacity = 0.15 + (Math.cos(t * 1.7) + 1) * 0.1;
    }
  });

  return (
    <group>
      <Sphere args={[0.65, 128, 128]}>
        <MeshTransmissionMaterial
          backside
          samples={24}
          resolution={1024}
          transmission={0.95}
          thickness={2.1}
          roughness={0.08}
          ior={1.4}
          chromaticAberration={0.45}
          anisotropy={0.2}
          distortion={0.2}
          temporalDistortion={0.1}
          color={palette.aqua}
          iridescence={0.4}
          iridescenceIOR={1.03}
          iridescenceThicknessRange={[80, 480]}
          clearcoat={1}
          clearcoatRoughness={0.15}
        />
      </Sphere>
      <Sphere args={[0.28, 64, 64]}>
        <meshStandardMaterial
          color={palette.gold}
          emissive={palette.gold}
          emissiveIntensity={1.3}
          roughness={0.2}
          metalness={0.4}
        />
      </Sphere>
      <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.95, 1.2, 128]} />
        <meshBasicMaterial color={palette.aqua} transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

type AuroraRibbonProps = {
  radius: number;
  thickness: number;
  color: string;
  speed: number;
  tilt?: [number, number, number];
  stretch?: [number, number, number];
};

function AuroraRibbon({ radius, thickness, color, speed, tilt = [0, 0, 0], stretch = [1, 1, 1] }: AuroraRibbonProps) {
  const ribbonRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ribbonRef.current) {
      ribbonRef.current.rotation.y += delta * speed;
    }
  });

  return (
    <group ref={ribbonRef} rotation={tilt} scale={stretch}>
      <mesh>
        <torusGeometry args={[radius, thickness, 96, 256]} />
        <meshStandardMaterial
          color={color}
          metalness={0.7}
          roughness={0.08}
          emissive={color}
          emissiveIntensity={0.35}
        />
      </mesh>
    </group>
  );
}

type WorkflowNodeProps = {
  radius: number;
  size: number;
  speed: number;
  phase: number;
  color: string;
};

function WorkflowNode({ radius, size, speed, phase, color }: WorkflowNodeProps) {
  const nodeRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!nodeRef.current) return;
    const t = state.clock.elapsedTime * speed + phase;
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    const y = Math.sin(t * 0.6) * 0.12;
    nodeRef.current.position.set(x, y, z);
    nodeRef.current.rotation.y = t;
  });

  return (
    <group ref={nodeRef}>
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>
    </group>
  );
}

type ParticleData = {
  position: [number, number, number];
  speed: number;
  size: number;
  color: string;
};

const createParticleData = (): ParticleData[] =>
  Array.from({ length: 8 }, (_, index) => {
    const seed = index * 0.37;
    const random = (offset: number) => {
      const value = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
      const normalized = value - Math.floor(value);
      return normalized < 0 ? normalized + 1 : normalized;
    };

    const radius = 1.6 + random(1) * 1.2;
    const theta = random(2) * Math.PI * 2;
    const phi = Math.acos(random(3) * 2 - 1);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta) * 0.4;
    const z = radius * Math.cos(phi);

    const colors = [palette.aqua, palette.lilac, palette.blush];

    return {
      position: [x, y, z] as [number, number, number],
      speed: 0.6 + random(4) * 0.4,
      size: 0.05 + random(5) * 0.04,
      color: colors[index % colors.length],
    };
  });

function SoftParticles() {
  const particles = useMemo(createParticleData, []);
  return (
    <>
      {particles.map((particle, index) => (
        <Float
          key={`${particle.color}-${index}`}
          speed={particle.speed}
          rotationIntensity={0.1}
          floatIntensity={0.2}
          floatingRange={[-0.05, 0.05]}
        >
          <mesh position={particle.position}>
            <sphereGeometry args={[particle.size, 16, 16]} />
            <meshBasicMaterial color={particle.color} transparent opacity={0.55} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function GroundHalo() {
  return (
    <group position={[0, -1.4, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 2.4, 64]} />
        <meshBasicMaterial color={palette.lilac} transparent opacity={0.18} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.8, 64]} />
        <meshBasicMaterial color={palette.midnight} transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function AtomicReadySystem({ mouse }: { mouse: [number, number] }) {
  const systemRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!systemRef.current) return;
    systemRef.current.rotation.y += (mouse[0] * 0.5 - systemRef.current.rotation.y) * 0.08;
    systemRef.current.rotation.x += (mouse[1] * 0.3 - systemRef.current.rotation.x) * 0.08;
    systemRef.current.position.x += (mouse[0] * 0.4 - systemRef.current.position.x) * 0.05;
    systemRef.current.position.y += (mouse[1] * 0.25 - systemRef.current.position.y) * 0.05;
  });

  const nodes = useMemo(
    () => [
      { radius: 1.2, size: 0.08, speed: 0.9, phase: 0, color: palette.aqua },
      { radius: 1.55, size: 0.09, speed: 0.7, phase: Math.PI / 2, color: palette.blush },
      { radius: 1.85, size: 0.07, speed: 0.6, phase: Math.PI, color: palette.lilac },
    ],
    []
  );

  return (
    <group ref={systemRef}>
      <Float speed={0.6} rotationIntensity={0.2} floatIntensity={0.35} floatingRange={[-0.1, 0.1]}>
        <AtomicCore />
      </Float>
      <AuroraRibbon
        radius={1.3}
        thickness={0.04}
        color={palette.aqua}
        speed={0.4}
        tilt={[0.5, 0.1, -0.1]}
        stretch={[1.2, 0.9, 1]}
      />
      <AuroraRibbon
        radius={1.85}
        thickness={0.035}
        color={palette.lilac}
        speed={-0.3}
        tilt={[0.1, -0.4, 0.2]}
        stretch={[0.9, 1.1, 1]}
      />
      {nodes.map((node) => (
        <WorkflowNode key={`${node.color}-${node.radius}`} {...node} />
      ))}
      <SoftParticles />
      <GroundHalo />
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
        border: "none",
        outline: "none",
        background: "transparent",
        backgroundColor: "transparent",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMouse([0, 0])}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 40 }}
        dpr={[1, 2]}
        style={{
          background: "transparent !important",
          backgroundColor: "transparent !important",
          margin: 0,
          padding: 0,
          display: "block",
          width: "100%",
          height: "100%",
          border: "none",
          outline: "none",
          boxShadow: "none",
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
          clearColor: "transparent",
        }}
      >
        <ambientLight intensity={0.8} color="#f1f5f9" />
        <directionalLight position={[4, 5, 5]} intensity={1.5} color={palette.ice} />
        <directionalLight position={[-4, -3, 2]} intensity={0.9} color="#c7d2fe" />
        <spotLight
          position={[0, 6, 0]}
          angle={0.6}
          penumbra={0.6}
          intensity={1.2}
          color="#a5f3fc"
        />

        <AtomicReadySystem mouse={mouse} />

        <Environment preset="studio" blur={0.9} background={false} />
      </Canvas>
    </div>
  );
}
